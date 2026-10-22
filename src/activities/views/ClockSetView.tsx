/* clock:set — the child sets the hands to the phrase on the card. Drag the long hand to the minutes (it snaps to the
   fives) and the short hand to the hour; or use the +/− buttons. Nothing shows the time the hands make: no readout. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { faceHour } from '@/engine'
import type { ClockSetExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { ClockFace, TimeSteppers, capitalize, type FaceTime } from './Clock'
import s from './clock.module.css'

export default function ClockSetView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'clock-set') return null
  return <SetRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

/** The hands start at a different time from the target (three hours on, a half-hour later) so nothing is set already. */
const startFor = (target: FaceTime): FaceTime => ({ hour: faceHour(target.hour + 3), minute: (target.minute + 30) % 60 })

function SetRound({ ex, onAnswered, showFeedback, allowHints }: { ex: ClockSetExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [time, setTime] = useState<FaceTime>(() => startFor(ex.answer))
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  const submit = () => {
    const c = flow.submit({ type: 'time', hour: time.hour, minute: time.minute })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Poner la hora en el reloj" data-kind={ex.kind} data-status={status}>
      <p className={s.instructions}>Pon el reloj en:</p>
      <p className={s.target}>{capitalize(ex.prompt)}</p>
      <div className={s.setRow}>
        <ClockFace
          time={time}
          onChange={(t) => { if (!locked) setTime(t) }}
          label="Reloj para poner la hora: arrastra las agujas"
        />
        <div className={s.side}>
          <p className={s.instructions}>Arrastra la aguja larga a los minutos (de cinco en cinco) y la corta a la hora.</p>
          <TimeSteppers time={time} onChange={(t) => { if (!locked) setTime(t) }} />
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck />
    </section>
  )
}
