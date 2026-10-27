/* OnboardingScreen (/kids/new): one question per screen, built for a child who taps or writes. Lumi asks, the child
   answers with big buttons, the companion is chosen and named, handwriting calibration is offered (skippable),
   then the prologue story plays and the child lands on the home screen. The profile is created on "¡Vamos!". */
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import clsx from 'clsx'
import { Character, CompanionArt, WorldBackground } from '@/art'
import {
  COMPANION_COLORWAYS, getCompanionDef, getStory, PROLOGUE_STORY_ID, renderTemplate, speciesNoun,
  startingWorldForGrade, unlockThroughWorld, type TemplateContext,
} from '@/content'
import { createChild, DataError, updateProgress, useActiveChild } from '@/data'
import { CalibrationFlow, useInputMode } from '@/ink'
import { Button, Screen, toast } from '@/ui'
import type { CompanionSpecies, GrammaticalGender } from '@/types'
import { COMPANION_SPECIES } from '@/types'
import StoryPlayer from '@/world/story/StoryPlayer'
import s from './OnboardingScreen.module.css'

type Step =
  | 'name' | 'gender' | 'grade' | 'species' | 'colorway'
  | 'companionName' | 'companionGender' | 'review' | 'calibration' | 'prologue'

const STEPS: Step[] = [
  'name', 'gender', 'grade', 'species', 'colorway', 'companionName', 'companionGender', 'review',
  'calibration', 'prologue',
]
/** Steps shown as progress dots (the prologue is a story, not a question). */
const QUESTION_STEPS = STEPS.filter((x) => x !== 'prologue' && x !== 'calibration')

interface Draft {
  name: string
  gender: GrammaticalGender
  grade?: number
  species?: CompanionSpecies
  colorway: string
  petName: string
  petGender: GrammaticalGender
}

const EMPTY_DRAFT: Draft = { name: '', gender: 'm', colorway: 'default', petName: '', petGender: 'm' }

const COLORWAY_LABEL: Record<string, string> = {
  default: 'Original',
  sunny: 'Dorado',
  berry: 'Rosa',
  mint: 'Menta',
}

const GRADES = [1, 2, 3, 4, 5, 6]

function contextOf(d: Draft): TemplateContext {
  return {
    childName: d.name.trim() || 'amigo',
    childGender: d.gender,
    petName: d.petName.trim() || (d.species ? capitalize(speciesNoun(d.species, d.petGender).noun) : 'Tu compañero'),
    petGender: d.petGender,
    petSpecies: d.species ?? 'cat',
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function OnboardingScreen() {
  const navigate = useNavigate()
  const { setActiveChild } = useActiveChild()
  // Handwriting calibration only where the child writes (finger or pen): with a keypad or a keyboard it is useless.
  const { mode } = useInputMode()
  const writes = mode === 'pen' || mode === 'touch'
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [childId, setChildId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Synchronous guard: a double tap on "¡Vamos!" must never create two profiles.
  const creatingRef = useRef(false)
  const createdIdRef = useRef<string | null>(null)
  const step = STEPS[stepIndex]
  const ctx = useMemo(() => contextOf(draft), [draft])
  const t = (template: string) => renderTemplate(template, ctx)

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const back = () => setStepIndex((i) => Math.max(i - 1, 0))

  const create = async () => {
    if (creatingRef.current || !draft.species) return
    creatingRef.current = true
    setBusy(true)
    try {
      // A retry after a failed unlock reuses the profile that was already created.
      let id = createdIdRef.current
      if (!id) {
        const child = await createChild({
          nickname: draft.name.trim(),
          gender: draft.gender,
          grade: draft.grade,
          companion: {
            species: draft.species,
            name: draft.petName.trim(),
            gender: draft.petGender,
            colorway: draft.colorway,
            equipped: [],
          },
        })
        id = child.id
        createdIdRef.current = id
      }
      const start = startingWorldForGrade(draft.grade)
      if (start !== 'w1') {
        await updateProgress(id, (p) => unlockThroughWorld(p, start))
      }
      setActiveChild(id)
      setChildId(id)
      if (writes) next()
      else setStepIndex(STEPS.indexOf('prologue'))
    } catch (e) {
      toast(e instanceof DataError ? e.message : 'No hemos podido crear el perfil. Inténtalo otra vez.')
    } finally {
      creatingRef.current = false
      setBusy(false)
    }
  }

  const finishCalibration = async () => {
    if (childId) {
      await updateProgress(childId, (p) => ({ ...p, flags: { ...p.flags, calibration: true } })).catch(() => undefined)
    }
    next()
  }

  const leave = () => navigate('/play', { replace: true })

  const species = draft.species
  const companionName = draft.petName.trim() || ctx.petName

  return (
    <MotionConfig reducedMotion="user">
      <Screen className={s.screen}>
        <WorldBackground id="sky" vividness={1} />

        {step !== 'prologue' && step !== 'calibration' && (
          <header className={s.top}>
            {stepIndex > 0 ? (
              <Button variant="secondary" size="sm" className={s.touch} onClick={back}>Atrás</Button>
            ) : <span />}
            <div className={s.dots} aria-label={`Paso ${Math.min(QUESTION_STEPS.indexOf(step) + 1, QUESTION_STEPS.length)} de ${QUESTION_STEPS.length}`}>
              {QUESTION_STEPS.map((q, i) => (
                <span key={q} className={clsx(s.dot, i <= QUESTION_STEPS.indexOf(step) && s.dotOn)} />
              ))}
            </div>
            <span />
          </header>
        )}

        {step === 'calibration' && (
          <header className={s.top}>
            <span />
            <span className={s.calibTitle}>Enseñar a {companionName}</span>
            <Button variant="ghost" size="sm" className={s.touch} onClick={next}>Ahora no</Button>
          </header>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className={s.step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 'name' && (
              <Question lumi={t('¡Hola! Soy Lumi. ¿Cómo te llamas?')}>
                <form
                  className={s.form}
                  onSubmit={(e) => { e.preventDefault(); if (draft.name.trim()) next() }}
                >
                  <label className={s.label} htmlFor="ob-name">Tu nombre</label>
                  <input
                    id="ob-name"
                    className={s.input}
                    value={draft.name}
                    maxLength={20}
                    autoFocus
                    autoComplete="off"
                    placeholder="Escribe tu nombre"
                    onChange={(e) => update({ name: e.target.value })}
                  />
                  <Button type="submit" size="lg" className={s.next} disabled={!draft.name.trim()} aria-describedby={draft.name.trim() ? undefined : 'ob-name-hint'}>Siguiente ›</Button>
                  {!draft.name.trim() && <p id="ob-name-hint" className={s.hint}>Escribe tu nombre para seguir</p>}
                </form>
              </Question>
            )}

            {step === 'gender' && (
              <Question lumi={t('Encantada de conocerte, {child}. ¿Cómo te gusta que te hablemos en la historia?')}>
                <Choices>
                  <ChoiceButton label="Como a una niña" selected={draft.gender === 'f'} onClick={() => { update({ gender: 'f' }); next() }} />
                  <ChoiceButton label="Como a un niño" selected={draft.gender === 'm'} onClick={() => { update({ gender: 'm' }); next() }} />
                </Choices>
              </Question>
            )}

            {step === 'grade' && (
              <Question lumi={t('¿En qué curso estás, {child}?')}>
                <Choices>
                  {GRADES.map((g) => (
                    <ChoiceButton
                      key={g}
                      label={`${g}º de Primaria`}
                      selected={draft.grade === g}
                      onClick={() => { update({ grade: g }); next() }}
                    />
                  ))}
                  <ChoiceButton label="No lo sé" selected={draft.grade === undefined} onClick={() => { update({ grade: undefined }); next() }} />
                </Choices>
              </Question>
            )}

            {step === 'species' && (
              <Question lumi={t('Ahora elige a tu compañero de aventuras. ¡Se meterá en líos, así que lo necesitarás!')}>
                <div className={s.species} role="group" aria-label="Compañeros">
                  {COMPANION_SPECIES.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      className={clsx(s.speciesCard, draft.species === sp && s.selected)}
                      aria-pressed={draft.species === sp}
                      onClick={() => { update({ species: sp, petName: '' }); next() }}
                    >
                      <CompanionArt species={sp} size={112} />
                      <span className={s.speciesName}>{capitalize(speciesNoun(sp, 'm').noun)}</span>
                    </button>
                  ))}
                </div>
              </Question>
            )}

            {step === 'colorway' && species && (
              <Question lumi={t('¿De qué color quieres que sea {el_pet_species}?')}>
                <div className={s.colorways} role="group" aria-label="Colores">
                  {COMPANION_COLORWAYS.map((cw) => (
                    <button
                      key={cw}
                      type="button"
                      className={clsx(s.colorCard, draft.colorway === cw && s.selected)}
                      aria-pressed={draft.colorway === cw}
                      onClick={() => { update({ colorway: cw }); next() }}
                    >
                      <CompanionArt species={species} colorway={cw} size={124} />
                      <span className={s.speciesName}>{COLORWAY_LABEL[cw]}</span>
                    </button>
                  ))}
                </div>
              </Question>
            )}

            {step === 'companionName' && species && (
              <Question lumi={t('¿Cómo se llama {pet}? Elige un nombre o escribe el tuyo.')} petSpecies={species} colorway={draft.colorway}>
                <form
                  className={s.form}
                  onSubmit={(e) => { e.preventDefault(); if (draft.petName.trim()) next() }}
                >
                  <div className={s.suggestions}>
                    {(getCompanionDef(species)?.suggestedNames ?? []).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={clsx(s.chip, draft.petName === n && s.selected)}
                        aria-pressed={draft.petName === n}
                        onClick={() => update({ petName: n })}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <label className={s.label} htmlFor="ob-pet">Nombre del compañero</label>
                  <input
                    id="ob-pet"
                    className={s.input}
                    value={draft.petName}
                    maxLength={30}
                    autoComplete="off"
                    placeholder="Escribe un nombre"
                    onChange={(e) => update({ petName: e.target.value })}
                  />
                  <Button type="submit" size="lg" className={s.next} disabled={!draft.petName.trim()} aria-describedby={draft.petName.trim() ? undefined : 'ob-pet-hint'}>Siguiente ›</Button>
                  {!draft.petName.trim() && <p id="ob-pet-hint" className={s.hint}>Escribe un nombre para seguir</p>}
                </form>
              </Question>
            )}

            {step === 'companionGender' && (
              <Question lumi={t('¿{pet} es niña o niño?')}>
                <Choices>
                  <ChoiceButton label="Es una niña" selected={draft.petGender === 'f'} onClick={() => { update({ petGender: 'f' }); next() }} />
                  <ChoiceButton label="Es un niño" selected={draft.petGender === 'm'} onClick={() => { update({ petGender: 'm' }); next() }} />
                </Choices>
              </Question>
            )}

            {step === 'review' && species && (
              <Question lumi={t('¡Todo listo, {child} y {pet}! ¿Empezamos la aventura?')} petSpecies={species} colorway={draft.colorway}>
                <Button size="lg" variant="gold" onClick={() => void create()} disabled={busy}>
                  ¡Vamos!
                </Button>
                <Button variant="ghost" onClick={back}>Cambiar algo</Button>
              </Question>
            )}

            {step === 'calibration' && childId && species && (
              <div className={s.calib}>
                <CalibrationFlow childId={childId} companionName={companionName} onDone={() => void finishCalibration()} />
              </div>
            )}

            {step === 'prologue' && (
              <PrologueStep onDone={leave} />
            )}
          </motion.div>
        </AnimatePresence>
      </Screen>
    </MotionConfig>
  )
}

function PrologueStep({ onDone }: { onDone: () => void }) {
  const story = getStory(PROLOGUE_STORY_ID)
  if (!story) {
    onDone()
    return null
  }
  return <StoryPlayer story={story} onDone={onDone} />
}

/** A question: Lumi (or the companion, when a species is known) asks, then the answer controls. */
function Question({ lumi, children, petSpecies, colorway }: {
  lumi: string; children: ReactNode; petSpecies?: CompanionSpecies; colorway?: string
}) {
  return (
    <section className={s.question}>
      <div className={s.ask}>
        <div className={s.lumiArt}>
          <Character id="lumi" pose="talk" size={120} />
        </div>
        <div className={s.bubble} aria-live="polite">
          <p className={s.bubbleText}>{lumi}</p>
        </div>
      </div>
      {petSpecies && (
        <div className={s.petPreview} aria-hidden="true">
          <CompanionArt species={petSpecies} colorway={colorway} size={96} animated />
        </div>
      )}
      <div className={s.answers}>{children}</div>
    </section>
  )
}

function Choices({ children }: { children: ReactNode }) {
  return <div className={s.choices}>{children}</div>
}

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={clsx(s.choice, selected && s.selected)} aria-pressed={selected} onClick={onClick}>
      {label}
    </button>
  )
}
