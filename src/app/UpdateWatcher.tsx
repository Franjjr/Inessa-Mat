/* Keeps every device on the latest build. Checks /version.json when the app opens, when the tab comes back to the
   front and every 10 minutes; when the server has a newer build, it reloads with hardRefresh() — but never in the
   middle of an exercise: it waits until the child is on a map, a menu or the adult area. Also reloads when a new
   service worker takes over a page that already had one (the old JS/CSS would otherwise keep running). */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_VERSION, fetchServerVersion, hardRefresh, isSafeToReload, shouldTryUpdate } from './version'

const CHECK_EVERY_MS = 10 * 60_000
const SW_UPDATE = 'sw-update'

export function UpdateWatcher() {
  const { pathname } = useLocation()
  const pathRef = useRef(pathname)
  const pending = useRef<string | null>(null)

  const apply = () => {
    const v = pending.current
    if (!v || !isSafeToReload(pathRef.current)) return
    pending.current = null
    if (!shouldTryUpdate(v)) return
    // The new service worker already holds the new build: a plain reload is enough (no need to download it again).
    if (v === SW_UPDATE) window.location.reload()
    else void hardRefresh()
  }

  // Each navigation is a chance to apply an update that was waiting for the child to finish.
  useEffect(() => {
    pathRef.current = pathname
    apply()
  }, [pathname])

  useEffect(() => {
    if (APP_VERSION === 'dev') return
    let alive = true
    const check = async () => {
      const server = await fetchServerVersion()
      if (!alive || !server || server === APP_VERSION) return
      pending.current = server
      apply()
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void check() }
    void check()
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => void check(), CHECK_EVERY_MS)

    // A new service worker took control (skipWaiting + clientsClaim): this page still runs the old build.
    const sw = navigator.serviceWorker
    const hadController = !!sw?.controller
    const onController = () => {
      if (!hadController) return
      pending.current = pending.current ?? SW_UPDATE
      apply()
    }
    sw?.addEventListener('controllerchange', onController)

    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
      sw?.removeEventListener('controllerchange', onController)
    }
  }, [])

  return null
}
