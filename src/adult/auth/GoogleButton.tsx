/* «Continuar con Google»: Google's own button, inside this page (a popup, no redirect), so the session stays in the
   installed app on a tablet. Shown only when the build has a Google client ID and the script loads; otherwise nothing is
   shown and the e-mail ways below are the only ones. */
import { useEffect, useRef, useState } from 'react'
import { googleClientId, signInWithGoogle } from '@/data'
import { errorMessage } from '../shared/messages'
import { loadGoogleIdentity, makeNonce } from './google'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

export function GoogleButton({ context }: { context: 'signin' | 'signup' }) {
  const clientId = googleClientId()
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A new nonce (and a new button) after every attempt: each token can be used once.
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!clientId) return
    let alive = true
    void (async () => {
      try {
        const [gis, nonce] = await Promise.all([loadGoogleIdentity(), makeNonce()])
        if (!alive || !box.current) return
        gis.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          context,
          ux_mode: 'popup',
          itp_support: true,
          auto_select: false,
          callback: (r) => {
            if (!alive) return
            setBusy(true)
            setError(null)
            signInWithGoogle(r.credential ?? '', nonce.raw)
              .catch((e: unknown) => {
                if (alive) setError(errorMessage(e))
              })
              .finally(() => {
                if (!alive) return
                setBusy(false)
                setRound((n) => n + 1)
              })
          },
        })
        box.current.replaceChildren()
        gis.renderButton(box.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill', logo_alignment: 'center',
          text: context === 'signup' ? 'signup_with' : 'continue_with', locale: 'es',
          width: Math.min(400, Math.max(200, Math.round(box.current.getBoundingClientRect().width) || 320)),
        })
        setReady(true)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [clientId, context, round])

  if (!clientId || failed) return null

  return (
    <div className={s.google}>
      <div ref={box} className={s.googleButton} aria-busy={busy || !ready} hidden={busy} />
      {busy && <p className={adult.hint} role="status">Entrando con Google…</p>}
      {error && <p className={adult.error} role="alert">{error}</p>}
      <p className={s.divider}><span>o con tu correo</span></p>
    </div>
  )
}
