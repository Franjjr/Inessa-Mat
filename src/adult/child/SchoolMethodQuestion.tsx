/* «¿Cómo resta tu hijo en el colegio cuando arriba hay menos?»: the grown-up says how the child's school subtracts
   (and, from 3.º, how it writes the galera), looking at two notebook drawings. Never blocks anything: until it is
   answered the app uses pedir prestado and the galera con restas. «Otro» or «No lo sé» keep those defaults and say why
   that is fine: a correct final answer always counts. Saves settings.subMethod, divMethod and schoolMethodAsked. */
import { useState } from 'react'
import { normaliseDivMethod, normaliseSubMethod } from '@/engine'
import { updateChild } from '@/data'
import type { ChildProfile, DivMethod, SubMethod } from '@/types'
import { Button, toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { MethodSketch } from './MethodSketch'
import adult from '../shared/adult.module.css'
import s from './MethodSketch.module.css'

/** From which school year each question makes sense: subtracting with borrowing (2.º) and the galera (3.º). */
export const SUB_QUESTION_GRADE = 2
export const DIV_QUESTION_GRADE = 3

/** The child's school year: the one the grown-up gave or, without it («No lo sé»), the usual one for the birth year in
    Spain (1.º the school year the child turns 6; the school year starts in September). 0 when neither is known. */
export function schoolGradeOf(child: Pick<ChildProfile, 'grade' | 'birthYear'>, now: Date = new Date()): number {
  if (child.grade !== undefined && child.grade !== null) return child.grade
  if (!child.birthYear) return 0
  const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return Math.max(0, schoolYear - child.birthYear - 5)
}

/** The grown-up still has to say how the child's school subtracts (only from 2.º; older profiles have no answer). */
export function needsSchoolMethod(child: Pick<ChildProfile, 'grade' | 'birthYear' | 'settings'> | null | undefined, now: Date = new Date()): boolean {
  if (!child) return false
  return schoolGradeOf(child, now) >= SUB_QUESTION_GRADE && child.settings?.schoolMethodAsked !== true
}

type Note = 'other' | 'unknown' | null

const SUB_NOTE: Record<'other' | 'unknown', (name: string) => string> = {
  other: (name) => `De momento, ${name} restará pidiendo prestado. Si la respuesta final está bien, siempre vale, aunque en su cole la haga de otra forma.`,
  unknown: (name) => `De momento, ${name} restará pidiendo prestado. Míralo en su cuaderno cuando puedas y cámbialo aquí. Si la respuesta final está bien, siempre vale.`,
}
const DIV_NOTE = (name: string) => `De momento, ${name} dividirá escribiendo las restas debajo. Si el cociente y el resto están bien, siempre vale.`

export function SchoolMethodQuestion({ child }: { child: ChildProfile }) {
  const name = child.nickname
  const askDiv = schoolGradeOf(child) >= DIV_QUESTION_GRADE
  const [sub, setSub] = useState<SubMethod | null>(null)
  const [subNote, setSubNote] = useState<Note>(null)
  const [div, setDiv] = useState<DivMethod | null>(null)
  const [divNote, setDivNote] = useState<Note>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (subMethod: SubMethod, divMethod: DivMethod) => {
    setError(null)
    try {
      await updateChild(child.id, { settings: { ...child.settings, subMethod, divMethod, schoolMethodAsked: true } })
      toast('Cambio guardado')
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar el cambio. Inténtalo otra vez.'))
    }
  }
  const currentDiv = normaliseDivMethod(child.settings.divMethod)

  const answerSub = (method: SubMethod, note: Note) => {
    setSub(method)
    setSubNote(note)
    if (!note && !askDiv) void save(method, currentDiv)
  }
  const ackSub = () => {
    setSubNote(null)
    if (!askDiv) void save(sub ?? normaliseSubMethod(undefined), currentDiv)
  }
  const answerDiv = (method: DivMethod, note: Note) => {
    setDiv(method)
    setDivNote(note)
    if (!note) void save(sub ?? normaliseSubMethod(undefined), method)
  }

  let body
  if (sub === null) {
    body = (
      <>
        <h3 className={s.questionTitle}>¿Cómo resta {name} en el colegio cuando arriba hay menos?</h3>
        <div className={s.options}>
          <MethodSketch id="borrow" title="A. Pidiendo prestado" />
          <MethodSketch id="carry" title="B. Me llevo una" />
        </div>
        <div className={s.answers}>
          <Button size="sm" onClick={() => answerSub('borrow', null)}>Como en A</Button>
          <Button size="sm" onClick={() => answerSub('carry', null)}>Como en B</Button>
          <Button size="sm" variant="secondary" onClick={() => answerSub('borrow', 'other')}>Otro (ABN u otro método)</Button>
          <Button size="sm" variant="secondary" onClick={() => answerSub('borrow', 'unknown')}>No lo sé, lo miro en su cuaderno</Button>
        </div>
      </>
    )
  } else if (subNote) {
    body = (
      <>
        <p className={adult.lead} role="status">{SUB_NOTE[subNote](name)}</p>
        <div className={s.answers}><Button size="sm" onClick={ackSub}>Entendido</Button></div>
      </>
    )
  } else if (askDiv && div === null) {
    body = (
      <>
        <h3 className={s.questionTitle}>Al dividir, ¿{name} escribe las restas debajo de la galera o las hace de cabeza?</h3>
        <div className={s.options}>
          <MethodSketch id="galera" title="A. Escribe las restas" />
          <MethodSketch id="galera-short" title="B. Las hace de cabeza" />
        </div>
        <div className={s.answers}>
          <Button size="sm" onClick={() => answerDiv('galera', null)}>Como en A</Button>
          <Button size="sm" onClick={() => answerDiv('galera-short', null)}>Como en B</Button>
          <Button size="sm" variant="secondary" onClick={() => answerDiv('galera', 'unknown')}>No lo sé, lo miro en su cuaderno</Button>
        </div>
      </>
    )
  } else if (divNote) {
    body = (
      <>
        <p className={adult.lead} role="status">{DIV_NOTE(name)}</p>
        <div className={s.answers}><Button size="sm" onClick={() => void save(sub, div ?? currentDiv)}>Entendido</Button></div>
      </>
    )
  } else {
    body = <p className={adult.muted} role="status">Guardando…</p>
  }

  return (
    <div className={s.question}>
      {body}
      {error && <p className={adult.error} role="alert">{error}</p>}
    </div>
  )
}
