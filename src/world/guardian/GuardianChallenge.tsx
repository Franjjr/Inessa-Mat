/* The guardian's challenge (node kind 'guardian'): intro → mixed rounds → Hechizo del Cristal.
   onPass hands over the crystal and letter (NodeScreen plays the rescue). Failing shows the score and offers a short
   review (with hints) of the items the child missed, then an encouraging retry that starts a fresh set of exercises.
   Rendered inside GameHostProvider by NodeScreen. */
import { useEffect, useState } from 'react'
import { useActivityHost } from '@/activities'
import { music } from '@/audio'
import { Character, Crystal } from '@/art'
import { BackButton, Button, Screen, TopBar } from '@/ui'
import { worldHex } from '@/world/rewards/worldColors'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import type { Exercise, ExerciseOutcome } from '@/types'
import type { GuardianChallengeProps } from '@/world/contracts'
import {
  buildRounds, buildSpell, decoyLetterFor, guardianCharacter, roundsPassed, roundsTotal, SPELL_TRIES, spellLetter,
} from './logic'
import s from './GuardianChallenge.module.css'

type Stage = 'intro' | 'rounds' | 'spell' | 'review' | 'lost' | 'won'

export default function GuardianChallenge({ guardian, world, onPass, onFail, onExit }: GuardianChallengeProps) {
  const host = useActivityHost()
  const [stage, setStage] = useState<Stage>('intro')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [spell, setSpell] = useState<Exercise | null>(null)
  const [spellTry, setSpellTry] = useState(0)
  const [lostNote, setLostNote] = useState('')
  const [lostScore, setLostScore] = useState({ correct: 0, total: 0 })
  /** Items answered wrong in this attempt, asked again in the review after a loss. */
  const [missed, setMissed] = useState<Exercise[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  /** The rounds were passed and only the spell was lost: the retry asks the spell again, not the rounds. */
  const [spellLost, setSpellLost] = useState(false)

  useEffect(() => {
    music.play('guardian')
  }, [])

  const total = roundsTotal(guardian)
  const passMin = guardian.passMin
  const character = guardianCharacter(guardian.character)
  const color = worldHex(world.id)

  /** A retry: the whole challenge again, or only the spell when that is all that was lost. */
  const retry = () => {
    if (spellLost && spell) {
      setSpellTry(0)
      setLostNote('')
      setSpellLost(false)
      setStage('spell')
      return
    }
    start()
  }

  const start = () => {
    setSpellLost(false)
    setExercises(buildRounds(guardian, host.rng))
    setIndex(0)
    setCorrect(0)
    setSpell(null)
    setSpellTry(0)
    setLostNote('')
    setLostScore({ correct: 0, total: 0 })
    setMissed([])
    setReviewIndex(0)
    setStage('rounds')
  }

  const fail = (note: string, got: number, of: number) => {
    setLostNote(note)
    setLostScore({ correct: got, total: of })
    setStage('lost')
    onFail({ correct: got, total: of })
  }

  const onRoundContinue = (o: ExerciseOutcome) => {
    const nextCorrect = correct + (o.check.correct ? 1 : 0)
    setCorrect(nextCorrect)
    if (!o.check.correct) setMissed((m) => [...m, exercises[index]])
    if (index + 1 < exercises.length) {
      setIndex(index + 1)
      return
    }
    if (!roundsPassed(nextCorrect, guardian)) {
      fail(guardian.retryText, nextCorrect, exercises.length)
      return
    }
    const next = buildSpell(guardian, host.rng)
    if (!next) {
      setStage('won')
      onPass({ correct: nextCorrect, total: exercises.length, letter: spellLetter(guardian) })
      return
    }
    setSpell(next)
    setStage('spell')
  }

  const onSpellContinue = (o: ExerciseOutcome) => {
    const spellCorrect = correct + (o.check.correct ? 1 : 0)
    const of = exercises.length + 1
    if (o.check.correct) {
      setStage('won')
      onPass({ correct: spellCorrect, total: of, letter: spellLetter(guardian) })
      return
    }
    if (spellTry + 1 < SPELL_TRIES) {
      setSpellTry(spellTry + 1)
      return
    }
    if (spell) setMissed((m) => [...m, spell])
    setSpellLost(true)
    fail(guardian.retryText, spellCorrect, of)
  }

  /** After the review of the missed items, the child goes back to the loss screen and tries again. */
  const onReviewContinue = () => {
    if (reviewIndex + 1 < missed.length) {
      setReviewIndex(reviewIndex + 1)
      return
    }
    setStage('lost')
  }

  const header = (
    <TopBar
      title={host.t(guardian.title)}
      left={stage !== 'won' ? <BackButton variant="exit" label={host.t('Salir')} onClick={onExit} /> : undefined}
    />
  )

  if (stage === 'intro') {
    return (
      <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
        {header}
        <div className={s.stage}>
          <div className={s.intro}>
            <Character id={character} pose="talk" size={220} />
            <p className={s.speech}>{host.t(guardian.intro)}</p>
            <p className={s.rule}>
              {host.t(`Si aciertas ${passMin} de ${total}, el cristal ${world.crystalName} será tuyo.`)}
            </p>
            <Button size="lg" variant="magic" onClick={start}>
              {host.t('¡Acepto el desafío!')}
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  if (stage === 'rounds' && exercises[index]) {
    const current = exercises[index]
    return (
      <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
        {header}
        <div className={s.stage}>
          <div className={s.counter} aria-label={`Ejercicio ${index + 1} de ${exercises.length}`}>
            {exercises.map((e, i) => (
              <span key={e.id} className={`${s.dot} ${i < index ? s.dotDone : ''} ${i === index ? s.dotNow : ''}`} />
            ))}
          </div>
          <div className={s.card}>
            <ExerciseStep
              key={`${index}-${current.id}`}
              exercise={current}
              allowHints={false}
              okLabel={index + 1 < exercises.length ? 'Siguiente' : host.t('Ver el hechizo')}
              wrongLabel={index + 1 < exercises.length ? 'Siguiente' : host.t('Ver el hechizo')}
              onContinue={onRoundContinue}
            />
          </div>
        </div>
      </Screen>
    )
  }

  if (stage === 'spell' && spell) {
    return (
      <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
        {header}
        <div className={s.stage}>
          <div className={s.spellHead}>
            <Crystal color={color} state="empty" size={72} />
            <h2 className={s.spellTitle}>{host.t('El Hechizo del Cristal')}</h2>
          </div>
          <p className={s.spellText}>{host.t(guardian.spell?.text ?? '')}</p>
          <div className={s.card}>
            <ExerciseStep
              key={`spell-${spellTry}`}
              exercise={spell}
              allowHints={false}
              okLabel={host.t('¡Cristal conseguido!')}
              wrongLabel={spellTry + 1 < SPELL_TRIES ? host.t('Probar otra vez') : host.t('Seguir')}
              feedbackFor={(o) => {
                if (o.check.correct) return undefined
                const decoy = decoyLetterFor(o.check.given)
                return decoy
                  ? host.t('Borrón ha escondido una letra falsa en ese número. ¡Revisa el hechizo con calma!')
                  : undefined
              }}
              onContinue={onSpellContinue}
            />
          </div>
        </div>
      </Screen>
    )
  }

  if (stage === 'won') {
    return (
      <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
        <div className={s.stage}>
          <Crystal color={color} state="glow" size={160} label={host.t('Cristal conseguido')} />
          <p className={s.speech}>{host.t('¡Lo has conseguido! Ahora ayudaremos a tu compañero.')}</p>
        </div>
      </Screen>
    )
  }

  if (stage === 'review' && missed[reviewIndex]) {
    const last = reviewIndex + 1 >= missed.length
    return (
      <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
        {header}
        <div className={s.stage}>
          <p className={s.rule}>{host.t('Repasamos juntos lo que se te ha resistido. ¡Tú puedes!')}</p>
          <div className={s.card}>
            <ExerciseStep
              key={`review-${reviewIndex}`}
              exercise={missed[reviewIndex]}
              allowHints
              okLabel={last ? host.t('Terminar repaso') : host.t('Siguiente')}
              onContinue={onReviewContinue}
            />
          </div>
        </div>
      </Screen>
    )
  }

  // lost: encouraging, with a short review of what was missed and a retry that starts a new set of items.
  return (
    <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
      {header}
      <div className={s.stage}>
        <div className={s.intro}>
          <Character id={character} pose="think" size={180} />
          <p className={s.speech}>{host.t(lostNote)}</p>
          <p className={s.rule}>{host.t(`Has acertado ${lostScore.correct} de ${lostScore.total}.`)}</p>
          <div className={s.actions}>
            {missed.length > 0 && (
              <Button size="lg" variant="secondary" onClick={() => { setReviewIndex(0); setStage('review') }}>
                {host.t('Repasar lo que fallaste')}
              </Button>
            )}
            <Button size="lg" variant="magic" onClick={retry}>{host.t('Intentarlo otra vez')}</Button>
            <Button size="lg" variant="secondary" onClick={onExit}>{host.t('Volver al mapa')}</Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
