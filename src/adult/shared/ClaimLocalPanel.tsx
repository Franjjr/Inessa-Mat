/* Offers to move the profiles created on this device (local-only mode) into the signed-in account. */
import { useState } from 'react'
import type { ChildProfile } from '@/types'
import { useAuth, useChildren, useSyncStatus } from '@/data'
import { Button, toast } from '@/ui'
import { errorMessage } from './messages'
import s from './adult.module.css'

/** Profiles that exist only on this device; undefined while the list is still loading. */
export function localOnlyChildren(): ChildProfile[] | undefined {
  const all = useChildren()
  return all?.filter((c) => c.orgId === null)
}

/** Names compared without case, accents or spaces at the ends («Lia» and « lía» are the same name). */
const plain = (name: string) => name.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('es')
const sameName = (a: string, b: string) => plain(a) === plain(b)

export function ClaimLocalPanel({ onDone, onSkip }: { onDone?: () => void; onSkip?: () => void }) {
  const { status, activeOrg, claimLocalData } = useAuth()
  const all = useChildren()
  const locals = all?.filter((c) => c.orgId === null) ?? []
  // A profile of this device whose name the account already has is probably the same child: saving it would make a second
  // copy, so it is left unticked and the adult decides (a merge of both progresses is not offered yet).
  const inAccount = all?.filter((c) => c.orgId !== null && c.orgId === activeOrg?.id) ?? []
  const twinOf = (c: ChildProfile) => inAccount.find((a) => sameName(a.nickname, c.nickname))
  // Until the first sync of this session has brought the account's profiles, a twin cannot be told apart: wait for it.
  const { lastSyncedAt } = useSyncStatus()
  const accountLoaded = lastSyncedAt !== null
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  if (status !== 'signed-in' || locals.length === 0 || hidden) return null
  const skip = onSkip ?? (() => setHidden(true))

  const isPicked = (c: ChildProfile) => picked[c.id] ?? !twinOf(c)
  const chosen = locals.filter(isPicked)
  const anyTwin = locals.some((c) => twinOf(c))
  const names = locals.map((c) => c.nickname)
  const listed = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { children } = await claimLocalData(chosen.map((c) => c.id))
      toast(children === 1 ? 'Perfil guardado en tu cuenta' : 'Perfiles guardados en tu cuenta')
      onDone?.()
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar los perfiles ahora. Inténtalo de nuevo cuando tengas conexión.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={s.card} aria-labelledby="claim-title">
      <h2 id="claim-title" className={s.subheading}>
        {locals.length === 1 ? 'Hay un perfil guardado solo en este dispositivo' : 'Hay perfiles guardados solo en este dispositivo'}
      </h2>
      <p className={s.lead}>
        {listed} {locals.length === 1 ? 'se usa' : 'se usan'} sin cuenta. Si lo guardas en tu cuenta{activeOrg ? ` (${activeOrg.name})` : ''},
        sus avances tendrán copia segura y podrás verlos desde cualquier dispositivo.
      </p>
      {anyTwin && (
        <ul className={s.stack} style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8 }} aria-label="Perfiles que guardar">
          {locals.map((c) => (
            <li key={c.id}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44 }}>
                <input
                  type="checkbox" checked={isPicked(c)} disabled={busy}
                  onChange={(e) => setPicked((p) => ({ ...p, [c.id]: e.target.checked }))}
                />
                <span>
                  <strong>{c.nickname}</strong>
                  {twinOf(c) && (
                    <span className={s.hint} style={{ display: 'block' }}>
                      En tu cuenta ya hay un perfil llamado «{twinOf(c)!.nickname}». Si es la misma persona, déjalo sin marcar: se
                      duplicaría. Lo que ha hecho en este dispositivo se queda solo aquí: por ahora no se puede unir a su perfil de la
                      cuenta.
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {!accountLoaded && <p className={s.hint} role="status">Comprobando los perfiles que ya tiene tu cuenta…</p>}
      {error && <p className={s.error} role="alert">{error}</p>}
      <div className={s.actions}>
        <Button onClick={() => void save()} disabled={busy || !activeOrg || chosen.length === 0 || !accountLoaded}>
          {busy ? 'Guardando…' : chosen.length === 1 ? 'Guardarlo en mi cuenta' : 'Guardarlos en mi cuenta'}
        </Button>
        <Button variant="ghost" onClick={skip} disabled={busy}>
          Ahora no
        </Button>
      </div>
      {!activeOrg && <p className={s.hint}>Primero hay que crear la familia o el colegio en tu cuenta.</p>}
    </section>
  )
}
