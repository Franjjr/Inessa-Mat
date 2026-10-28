/* Subjects of one child. Maths and Lengua are switched on and off here; the other subjects are announced as «Próximamente».
   Lengua is the 3.º course: a child of another course cannot switch it on. At least one subject is always active. */
import { useState } from 'react'
import { subjectOffered } from '@/engine'
import { updateChild } from '@/data'
import { SUBJECTS, type ChildProfile, type SubjectId } from '@/types'
import { toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { SwitchRow } from './SwitchRow'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function SubjectsCard({ child }: { child: ChildProfile }) {
  const [error, setError] = useState<string | null>(null)
  const active: SubjectId[] = child.settings.subjects ?? ['math']

  const change = async (id: SubjectId, on: boolean) => {
    setError(null)
    const next = SUBJECTS.map((x) => x.id).filter((x) => (x === id ? on : active.includes(x)))
    if (next.length === 0) {
      setError('Debe quedar al menos una asignatura activa.')
      return
    }
    try {
      await updateChild(child.id, { settings: { ...child.settings, subjects: next } })
      toast('Cambio guardado')
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar el cambio. Inténtalo otra vez.'))
    }
  }

  return (
    <section className={adult.card} aria-labelledby="subjects-title">
      <h2 id="subjects-title" className={adult.subheading}>Asignaturas</h2>
      <p className={adult.muted}>
        Elige qué asignaturas aparecen en el cuaderno de {child.nickname}. Siempre queda al menos una activa.
      </p>
      {SUBJECTS.map((subject) => {
        const on = active.includes(subject.id)
        if (!subject.available) {
          return (
            <div key={subject.id} className={s.subjectRow} aria-disabled="true">
              <span className={adult.label}>{subject.name}</span>
              <span className={s.soon}>Próximamente</span>
            </div>
          )
        }
        const offered = subjectOffered(subject.id, child.grade)
        const hint = !offered
          ? 'Lengua de 3.º: disponible para los niños de 3.º.'
          : on && active.length === 1 ? 'Es la única activa: no se puede desactivar.'
            : subject.id === 'language' ? 'Gramática, ortografía, vocabulario y lectura.' : 'Tablas de multiplicar y cálculo.'
        return (
          <SwitchRow
            key={subject.id}
            label={subject.name}
            hint={hint}
            checked={on}
            disabled={(on && active.length === 1) || (!on && !offered)}
            onChange={(v) => void change(subject.id, v)}
          />
        )
      })}
      {error && <p className={adult.error} role="alert">{error}</p>}
    </section>
  )
}
