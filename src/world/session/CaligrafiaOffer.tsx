/* The offer at the end of the Lengua session: «¿Practicamos la letra con el lápiz?». Shown only when the practice is
   offered (pen in use, setting on, Lengua on: caligrafiaOffered). «Ahora no» goes home, as it does without the offer. */
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

export function CaligrafiaOffer({ child, onLater }: { child: ChildProfile; onLater: () => void }) {
  const navigate = useNavigate()
  const offered = useCaligrafiaOffered(child)
  if (!offered) return null
  return (
    <div className={s.actions} role="group" aria-label="Caligrafía con lápiz">
      <p className={s.text}>¿Practicamos la letra con el lápiz? Son 5 minutos.</p>
      <Button size="lg" variant="success" onClick={() => navigate('/play/caligrafia')}>Caligrafía (con lápiz)</Button>
      <Button size="lg" variant="secondary" onClick={onLater}>Ahora no</Button>
    </div>
  )
}
