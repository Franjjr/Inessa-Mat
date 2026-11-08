/* ChildPickerScreen (/kids): who is playing today. Big cards with each child's companion. The adult entry sits
   quietly at the bottom and leads to the adult gate. With an account, «Cerrar sesión» sits next to it: it asks first,
   so a child who taps it by chance just cancels. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompanionArt, WorldBackground } from '@/art'
import { speciesNoun } from '@/content'
import { useActiveChild, useAuth, useChildren } from '@/data'
import { Button, Screen, Spinner } from '@/ui'
import type { ChildProfile } from '@/types'
import s from './ChildPickerScreen.module.css'
import { APP_VERSION } from '@/app/version'
import { lockAdultArea } from '@/adult/gate/AdultGate'
import { ConfirmModal } from '@/adult/shared/ConfirmModal'
import { errorMessage } from '@/adult/shared/messages'

export default function ChildPickerScreen() {
  const navigate = useNavigate()
  const children = useChildren()
  const { setActiveChild } = useActiveChild()
  const { status, user, signOut } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (children === undefined) return <Spinner />

  const choose = (child: ChildProfile) => {
    setActiveChild(child.id)
    navigate('/play')
  }

  const signOutNow = async () => {
    setBusy(true)
    setError(null)
    try {
      // Lock first: the adult area must close even if the sign-out request fails.
      lockAdultArea()
      await signOut()
      navigate('/welcome', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Screen className={s.screen}>
      <WorldBackground id="sky" vividness={1} className={s.bg} />
      <div className={s.inner}>
        <header className={s.header}>
          <h1 className={s.title}>¿Quién juega hoy?</h1>
          <p className={s.sub}>Elige tu cuaderno de aventuras y tu compañero te estará esperando.</p>
        </header>

        <ul className={s.grid} aria-label="Niños en este dispositivo">
          {children.map((child) => (
            <li key={child.id}>
              <button type="button" className={s.card} onClick={() => choose(child)} aria-label={`Jugar como ${child.nickname}`}>
                <span className={s.art}>
                  <CompanionArt
                    species={child.companion.species}
                    colorway={child.companion.colorway}
                    equipped={child.companion.equipped}
                    size={132}
                    animated
                  />
                </span>
                <span className={s.name}>{child.nickname}</span>
                <span className={s.pet}>
                  con {child.companion.name} ({speciesNoun(child.companion.species, child.companion.gender).noun})
                </span>
                <span className={s.play}>¡A jugar!</span>
              </button>
            </li>
          ))}

          <li>
            <button type="button" className={s.add} onClick={() => navigate('/kids/new')}>
              <span className={s.plus} aria-hidden="true">+</span>
              <span className={s.addText}>Añadir otro niño</span>
            </button>
          </li>
        </ul>

        <footer className={s.footer}>
          <Button variant="ghost" size="sm" className={s.touch} onClick={() => navigate('/adult')}>
            Soy padre, madre o profesor
          </Button>
          {status === 'signed-in' && (
            <Button variant="ghost" size="sm" className={s.touch} onClick={() => { setError(null); setConfirming(true) }}>
              Cerrar sesión
            </Button>
          )}
          <p className={s.version}>Versión {APP_VERSION}</p>
        </footer>
      </div>
      <ConfirmModal
        open={confirming}
        title="¿Cerrar sesión?"
        confirmLabel="Cerrar sesión"
        danger
        busy={busy}
        error={error}
        onConfirm={() => void signOutNow()}
        onCancel={() => setConfirming(false)}
      >
        <p>
          {user?.email ? <>Se cerrará la sesión de <strong>{user.email}</strong> en este dispositivo.</> : 'Se cerrará la sesión en este dispositivo.'}
          {' '}Para volver a entrar, habrá que iniciar sesión otra vez.
        </p>
      </ConfirmModal>
    </Screen>
  )
}
