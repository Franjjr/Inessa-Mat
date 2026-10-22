/* StoryPlayer: plays a StoryDef scene by scene. Each tap (or Enter / arrow key) shows the next line; the story ends
   after the last one. Characters come from @/art, backgrounds from WorldBackground, lines go through renderTemplate
   so the child hears and reads their own name. Also used for the prologue, world arrivals, rescues and the finale. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Character, CompanionArt, Predicament, WorldBackground } from '@/art'
import { FALLBACK_CHILD_NAME, renderTemplate, templateContext, type TemplateContext } from '@/content'
import { sfx, speech } from '@/audio'
import { useActiveChild } from '@/data'
import type { CharacterId, Pose, SfxName, SpeechOptions, StoryDef, StoryLine, StoryScene } from '@/types'
import type { StoryPlayerProps } from '../contracts'
import { BackButton, Button } from '@/ui'
import s from './StoryPlayer.module.css'

/** Names shown above the bubbles (the companion and the child are named from the child's profile). */
const SPEAKER_NAMES: Partial<Record<CharacterId, string>> = {
  lumi: 'Lumi',
  borron: 'Borrón',
  owl: 'El Búho Sabio',
  frog: 'La Rana Saltarina',
  ladybug: 'La Reina Mariquita',
  polarbear: 'La osa Nieve',
  octopus: 'Octavio',
  fairy: 'Hada Iris',
  dragon: 'Chispa',
  queen: 'La Reina Aurora',
}

const SPEAKER_VOICE: Partial<Record<CharacterId, NonNullable<SpeechOptions['voice']>>> = {
  lumi: 'lumi',
  borron: 'guardian',
  owl: 'guardian', frog: 'guardian', ladybug: 'guardian', polarbear: 'guardian',
  octopus: 'guardian', fairy: 'guardian', dragon: 'guardian', queen: 'guardian',
  companion: 'companion',
  narrator: 'narrator',
}

const POSITION_LEFT: Record<StoryScene['cast'][number]['position'], string> = {
  left: '20%', center: '50%', right: '80%',
}

/** One tap = one beat: a line, or an empty scene that only changes the picture. */
interface Beat {
  scene: number
  line: StoryLine | null
}

function buildBeats(story: StoryDef): Beat[] {
  return story.scenes.flatMap((scene, i): Beat[] =>
    scene.lines.length ? scene.lines.map((line) => ({ scene: i, line })) : [{ scene: i, line: null }],
  )
}

function contextOf(child: ReturnType<typeof useActiveChild>['child']): TemplateContext {
  return child
    ? templateContext(child)
    : { childName: FALLBACK_CHILD_NAME, childGender: 'm', petName: 'Bigotes', petGender: 'm', petSpecies: 'cat' }
}

/** Stage figures scale with the height of the screen so phones and tablets both fit. */
function useFigureSize(): number {
  const [h, setH] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  useEffect(() => {
    const onResize = () => setH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return Math.round(Math.min(300, Math.max(150, h * 0.34)))
}

export default function StoryPlayer({ story, onDone, onExit }: StoryPlayerProps) {
  const { child } = useActiveChild()
  const ctx = useMemo(() => contextOf(child), [child])
  const beats = useMemo(() => buildBeats(story), [story])
  const figure = useFigureSize()
  const [index, setIndex] = useState(0)
  const doneRef = useRef(false)

  const beat = beats[index]
  const scene: StoryScene | undefined = story.scenes[beat?.scene ?? 0]
  const line = beat?.line ?? null
  const voiceOn = child?.settings.voice ?? false
  const companion = child?.companion
  const sceneCount = story.scenes.length

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  const advance = () => {
    if (index >= beats.length - 1) finish()
    else setIndex(index + 1)
  }

  // Sound effects and optional spoken line for each beat.
  useEffect(() => {
    if (!beat) return
    if (line?.sfx) sfx.play(line.sfx as SfxName)
    if (line && voiceOn) {
      const plain = renderTemplate(line.text, ctx).replace(/^—\s*/, '')
      const voice = line.speaker === 'companion' ? 'companion' : SPEAKER_VOICE[line.speaker] ?? 'narrator'
      void speech.say(plain, { voice, interrupt: true }).catch(() => undefined)
    }
    // Runs once per beat: the sound and the spoken line belong to that beat only.
  }, [index])

  // Keyboard: Enter, Space and → continue; Escape leaves (when the caller allows it). Keys pressed on a real
  // button (Salir, Saltar) keep their own meaning, and a held key does not race through the whole story.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null
      const onControl = !!target?.closest('button, a, input, textarea, select')
      if ((e.key === 'Enter' || e.key === ' ') && onControl) return
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (!e.repeat) advance()
      } else if (e.key === 'Escape' && onExit) {
        onExit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const speakerName = (speaker: StoryLine['speaker'] | undefined): string | null => {
    if (!speaker || speaker === 'narrator') return null
    if (speaker === 'companion') return companion?.name?.trim() || ctx.petName
    return SPEAKER_NAMES[speaker] ?? null
  }

  const isChildLine = !!line && line.text.trim().startsWith('—')
  const speakerLabel = isChildLine ? ctx.childName : speakerName(line?.speaker)
  const text = line ? renderTemplate(line.text, ctx).replace(/^—\s*/, '') : ''
  const rescue = sceneCount > 1 ? (beat?.scene ?? 0) / (sceneCount - 1) : 1

  return (
    <MotionConfig reducedMotion="user">
      <div className={s.root}>
        <AnimatePresence initial={false}>
          <motion.div
            key={beat?.scene ?? 0}
            className={s.background}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <WorldBackground id={scene?.background ?? 'home'} vividness={1} />
          </motion.div>
        </AnimatePresence>

        <header className={s.top}>
          {onExit ? (
            <BackButton variant="exit" onClick={onExit} />
          ) : <span />}
          <h1 className={s.title}>{renderTemplate(story.title, ctx)}</h1>
          <Button variant="ghost" size="sm" className={s.touch} onClick={finish}>Saltar</Button>
        </header>

        <div
          className={s.stage}
          role="button"
          tabIndex={0}
          aria-label="Seguir la historia"
          onClick={advance}
        >
          {scene?.cast.map((member, i) => {
            const isSpeaker = line?.speaker === member.id
            const pose: Pose = isSpeaker && line?.pose ? line.pose : isSpeaker ? 'talk' : member.pose
            const figureNode = member.id === 'companion' ? (
              <CompanionArt
                species={companion?.species ?? 'cat'}
                colorway={companion?.colorway}
                equipped={companion?.equipped}
                pose={pose}
                size={figure}
                flip={member.position === 'right'}
              />
            ) : member.id === 'narrator' ? null : (
              <Character id={member.id} pose={pose} size={figure} flip={member.position === 'right'} />
            )
            if (!figureNode) return null
            const wrapped = member.predicament && member.predicament !== 'none' && member.id === 'companion'
              ? <Predicament kind={member.predicament} rescue={rescue}>{figureNode}</Predicament>
              : figureNode
            const style: CSSProperties = { left: POSITION_LEFT[member.position], zIndex: isSpeaker ? 2 : 1 }
            return (
              <div key={`${member.id}-${i}`} className={clsx(s.actor, isSpeaker && s.speaking)} style={style}>
                {wrapped}
              </div>
            )
          })}

          <AnimatePresence mode="wait" initial={false}>
            {line && (
              <motion.div
                key={index}
                className={clsx(s.bubble, isChildLine && s.childBubble)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                aria-live="polite"
              >
                {speakerLabel && <span className={s.speaker}>{speakerLabel}</span>}
                <p className={s.text}>{text}</p>
                <span className={s.hint} aria-hidden="true">Toca para seguir ›</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className={s.footer} aria-hidden="true">
          {beats.map((_, i) => (
            <span key={i} className={clsx(s.dot, i === index && s.dotOn, i < index && s.dotPast)} />
          ))}
        </footer>
      </div>
    </MotionConfig>
  )
}
