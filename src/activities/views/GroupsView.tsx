/* Exercise view "groups": n groups of k objects. The child taps the objects to count them, then writes the total. */
import { useMemo, useState } from 'react'
import type { ExerciseViewProps, GroupsExercise } from '@/types'
import { useActivityHost } from '@/activities/host'
import { NumberInput } from '@/ink'
import { sfx } from '@/audio'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './GroupsView.module.css'

export interface GroupsViewProps extends ExerciseViewProps {
  /** Show the repeated addition (4 + 4 + 4) as a reading aid. */
  showSum?: boolean
}

export default function GroupsView(props: GroupsViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, showSum } = props
  if (exercise.kind !== 'groups') return null
  return (
    <GroupsRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      guided={guided}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
      showSum={showSum}
    />
  )
}

interface RoundProps {
  ex: GroupsExercise
  onAnswered: ExerciseViewProps['onAnswered']
  guided?: boolean
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  showSum?: boolean
}

function GroupsRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, showSum }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const [counted, setCounted] = useState<Set<string>>(() => new Set())
  const items = useMemo(
    () => Array.from({ length: ex.groups }, (_, g) => Array.from({ length: ex.perGroup }, (_, i) => `${g}-${i}`)),
    [ex.groups, ex.perGroup],
  )
  const total = ex.groups * ex.perGroup
  const countedCount = counted.size

  const toggle = (id: string) => {
    if (flow.submitted) return
    setCounted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        sfx.play('tap', { volume: 0.5 })
      }
      return next
    })
  }

  const check = () => {
    if (value === null) return
    flow.submit({ type: 'number', value })
  }
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const repeated = Array.from({ length: ex.groups }, () => String(ex.perGroup)).join(' + ')

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Grupos">
      <p className={s.prompt}>
        {host.t(`Hay ${ex.groups} grupos de ${ex.perGroup}. ¿Cuántos ${ex.emoji} hay en total?`)}
      </p>
      {guided && <p className={s.guide}>{host.t('Toca cada dibujo para contarlo. Luego escribe el total.')}</p>}

      <div className={s.baskets} role="list">
        {items.map((row, g) => (
          <div key={g} className={s.basket} role="listitem" aria-label={`Grupo ${g + 1}`}>
            <div className={s.objects}>
              {row.map((id) => {
                const on = counted.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`${s.item} ${on ? s.on : ''}`}
                    onClick={() => toggle(id)}
                    aria-pressed={on}
                    aria-label={`${ex.emoji} ${on ? 'contado' : 'sin contar'}`}
                  >
                    <span aria-hidden>{ex.emoji}</span>
                  </button>
                )
              })}
            </div>
            <span className={s.label}>{host.t(`Grupo ${g + 1}`)}</span>
          </div>
        ))}
      </div>

      <div className={s.counter} aria-live="polite">
        <span className={s.counterNum}>{countedCount}</span>
        <span className={s.counterOf}>/ {total}</span>
        <span className={s.counterText}>{host.t('contados')}</span>
      </div>

      {showSum && <p className={s.sum}>{repeated} = ?</p>}

      <div className={s.answer}>
        <span className={s.answerLabel}>{host.t('Total:')}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => {
            setValue(v)
            if (v !== null) flow.submit({ type: 'number', value: v })
          }}
          maxDigits={3}
          size="lg"
          status={status}
          ariaLabel="Total de objetos"
          placeholder="?"
          keypadToggle
        />
      </div>

      <AnswerBar flow={flow} onCheck={check} canCheck={value !== null} />
    </section>
  )
}
