/* The offer at the end of the Lengua session: «¿Practicamos la letra con el lápiz?». The screen shows it only when
   showCaligrafiaAtEnd says so. «Ahora no» goes home, as «Volver al inicio» does. */
import { useNavigate } from 'react-router-dom'
import { caligrafiaOffered } from '@/engine/caligrafia/offer'
import { useInputMode } from '@/ink'
import type { ChildProfile } from '@/types'
import { Button } from '@/ui'
import s from './session.module.css'

/** Whether the practice is offered to this child on this device now. */
export function useCaligrafiaOffered(child: ChildProfile): boolean {
  const { mode, penSeen } = useInputMode()
  return caligrafiaOffered(child, { penSeen, mode })
}

/** The card only; the screen decides whether it is offered (showCaligrafiaAtEnd) and calls this once. */
export function CaligrafiaOffer({ onLater }: { onLater: () => void }) {
  const navigate = useNavigate()
  return (
    <div className={s.actions} role="group" aria-label="Caligrafía con lápiz">
      <p className={s.text}>¿Practicamos la letra con el lápiz? Son 5 minutos.</p>
      <Button size="lg" variant="success" onClick={() => navigate('/play/caligrafia')}>Caligrafía (con lápiz)</Button>
      <Button size="lg" variant="secondary" onClick={onLater}>Ahora no</Button>
    </div>
  )
}
