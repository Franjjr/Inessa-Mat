/* Route /play/caligrafia: «Caligrafía con lápiz», the day's plan of letra ligada (2 or 3 items, about five minutes). Each
   item runs TraceCursive; every item is recorded as one attempt (skill calig:…, correct = 3 stars) and moves its mastery.
   The day's stars come once, on the first finish, on their own key. «Salir» leaves at any time. */
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TraceCursive } from '@/ink/cursive/TraceCursive'
import { nombreDe } from '@/ink/cursive/tips'
import type { CursiveScore, Criterion } from '@/ink/cursive/score'
import { useInputMode } from '@/ink'
import { planCaligrafia } from '@/engine/caligrafia/plan'
import { updateMastery } from '@/engine'
import type { CalItem } from '@/content/caligrafia/curriculum'
import { recordAttempt, saveMastery, updateProgress, useActiveChild, useMastery } from '@/data'
import type { AttemptRecord, ChildProfile, ErrorType, MasteryMap } from '@/types'
import { Button, Screen, Spinner, toast } from '@/ui'
import { caligrafiaRewardKey, CALIG_STARS } from '@/world/session/logic'
import s from './CaligrafiaScreen.module.css'

const ERROR_OF: Record<Criterion, ErrorType> = { shape: 'calig-shape', line: 'calig-line', size: 'calig-size', start: 'calig-start' }

function reportError(where: string, e: unknown) {
  if (import.meta.env.DEV) console.warn(`[caligrafia] ${where}`, e)
}

export default function CaligrafiaScreen() {
  const { child, loading } = useActiveChild()
  const mastery = useMastery(child?.id)
  const { mode, penSeen } = useInputMode()
  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!mastery) return <Spinner />
  // Pen only: a device where the pen was never used, or a child with the handwriting switched off, does not get the practice.
  if (!(penSeen || mode === 'pen') || child.settings?.handwriting === false) return <Navigate to="/play" replace />
  return <CaligrafiaRun child={child} mastery={mastery} />
}

function CaligrafiaRun({ child, mastery }: { child: ChildProfile; mastery: MasteryMap }) {
  const navigate = useNavigate()
  const [plan] = useState<CalItem[]>(() => planCaligrafia({ childId: child.id, mastery, now: new Date() }))
  const [pos, setPos] = useState(0)
  const [finished, setFinished] = useState(false)
  const [reward, setReward] = useState<'new' | 'already' | null>(null)
  const masteryNow = useRef(mastery)

  const record = (item: CalItem, score: CursiveScore, tries: number, ms: number) => {
    const now = new Date()
    const correct = score.stars === 3
    const errorType = score.worst ? ERROR_OF[score.worst] : null
    const attempt: AttemptRecord = {
      id: crypto.randomUUID(),
      childId: child.id,
      sessionId: null,
      skill: item.skill,
      kind: 'cursive',
      correct,
      given: String(score.stars),
      expected: '3',
      ms,
      inputMode: 'pen',
      hintsUsed: 0,
      errorType,
      ...(tries > 1 ? { retries: tries - 1, solvedOnRetry: correct } : {}),
      context: {
        shape: score.passed.shape,
        line: score.passed.line,
        size: score.passed.size,
        start: score.passed.start,
        stars: score.stars,
      },
      createdAt: now.toISOString(),
    }
    const next = updateMastery(
      masteryNow.current[item.skill],
      { skill: item.skill, correct, ms: attempt.ms, inputMode: 'pen', hintsUsed: 0, errorType },
      now,
    )
    masteryNow.current = { ...masteryNow.current, [item.skill]: next }
    recordAttempt(attempt).catch((e) => { reportError('recordAttempt', e); toast('Tu intento se guardará en cuanto haya conexión.') })
    saveMastery(child.id, [next]).catch((e) => { reportError('saveMastery', e); toast('Tu progreso se guardará en cuanto haya conexión.') })
  }

  const finish = () => {
    const key = caligrafiaRewardKey(new Date())
    let granted = false
    updateProgress(child.id, (p) => {
      if (p.flags?.[key]) return p
      granted = true
      return { ...p, stars: p.stars + CALIG_STARS, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString() }
    })
      .then(() => setReward(granted ? 'new' : 'already'))
      .catch(() => toast('Tus estrellas se guardarán en cuanto haya conexión.'))
    setFinished(true)
  }

  const onItemDone = (item: CalItem, r: { score: CursiveScore; tries: number; ms: number }) => {
    record(item, r.score, r.tries, r.ms)
    if (pos + 1 < plan.length) {
      setPos(pos + 1)
    } else {
      finish()
    }
  }

  const leave = () => navigate('/play')

  if (finished) {
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <div className={s.card}>
          <h2 className={s.title}>¡Terminado!</h2>
          <p className={s.text}>Has practicado {plan.length} {plan.length === 1 ? 'cosa' : 'cosas'} de letra ligada.</p>
          {reward === 'new' && <p className={s.reward}>+{CALIG_STARS} estrellas para tu cuerno</p>}
          {reward === 'already' && <p className={s.text}>Ya tienes las estrellas de hoy.</p>}
          <Button size="lg" variant="success" onClick={leave}>Volver al inicio</Button>
        </div>
      </Screen>
    )
  }

  if (plan.length === 0) {
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <div className={s.card}>
          <p className={s.text}>Hoy no hay letras que practicar.</p>
          <Button size="lg" variant="secondary" onClick={leave}>Volver al inicio</Button>
        </div>
      </Screen>
    )
  }

  const item = plan[pos]
  return (
    <Screen className={s.root} background="var(--c-bg)">
      <header className={s.bar}>
        <button type="button" className={s.exit} onClick={leave}>Salir</button>
        <p className={s.progress}>{pos + 1} de {plan.length}</p>
        <p className={s.name}>{nombreDe(item.text)}</p>
      </header>
      <TraceCursive key={pos} item={item} gender={child.gender} onDone={(r) => onItemDone(item, r)} />
    </Screen>
  )
}
