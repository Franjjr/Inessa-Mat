/* Route /adult/caligrafia-ensayo (behind the adult PIN): the trial page that tunes the strict letra ligada grading with
   real strokes. The grown-up picks any item of the curriculum and the child writes it as in the practice (Mirar,
   Repasar, Escribir sola). Each try shows the four raw values next to their limits (thresholds.ts), whether each one
   passes, the stars and the tip. Nothing is saved: no attempt, no mastery, no stars. */
import { useState } from 'react'
import { AdultPage } from '@/adult/shared/AdultPage'
import adult from '@/adult/shared/adult.module.css'
import { CAL_CURRICULUM, type CalItem } from '@/content/caligrafia/curriculum'
import { TraceCursive } from '@/ink/cursive/TraceCursive'
import type { Criterion, CursiveScore } from '@/ink/cursive/score'
import { CURSIVE_THRESHOLDS as T } from '@/ink/cursive/thresholds'
import s from './TrialScreen.module.css'

/** Spanish decimal comma, with the digits the value is read to. */
const fmt = (n: number, digits: number) => n.toFixed(digits).replace('.', ',')

const KIND_LABEL: Record<CalItem['kind'], string> = {
  letra: 'Letras', mayus: 'Mayúsculas', enlace: 'Enlaces', palabra: 'Palabras', frase: 'Frases',
}
const KINDS = Object.keys(KIND_LABEL) as CalItem['kind'][]

const ROWS: { key: Criterion; label: string; limit: string; value: (x: CursiveScore) => string }[] = [
  { key: 'shape', label: 'Forma', limit: `≤ ${fmt(T.shape, 3)}`, value: (x) => fmt(x.shape, 3) },
  { key: 'line', label: 'Línea', limit: `≤ ${fmt(T.line, 3)}`, value: (x) => fmt(x.line, 3) },
  { key: 'size', label: 'Tamaño', limit: `${fmt(T.size.min, 2)} a ${fmt(T.size.max, 2)}`, value: (x) => fmt(x.size, 2) },
  { key: 'start', label: 'Inicio', limit: `≤ ${fmt(T.start, 3)}`, value: (x) => fmt(x.start, 3) },
]

export default function TrialScreen() {
  const [skill, setSkill] = useState(CAL_CURRICULUM[0].skill)
  // Bumped to start a new run of the same item (after «Siguiente»); the tries of the item stay in the table.
  const [run, setRun] = useState(0)
  const [tries, setTries] = useState<CursiveScore[]>([])
  const item = CAL_CURRICULUM.find((i) => i.skill === skill) ?? CAL_CURRICULUM[0]

  const pick = (next: string) => {
    setSkill(next)
    setTries([])
    setRun((r) => r + 1)
  }

  return (
    <AdultPage title="Ensayo de caligrafía" back="/adult">
      <section className={adult.card} aria-label="Ensayo">
        <p className={adult.lead}>
          Escribe lo que elijas como en la práctica. Abajo, cada intento con sus cuatro valores, su límite y si pasa.
          No se guarda nada.
        </p>
        <div className={adult.field}>
          <label htmlFor="trial-item" className={adult.label}>Qué escribir</label>
          <select id="trial-item" className={`${adult.input} ${adult.select}`} value={skill} onChange={(e) => pick(e.target.value)}>
            {KINDS.map((kind) => (
              <optgroup key={kind} label={KIND_LABEL[kind]}>
                {CAL_CURRICULUM.filter((i) => i.kind === kind).map((i) => (
                  <option key={i.skill} value={i.skill}>{i.text}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className={s.writing}>
          <TraceCursive
            key={`${skill}-${run}`}
            item={item}
            onDone={() => setRun((r) => r + 1)}
            onTry={(score) => setTries((t) => [...t, score])}
          />
        </div>
      </section>

      <section className={adult.card} aria-labelledby="trial-result">
        <h2 id="trial-result" className={adult.subheading}>Notas de los intentos</h2>
        {tries.length === 0 ? (
          <p className={adult.muted}>Escribe la letra y pulsa «¡Listo!» para ver su nota.</p>
        ) : (
          <>
            <div className={s.scroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">Criterio</th>
                    <th scope="col">Límite</th>
                    {tries.map((_, i) => <th key={i} scope="col">Intento {i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td className={s.limit}>{row.limit}</td>
                      {tries.map((x, i) => (
                        <td key={i}>
                          <span className={s.num}>{row.value(x)}</span>{' '}
                          <span className={`${s.pill} ${x.passed[row.key] ? s.pass : s.fail}`}>{x.passed[row.key] ? 'Pasa' : 'No pasa'}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Estrellas</th>
                    <td className={s.limit}>3 si pasan todos</td>
                    {tries.map((x, i) => <td key={i}><span className={s.num}>{x.stars} de 3</span></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className={s.tips}>
              {tries.map((x, i) => <li key={i}><strong>Intento {i + 1}:</strong> {x.tip}</li>)}
            </ul>
            <p className={adult.hint}>
              La forma pasa solo si también cuadran la anchura y la parte que se sale de la línea (ver thresholds.ts).
              Los números están en unidades de altura de la letra (x-height).
            </p>
          </>
        )}
      </section>
    </AdultPage>
  )
}
