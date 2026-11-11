/* Which build is running, and how to get the latest one.

   - APP_VERSION / APP_BUILT_AT are injected at build time (vite.config.ts → define). The same version is written to
     /version.json, which is never precached by the service worker and is fetched with cache: 'no-store', so the app
     can tell whether the server has a newer build than the one it runs.
   - The service worker (vite-plugin-pwa, autoUpdate) serves the precached OLD build first and installs the new one in
     the background; a slow or failed install could leave a device on an old build for days. hardRefresh() removes the
     service worker and its precache (keeping the voice clips) and reloads from the network: the newest build, always. */

declare const __APP_VERSION__: string
declare const __APP_BUILT_AT__: string

export const APP_VERSION: string = import.meta.env.DEV || typeof __APP_VERSION__ !== 'string' ? 'dev' : __APP_VERSION__
export const APP_BUILT_AT: string = typeof __APP_BUILT_AT__ === 'string' ? __APP_BUILT_AT__ : ''

/** Caches kept by a hard refresh: the natural-voice clips (immutable, expensive to download again). */
const KEEP_CACHES = new Set(['repasitos-voice'])

/** «fd37a42 · 5 nov 2026, 21:56» — shown to adults so support can tell which build a device runs. */
export function versionLabel(): string {
  if (!APP_BUILT_AT) return APP_VERSION
  const d = new Date(APP_BUILT_AT)
  if (Number.isNaN(d.getTime())) return APP_VERSION
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${APP_VERSION} · ${date}, ${time}`
}

/** The version the server has now, or null (offline, dev server, bad answer). */
export async function fetchServerVersion(): Promise<string | null> {
  if (APP_VERSION === 'dev') return null
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { version?: unknown }
    return typeof data.version === 'string' && data.version ? data.version : null
  } catch {
    return null
  }
}

/** Removes the service worker and the app caches (not the voice clips), then reloads `url` from the network. */
export async function hardRefresh(url: string = window.location.href): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
    await Promise.all(regs.map((r) => r.unregister().catch(() => false)))
  } catch { /* no service worker support */ }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => !KEEP_CACHES.has(k)).map((k) => caches.delete(k)))
    }
  } catch { /* storage blocked */ }
  window.location.replace(url)
}

const TRIED_KEY = 'repasitos:update-tried'

/** True once per server version and session: guards against a reload loop if the CDN still serves the old build. */
export function shouldTryUpdate(serverVersion: string): boolean {
  try {
    if (sessionStorage.getItem(TRIED_KEY) === serverVersion) return false
    sessionStorage.setItem(TRIED_KEY, serverVersion)
  } catch { /* storage blocked: still try once */ }
  return true
}

/** Support link: https://repasitos.es/?actualizar=1 forces a hard refresh, then opens the same page without the flag.
    Returns true when it started one (the caller should not render the app). */
export function handleForceUpdateLink(): boolean {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('actualizar')) return false
  url.searchParams.delete('actualizar')
  void hardRefresh(url.toString())
  return true
}

/** Routes where reloading would interrupt the child mid-exercise: an update waits until they leave. */
const BUSY_ROUTE = /^\/(play\/w\/[^/]+\/[^/]+|play\/(sesion|lengua|ingles|clase|prueba|prueba-lengua|prueba-ingles|review|caligrafia|free|cancion)(\/|$)|kids\/new)/

export function isSafeToReload(pathname: string): boolean {
  return !BUSY_ROUTE.test(pathname)
}
