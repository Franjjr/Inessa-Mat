/* «Canciones» in Jugar: one card per table of the child's course, with the stars of its song (progress flags). */
import { useNavigate } from 'react-router-dom'
import { StarIcon } from '@/art'
import { songStars, songTables } from '@/world/cancion/logic'
import s from './free.module.css'

export function CancionesSection({ grade, flags }: { grade?: number; flags?: Record<string, boolean> }) {
  const navigate = useNavigate()
  return (
    <section className={s.section} aria-labelledby="free-songs">
      <h2 id="free-songs" className={s.heading}>Canciones</h2>
      <div className={s.tables}>
        {songTables(grade).map((t) => {
          const stars = songStars(flags, t)
          return (
            <button
              key={t}
              type="button"
              className={s.table}
              aria-label={`La canción del ${t}, ${stars} de 3 estrellas`}
              onClick={() => navigate(`/play/cancion/${t}`)}
            >
              <span className={s.tableTimes} aria-hidden>♪</span>
              <span className={s.tableNumber} aria-hidden>{t}</span>
              <span className={s.tableLabel} aria-hidden>La canción del {t}</span>
              <span className={s.songStars} aria-hidden>
                {[1, 2, 3].map((i) => <StarIcon key={i} size={18} filled={i <= stars} />)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
