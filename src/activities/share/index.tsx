/* Activity "share": repartos justos. Division as sharing: the child hands the objects out, one at a time, to the
   friends (the friend who has the fewest objects is glowing, so the sharing stays fair). Then writes how many each
   friend got: p ÷ d = ? */
import { useMemo, useState } from 'react'
import type { ActivityProps, Exercise, ExerciseOutcome, FactDivExercise } from '@/types'
import { generate } from '@/engine'
import { adaptiveSelector, BUILD_SKIP_AFTER } from '../facts/shared/items'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { sfx } from '@/audio'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'
import s from './share.module.css'

const isFactDiv = (e: Exercise): e is FactDivExercise => e.kind === 'fact-div'
const FRIENDS = ['👧', '🧒', '👦', '🧑', '👶', '🧕', '👩', '🧔']

export default function ShareActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(adaptiveSelector(config.selector), config.count ?? 5, { rng: host.rng, mastery: host.mastery }).filter(isFactDiv),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex || ex.kind !== 'fact-div') return null
  const emoji = typeof config.params?.emoji === 'string' ? config.params.emoji : '🍓'
  const container = typeof config.params?.container === 'string' ? config.params.container : null
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <ShareRound key={`${ex.id}-${run.index}`} ex={ex} emoji={emoji} container={container} onAnswered={run.record} skippable={run.correct >= BUILD_SKIP_AFTER} />
    </OpsShell>
  )
}

interface RoundProps {
  ex: FactDivExercise
  emoji: string
  container: string | null
  onAnswered: (outcome: ExerciseOutcome) => void
  /** After several right rounds: the sharing can be skipped (the guiding highlight stays). */
  skippable: boolean
}

function ShareRound({ ex, emoji, container, onAnswered, skippable }: RoundProps) {
  const host = useActivityHost()
  const [tray, setTray] = useState<number[]>(() => Array.from({ length: ex.dividend }, (_, i) => i))
  const [bins, setBins] = useState<number[][]>(() => Array.from({ length: ex.divisor }, () => []))
  const [skipped, setSkipped] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  const fewest = bins.reduce((best, b, i) => (b.length < bins[best].length ? i : best), 0)
  const shared = tray.length === 0 || skipped

  const give = (bin: number) => {
    if (tray.length === 0) return
    // Fair sharing (MD-6): a friend who already has more than another one waits; the sharing never gets unequal.
    if (bins[bin].length > bins[fewest].length) {
      setWarn(host.t('Primero a la que menos tiene.'))
      sfx.play('wrong', { volume: 0.4 })
      return
    }
    setWarn(null)
    const id = tray[tray.length - 1]
    setTray((prev) => prev.slice(0, -1))
    setBins((prev) => prev.map((b, i) => (i === bin ? [...b, id] : b)))
    sfx.play('pop', { volume: 0.6 })
  }
  const takeBack = (bin: number, id: number) => {
    setBins((prev) => prev.map((b, i) => (i === bin ? b.filter((x) => x !== id) : b)))
    setTray((prev) => [...prev, id])
    sfx.play('erase', { volume: 0.4 })
  }

  if (!shared) {
    return (
      <section className={s.stage} aria-label="Reparto">
        <p className={s.prompt}>
          {host.t(`Reparte ${ex.dividend} ${emoji} entre ${ex.divisor} amigas, de una en una.`)}
        </p>
        <div className={s.pile} aria-label="Por repartir">
          {tray.map((id) => (
            <span key={id} className={s.pileItem} aria-hidden>{emoji}</span>
          ))}
          {tray.length === 0 && <span className={s.note}>{host.t('¡Ya está repartido!')}</span>}
        </div>
        <div className={s.bins}>
          {bins.map((items, b) => (
            <button
              key={b}
              type="button"
              className={`${s.bin} ${b === fewest ? s.next : ''}`}
              onClick={() => give(b)}
              disabled={tray.length === 0}
              aria-label={`${host.t('Amiga')} ${b + 1}: ${items.length} ${emoji}`}
            >
              <span className={s.friend} aria-hidden>{container ?? FRIENDS[b % FRIENDS.length]}</span>
              <span className={s.binLabel}>{host.t(`Amiga ${b + 1}`)}</span>
              <span className={s.binItems}>
                {items.map((id) => (
                  <span
                    key={id}
                    role="presentation"
                    className={s.binItem}
                    onClick={(e) => { e.stopPropagation(); takeBack(b, id) }}
                  >
                    {emoji}
                  </span>
                ))}
              </span>
              <span className={s.binCount} aria-hidden>{items.length}</span>
            </button>
          ))}
        </div>
        {warn && <p className={s.warn} role="status">{warn}</p>}
        <p className={s.note}>{host.t('Toca una amiga para darle uno. Toca un objeto para devolverlo.')}</p>
        {skippable && (
          <button type="button" className={s.skip} onClick={() => setSkipped(true)}>
            {host.t('Ya lo sé, ¿cuántos le tocan?')}
          </button>
        )}
      </section>
    )
  }

  return <ShareAnswer ex={ex} onAnswered={onAnswered} plates={skipped ? null : bins.map((b) => b.length)} emoji={emoji} container={container} />
}

/** The plates of the friends, still on screen while the child writes how many each one got (MD-6). Not tappable. */
function Plates({ counts, emoji, container }: { counts: number[]; emoji: string; container: string | null }) {
  const host = useActivityHost()
  return (
    <div className={s.bins} role="list" aria-label="Los platos de las amigas" data-plates="">
      {counts.map((n, b) => (
        <div key={b} role="listitem" className={`${s.bin} ${s.binStill}`} aria-label={`${host.t('Amiga')} ${b + 1}: ${n} ${emoji}`}>
          <span className={s.friend} aria-hidden>{container ?? FRIENDS[b % FRIENDS.length]}</span>
          <span className={s.binLabel}>{host.t(`Amiga ${b + 1}`)}</span>
          <span className={s.binItems} aria-hidden>
            {Array.from({ length: n }, (_, k) => <span key={k} className={s.binItem}>{emoji}</span>)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ShareAnswer({ ex, onAnswered, plates, emoji, container }: { ex: FactDivExercise; onAnswered: RoundProps['onAnswered']; plates: number[] | null; emoji: string; container: string | null }) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: true, allowHints: true })
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.stage} aria-label="¿Cuántos le tocan a cada amiga?">
      <p className={s.prompt}>{host.t('¿Cuántos le tocan a cada amiga?')}</p>
      {plates && <Plates counts={plates} emoji={emoji} container={container} />}
      <p className={s.equation}>{ex.dividend} ÷ {ex.divisor} = ?</p>
      <p className={s.note}>{host.t('Mira cuántos tiene cada amiga y escríbelo.')}</p>
      <div className={s.answer}>
        <span className={s.answerLabel}>{host.t('Cada una:')}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); submit(v) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Cuántos le tocan a cada amiga"
          placeholder="?"
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
