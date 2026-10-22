/* Supabase Auth, organizations and memberships. Drives the auth store (store.ts).
   Offline-friendly: the last account state is cached in meta so a signed-in family keeps playing without network
   even when the access token expired (Supabase refreshes it when the device is back online). */
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { Membership, Organization, OrgKind } from '@/types'
import { db } from './db'
import { DataError, isNetworkError, toDataError } from './errors'
import { membershipFromRow, organizationFromRow, profileFromRow } from './mappers'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { enqueueMany } from './outbox'
import { getAuth, setAuth, type AuthSnapshot } from './store'
import { AUTH_STORAGE_KEY, getSupabase, isBackendAvailable } from './supabase'
import { runSync, startSyncEngine } from './sync'
import type { SyncTable } from './types'
import { nextTimestamp } from './util'

type AccountData = Pick<AuthSnapshot, 'profile' | 'memberships' | 'organizations'>

interface CachedAccount extends AccountData {
  activeOrgId: string | null
}

const ROLE_ORDER: Membership['role'][] = ['owner', 'admin', 'teacher', 'guardian']

let generation = 0
let loadedFor: string | null = null
const inflight = new Map<string, Promise<void>>()

function origin(): string {
  return typeof location !== 'undefined' ? location.origin : 'http://localhost:5173'
}

async function backend(): Promise<SupabaseClient> {
  if (!isBackendAvailable()) throw new DataError('no-backend')
  const sb = await getSupabase()
  if (!sb) throw new DataError('no-backend')
  return sb
}

function requireSignedIn(): { userId: string } {
  const a = getAuth()
  if (a.status !== 'signed-in' || !a.user) throw new DataError('not-signed-in')
  return { userId: a.user.id }
}

function cleanEmail(email: string): string {
  const e = String(email ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new DataError('invalid', 'Ese correo no parece válido. Revísalo.')
  return e
}

function hasStoredSession(): boolean {
  try {
    return typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(AUTH_STORAGE_KEY))
  } catch {
    return false
  }
}

// ------------------------------------------------------------------------------------------------ account loading

async function fetchAccount(sb: SupabaseClient, user: User): Promise<AccountData> {
  // Invites addressed to this (confirmed) e-mail are accepted automatically.
  await sb.rpc('claim_invites').then(() => undefined, () => undefined)

  const loadMemberships = async () => {
    const { data, error } = await sb.from('memberships').select('*').eq('user_id', user.id)
    if (error) throw error
    return (data ?? []).map(membershipFromRow)
  }
  let memberships = await loadMemberships()

  // First sign-in after sign-up with e-mail confirmation: create the organization chosen at sign-up.
  const meta = (user.user_metadata ?? {}) as { org_kind?: string; org_name?: string }
  if (!memberships.length && (meta.org_kind === 'family' || meta.org_kind === 'school') && meta.org_name) {
    const { error } = await sb.rpc('create_organization', { p_kind: meta.org_kind, p_name: meta.org_name })
    if (!error) {
      await sb.auth.updateUser({ data: { org_kind: null, org_name: null } }).then(() => undefined, () => undefined)
      memberships = await loadMemberships()
    }
  }

  const orgIds = memberships.map((m) => m.orgId)
  let organizations: Organization[] = []
  if (orgIds.length) {
    const { data, error } = await sb.from('organizations').select('*').in('id', orgIds)
    if (error) throw error
    organizations = (data ?? []).map(organizationFromRow).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  const { data: p, error: pe } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (pe) throw pe
  const profile = p
    ? profileFromRow(p)
    : { id: user.id, email: user.email ?? null, displayName: String(user.user_metadata?.display_name ?? ''), locale: 'es-ES', createdAt: user.created_at }
  return { profile, memberships, organizations }
}

async function chooseActiveOrg(userId: string, orgs: Organization[], memberships: Membership[]): Promise<Organization | null> {
  if (!orgs.length) return null
  const saved = await getMeta<string>(META.activeOrg(userId))
  const found = orgs.find((o) => o.id === saved)
  if (found) return found
  const rank = (o: Organization) => ROLE_ORDER.indexOf(memberships.find((m) => m.orgId === o.id)?.role ?? 'guardian')
  // Prefer a family (the child's home), then the org where the adult has the strongest role.
  return [...orgs].sort((a, b) => (a.kind === b.kind ? rank(a) - rank(b) : a.kind === 'family' ? -1 : 1))[0]
}

async function loadAccountFor(user: User, gen: number): Promise<void> {
  const key = user.id
  const existing = inflight.get(key)
  if (existing) return existing
  const p = (async () => {
    const basic = { id: user.id, email: user.email ?? null }
    const cached = await getMeta<CachedAccount>(META.authCache(user.id))
    if (gen !== generation) return
    if (cached) {
      const activeOrg = cached.organizations.find((o) => o.id === cached.activeOrgId) ?? null
      setAuth({ status: 'signed-in', user: basic, profile: cached.profile, memberships: cached.memberships, organizations: cached.organizations, activeOrg, offline: false })
    } else {
      setAuth({ status: 'loading', user: basic })
    }
    await setMeta(META.lastUserId, user.id)
    await deleteMeta(META.mode)
    try {
      const sb = await backend()
      const acct = await fetchAccount(sb, user)
      if (gen !== generation) return
      const activeOrg = await chooseActiveOrg(user.id, acct.organizations, acct.memberships)
      setAuth({ status: 'signed-in', user: basic, ...acct, activeOrg, offline: false })
      await setMeta(META.authCache(user.id), { ...acct, activeOrgId: activeOrg?.id ?? null } satisfies CachedAccount)
      if (activeOrg) await setMeta(META.activeOrg(user.id), activeOrg.id)
      loadedFor = user.id
    } catch (e) {
      if (gen !== generation) return
      console.warn('[numeria/auth] could not load the account:', e)
      if (!cached) setAuth({ status: 'signed-in', user: basic, profile: null, memberships: [], organizations: [], activeOrg: null })
      setAuth({ offline: isNetworkError(e) })
    }
  })().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

async function handleSignedOut(): Promise<void> {
  loadedFor = null
  await deleteMeta(META.lastUserId)
  const mode = await getMeta<string>(META.mode)
  setAuth({
    status: mode === 'local-only' ? 'local-only' : 'anonymous',
    user: null, profile: null, memberships: [], organizations: [], activeOrg: null, offline: false, passwordRecovery: false,
  })
}

/** No session at start-up: maybe signed out, maybe just offline with an expired token. */
async function handleNoSession(gen: number): Promise<void> {
  const lastUserId = await getMeta<string>(META.lastUserId)
  if (gen !== generation) return
  if (lastUserId && hasStoredSession()) {
    const cached = await getMeta<CachedAccount>(META.authCache(lastUserId))
    if (cached) {
      const activeOrg = cached.organizations.find((o) => o.id === cached.activeOrgId) ?? null
      setAuth({
        status: 'signed-in', user: { id: lastUserId, email: cached.profile?.email ?? null }, profile: cached.profile,
        memberships: cached.memberships, organizations: cached.organizations, activeOrg, offline: true,
      })
      return
    }
  }
  const mode = await getMeta<string>(META.mode)
  if (gen !== generation) return
  setAuth({ status: mode === 'local-only' ? 'local-only' : 'anonymous', user: null, offline: false })
}

async function handleAuthEvent(event: string, session: Session | null, gen: number): Promise<void> {
  if (gen !== generation) return
  if (event === 'PASSWORD_RECOVERY') setAuth({ passwordRecovery: true })
  if (session?.user) {
    const a = getAuth()
    const same = a.status === 'signed-in' && a.user?.id === session.user.id && !a.offline && loadedFor === session.user.id
    if (same) {
      if (a.user?.email !== (session.user.email ?? null)) setAuth({ user: { id: session.user.id, email: session.user.email ?? null } })
      return
    }
    await loadAccountFor(session.user, gen)
    return
  }
  if (event === 'SIGNED_OUT') {
    // The event is deferred: it can arrive after a newer sign-in already loaded the account. Act only if there is
    // still no session.
    const sb = await getSupabase()
    const current = sb ? (await sb.auth.getSession()).data.session : null
    if (current) return
    return handleSignedOut()
  }
  if (event === 'INITIAL_SESSION') return handleNoSession(gen)
}

/** Starts auth + sync for the app (AuthProvider). Ref-counted and StrictMode-safe. */
let refs = 0
let teardown: (() => void) | null = null
let pendingTeardown: ReturnType<typeof setTimeout> | null = null

export function startAuth(): () => void {
  refs++
  if (pendingTeardown) {
    clearTimeout(pendingTeardown)
    pendingTeardown = null
  }
  if (!teardown) teardown = initAuth()
  let done = false
  return () => {
    if (done) return
    done = true
    refs--
    if (refs === 0) {
      // Deferred so React StrictMode's unmount/remount does not restart everything.
      pendingTeardown = setTimeout(() => {
        pendingTeardown = null
        if (refs === 0 && teardown) {
          teardown()
          teardown = null
        }
      }, 0)
    }
  }
}

function initAuth(): () => void {
  const gen = ++generation
  const disposers: (() => void)[] = [startSyncEngine()]
  if (!isBackendAvailable()) {
    setAuth({ status: 'local-only', backendAvailable: false })
    return () => {
      generation++
      disposers.forEach((d) => d())
    }
  }
  setAuth({ backendAvailable: true })
  void (async () => {
    const sb = await getSupabase()
    if (!sb || gen !== generation) return
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      // Never await Supabase calls inside this callback (it holds the auth lock): defer.
      setTimeout(() => void handleAuthEvent(event, session, gen), 0)
    })
    disposers.push(() => data.subscription.unsubscribe())
  })()

  if (typeof window !== 'undefined') {
    const onOnline = async () => {
      if (!getAuth().offline) return
      const sb = await getSupabase()
      if (!sb) return
      const { data, error } = await sb.auth.getSession()
      if (data.session?.user) await loadAccountFor(data.session.user, gen)
      else if (!error && !hasStoredSession()) await handleSignedOut() // the session was revoked meanwhile
    }
    window.addEventListener('online', onOnline)
    disposers.push(() => window.removeEventListener('online', onOnline))
  }
  return () => {
    generation++
    disposers.forEach((d) => d())
  }
}

// ------------------------------------------------------------------------------------------------ actions

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = await backend()
  const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail(email), password: String(password ?? '') })
  if (error) throw toDataError(error)
  if (data.user) await loadAccountFor(data.user, generation)
}

/** After it resolves, `status === 'signed-in'` means the account is ready; otherwise a confirmation e-mail was sent. */
export async function signUp(input: { email: string; password: string; displayName: string; orgKind: OrgKind; orgName: string }): Promise<void> {
  const sb = await backend()
  const email = cleanEmail(input.email)
  const password = String(input.password ?? '')
  if (password.length < 8) throw new DataError('weak-password')
  const displayName = String(input.displayName ?? '').trim().slice(0, 80)
  if (!displayName) throw new DataError('invalid', 'Escribe tu nombre.')
  const orgName = String(input.orgName ?? '').trim().slice(0, 120)
  if (!orgName) throw new DataError('invalid', input.orgKind === 'school' ? 'Escribe el nombre del colegio.' : 'Escribe un nombre para tu familia.')
  if (input.orgKind !== 'family' && input.orgKind !== 'school') throw new DataError('invalid')
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, org_kind: input.orgKind, org_name: orgName }, emailRedirectTo: `${origin()}/login` },
  })
  if (error) throw toDataError(error)
  // With e-mail confirmation on, Supabase answers an existing address with a user that has no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new DataError('email-taken')
  if (data.session?.user) await loadAccountFor(data.session.user, generation)
}

export async function sendMagicLink(email: string): Promise<void> {
  const sb = await backend()
  const { error } = await sb.auth.signInWithOtp({ email: cleanEmail(email), options: { shouldCreateUser: false, emailRedirectTo: `${origin()}/` } })
  if (error) throw toDataError(error)
}

export async function resetPassword(email: string): Promise<void> {
  const sb = await backend()
  const { error } = await sb.auth.resetPasswordForEmail(cleanEmail(email), { redirectTo: `${origin()}/login?reset=1` })
  if (error) throw toDataError(error)
}

/** Sets a new password (after a reset link: auth.passwordRecovery is true). */
export async function updatePassword(newPassword: string): Promise<void> {
  const sb = await backend()
  if (String(newPassword ?? '').length < 8) throw new DataError('weak-password')
  const { error } = await sb.auth.updateUser({ password: newPassword })
  if (error) throw toDataError(error)
  setAuth({ passwordRecovery: false })
}

export async function signOut(): Promise<void> {
  await pendingActiveOrgWrite
  const sb = await getSupabase()
  try {
    await sb?.auth.signOut({ scope: 'local' })
  } catch {
    /* offline: the local session is removed anyway */
  }
  await handleSignedOut()
}

export function continueLocalOnly(): void {
  const a = getAuth()
  if (a.status === 'signed-in') return
  void setMeta(META.mode, 'local-only')
  setAuth({ status: 'local-only' })
}

/** The active-org choice is persisted fire-and-forget; signOut waits for it so a quick sign-out never loses it. */
let pendingActiveOrgWrite: Promise<unknown> = Promise.resolve()

export function setActiveOrg(orgId: string): void {
  const a = getAuth()
  const org = a.organizations.find((o) => o.id === orgId)
  if (!org || !a.user) return
  setAuth({ activeOrg: org })
  const userId = a.user.id
  pendingActiveOrgWrite = Promise.all([
    setMeta(META.activeOrg(userId), org.id),
    getMeta<CachedAccount>(META.authCache(userId)).then((c) => (c ? setMeta(META.authCache(userId), { ...c, activeOrgId: org.id }) : undefined)),
  ]).catch(() => undefined)
}

async function reloadAccount(): Promise<void> {
  const sb = await backend()
  const { data } = await sb.auth.getUser()
  if (!data.user) return
  loadedFor = null
  await loadAccountFor(data.user, generation)
}

export async function createOrganization(kind: OrgKind, name: string): Promise<Organization> {
  requireSignedIn()
  const sb = await backend()
  const n = String(name ?? '').trim()
  if (!n) throw new DataError('invalid', 'Escribe un nombre.')
  const { data, error } = await sb.rpc('create_organization', { p_kind: kind, p_name: n.slice(0, 120) })
  if (error) throw toDataError(error)
  const org = organizationFromRow(data as Record<string, unknown>)
  const hadActive = Boolean(getAuth().activeOrg)
  await reloadAccount()
  if (!hadActive) setActiveOrg(org.id)
  return org
}

/** Invite an adult by e-mail. They join automatically when they sign in (or sign up) with that e-mail. */
export async function inviteMember(orgId: string, email: string, role: Membership['role']): Promise<void> {
  await createInviteLink(orgId, email, role)
}

/** Same as inviteMember, returning a link the adult can also share by WhatsApp/e-mail. */
export async function createInviteLink(orgId: string, email: string, role: Membership['role']): Promise<string> {
  requireSignedIn()
  if (role === 'owner') throw new DataError('invalid', 'No se puede invitar como propietario.')
  const sb = await backend()
  const { data, error } = await sb.rpc('create_invite', { p_org_id: orgId, p_email: cleanEmail(email), p_role: role })
  if (error) throw toDataError(error)
  return `${origin()}/login?invite=${encodeURIComponent(String(data))}`
}

/** Accept an invite link's token (the signed-in e-mail must match the invited one). */
export async function acceptInvite(token: string): Promise<void> {
  requireSignedIn()
  const sb = await backend()
  const { error } = await sb.rpc('accept_invite', { p_token: token })
  if (error) throw toDataError(error)
  await reloadAccount()
}

/** Members of an organization with their display names (for settings screens). */
export async function listOrgMembers(orgId: string): Promise<{ membership: Membership; displayName: string; email: string | null }[]> {
  requireSignedIn()
  const sb = await backend()
  const { data, error } = await sb.from('memberships').select('*').eq('org_id', orgId)
  if (error) throw toDataError(error)
  const ms = (data ?? []).map(membershipFromRow)
  const { data: profiles } = await sb.from('profiles').select('id,display_name,email').in('id', ms.map((m) => m.userId))
  const byId = new Map((profiles ?? []).map((p: Record<string, unknown>) => [String(p.id), p]))
  return ms
    .map((m) => ({ membership: m, displayName: String(byId.get(m.userId)?.display_name ?? ''), email: (byId.get(m.userId)?.email as string | null) ?? null }))
    .sort((a, b) => ROLE_ORDER.indexOf(a.membership.role) - ROLE_ORDER.indexOf(b.membership.role) || a.displayName.localeCompare(b.displayName, 'es'))
}

/** Upload local-only children (and all their data) to the active organization. */
export async function claimLocalData(): Promise<{ children: number }> {
  const a = getAuth()
  if (a.status !== 'signed-in' || !a.user) throw new DataError('not-signed-in')
  const org = a.activeOrg
  if (!org) throw new DataError('invalid', 'Primero crea una familia o un colegio en tu cuenta.')
  const locals = await db.children.filter((c) => c.orgId === null && !c.deletedAt).toArray()
  if (!locals.length) return { children: 0 }
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.outbox], async () => {
    for (const c of locals) {
      await db.children.put({ ...c, orgId: org.id, updatedAt: nextTimestamp(c.updatedAt) })
      const items: { table: SyncTable; key: string; childId: string }[] = [{ table: 'children', key: c.id, childId: c.id }]
      if (await db.progress.get(c.id)) items.push({ table: 'progress', key: c.id, childId: c.id })
      for (const m of await db.mastery.where('childId').equals(c.id).toArray()) items.push({ table: 'mastery', key: `${c.id}|${m.skill}`, childId: c.id })
      for (const s of await db.sessions.where('childId').equals(c.id).primaryKeys()) items.push({ table: 'sessions', key: String(s), childId: c.id })
      for (const t of await db.attempts.where('childId').equals(c.id).primaryKeys()) items.push({ table: 'attempts', key: String(t), childId: c.id })
      for (const r of await db.rewards.where('childId').equals(c.id).toArray()) {
        if (!r.createdBy) await db.rewards.put({ ...r, createdBy: a.user!.id, updatedAt: nextTimestamp(r.updatedAt) })
        items.push({ table: 'rewards', key: r.id, childId: c.id })
      }
      await enqueueMany(items)
    }
  })
  void runSync({ pull: false })
  return { children: locals.length }
}

/** Tests only. */
export function __resetAccountForTests(): void {
  generation++
  loadedFor = null
  inflight.clear()
  if (teardown) teardown()
  teardown = null
  refs = 0
}
