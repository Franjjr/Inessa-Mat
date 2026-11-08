/* The offer at the end of a maths session where a times-table fact was missed: «¿Cantamos la del 7?». Optional:
   «Ahora no» goes home, as «Volver al inicio» does. Same card as the handwriting offer (CaligrafiaOffer). */
import { useNavigate } from 'react-router-dom'
import { Button } from '@/ui'
import s from './session.module.css'

export function CancionOffer({ table, onLater }: { table: number; onLater: () => void }) {
  const navigate = useNavigate()
  return (
    <div className={s.offer} role="group" aria-label="Canción de la tabla">
      <p className={s.text}>¿Cantamos la del {table}?</p>
      <div className={s.offerButtons}>
        <Button size="lg" variant="success" onClick={() => navigate(`/play/cancion/${table}`)}>Cantar la del {table}</Button>
        <Button size="lg" variant="secondary" onClick={onLater}>Ahora no</Button>
      </div>
    </div>
  )
}
