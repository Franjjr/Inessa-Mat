/* The guardian's challenge (node kind 'guardian'): intro → mixed rounds → Hechizo del Cristal.
   onPass hands over the crystal and letter (NodeScreen plays the rescue). Failing gives an encouraging retry
   that starts a fresh set of exercises. Rendered inside GameHostProvider by NodeScreen. */
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

type Stage = 'intro' | 'rounds' | 'spell' | 'lost' | 'won'

export default function GuardianChallenge({ guardian, world, onPass, onFail, onExit }: GuardianChallengeProps) {
  const host = useActivityHost()
  const [stage, setStage] = useState<Stage>('intro')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [spell, setSpell] = useState<Exercise | null>(null)
  const [spellTry, setSpellTry] = useState(0)
  const [lostNote, setLostNote] = useState('')

  useEffect(() => {
    music.play('guardian')
  }, [])

  const total = roundsTotal(guardian)
  const passMin = guardian.passMin
  const character = guardianCharacter(guardian.character)
  const color = worldHex(world.id)

  const start = () => {
    setExercises(buildRounds(guardian, host.rng))
    setIndex(0)
    setCorrect(0)
    setSpell(null)
    setSpellTry(0)
    setLostNote('')
    setStage('rounds')
  }

  const fail = (note: string, got: number, of: number) => {
    setLostNote(note)
    setStage('lost')
    onFail({ correct: got, total: of })
  }

  const onRoundContinue = (o: ExerciseOutcome) => {
    const nextCorrect = correct + (o.check.correct ? 1 : 0)
    setCorrect(nextCorrect)
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
    fail(guardian.retryText, spellCorrect, of)
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
          <p className={s.spellText}>{host.t(guardian.spell.text)}</p>
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

  // lost: encouraging, with a retry that starts a new set of items.
  return (
    <Screen className={s.root} style={{ ['--guardian' as string]: color, ['--guardian-soft' as string]: world.colorSoft }}>
      {header}
      <div className={s.stage}>
        <div className={s.intro}>
          <Character id={character} pose="think" size={180} />
          <p className={s.speech}>{host.t(lostNote)}</p>
          <div className={s.actions}>
            <Button size="lg" variant="magic" onClick={start}>{host.t('Intentarlo otra vez')}</Button>
            <Button size="lg" variant="secondary" onClick={onExit}>{host.t('Volver al mapa')}</Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
