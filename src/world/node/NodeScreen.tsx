/* NodeScreen: one node of a world. Dispatches by node kind (story, lesson, activity, guardian, review), wraps the
   play in GameHostProvider, saves the result through @/content applyNodeResult + @/data updateProgress and then
   shows the reward (RewardOverlay) before going back to the map. An activity below the pass mark (activityPassed) is
   not saved: the child sees how many were right, a way to review the lesson and the retry. */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActivityRunner, LessonPlayer } from '@/activities'
import {
  activityPassed, applyNodeResult, finaleStoryId, getGuardian, getLesson, getNode, getStory, getWorld, isNodeUnlocked,
  newStickers, passMark, COMPLETION_STARS, ISLAND_ID, INGLES_CLASSES, markClassDone, TEACH_BACK_ACTIVITY, type ClassDef,
} from '@/content'
import { markClassToday, starsFor } from '@/engine'
import { getProgress, updateProgress, useActiveChild, useProgress } from '@/data'
import { Button, Card, Screen, Spinner, toast } from '@/ui'
import type { ChildProfile, NodeDef, ProgressState, WorldDef } from '@/types'
import GuardianChallenge from '@/world/guardian/GuardianChallenge'
import RewardOverlay from '@/world/rewards/RewardOverlay'
import DailyReview from '@/world/review/DailyReview'
import StoryPlayer from '@/world/story/StoryPlayer'
import { GameHostProvider } from '@/world/host/GameHost'
import CompanionBuddy from '@/world/host/CompanionBuddy'
import s from './NodeScreen.module.css'

interface NodeResult {
  stars: number
  ms?: number
  passed?: boolean
  letter?: string
}

interface RewardPayload {
  kind: 'node' | 'crystal' | 'season'
  /** Stars of this attempt. */
  stars: number
  /** The best stars kept for the node, and whether this attempt raised them (only after an earlier best). */
  bestStars?: number
  improved?: boolean
  /** A reading (story or lesson) is worth one star at most: the reward shows one star. */
  maxStars?: number
  letter?: string
  stickers: string[]
}

/** What an activity or a review hands over when it ends. */
interface Outcome {
  correct: number
  total: number
  stars: number
  ms?: number
}

/** Attempts below the pass mark during one visit before the child may move on anyway (no node is stuck for good). */
const FAILS_BEFORE_MOVING_ON = 3

/** What the node screen shows next. Story phases chain into `then`. */
type Phase =
  | { name: 'play' }
  | { name: 'story'; storyId: string; then: Phase }
  | { name: 'teach'; then: Phase }
  | { name: 'reward'; payload: RewardPayload }
  | { name: 'retry'; result: Outcome }

/** The best stars kept for the node after this attempt, and whether it raised a best that already existed. */
function bestOf(before: ProgressState, after: ProgressState, worldId: string, nodeId: string) {
  const prevBest = before.worlds[worldId]?.nodes[nodeId]?.stars ?? 0
  const bestStars = after.worlds[worldId]?.nodes[nodeId]?.stars ?? 0
  return { bestStars, improved: prevBest > 0 && bestStars > prevBest }
}

export default function NodeScreen() {
  const { worldId = '', nodeId = '' } = useParams()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!progress) return <Spinner />
  // The node of the child's season: the 2.º adventure has its own stops on the same map.
  const world = getWorld(worldId, progress.seasonId)
  const node = getNode(worldId, nodeId, progress.seasonId)
  if (!world || !node) return <Navigate to="/play" replace />
  return <NodeRunner key={`${progress.seasonId}/${world.id}/${node.id}`} world={world} node={node} child={child} />
}

function NodeRunner({ world, node, child }: { world: WorldDef; node: NodeDef; child: ChildProfile }) {
  const navigate = useNavigate()
  const progress = useProgress(child.id)
  const [phase, setPhase] = useState<Phase>({ name: 'play' })
  /** Activities below the pass mark during this visit (see FAILS_BEFORE_MOVING_ON). */
  const [fails, setFails] = useState(0)
  const resumeSaved = useRef(false)
  const mapPath = `/play/w/${world.id}`

  // Remember where the child is, so "Seguir la aventura" can bring them back here.
  useEffect(() => {
    if (!progress || resumeSaved.current) return
    resumeSaved.current = true
    const last = progress.lastNode
    if (last?.worldId === world.id && last.nodeId === node.id) return
    void updateProgress(child.id, (p) => ({ ...p, lastNode: { worldId: world.id, nodeId: node.id } }))
      .catch(() => undefined)
  }, [progress, child.id, world.id, node.id])

  if (!progress) return <Spinner />
  if (!isNodeUnlocked(progress, world.id, node.id)) return <Navigate to={mapPath} replace />

  const exit = () => navigate(mapPath)

  /** Save a node result, then show the reward (or go back to the map if saving fails). An island lesson stop is its English
      class: the class is marked taught and dated today, as when the class is played from «Hoy». */
  const complete = async (result: NodeResult, kind: RewardPayload['kind'] = 'node', englishClass?: ClassDef) => {
    try {
      const before: ProgressState = await getProgress(child.id)
      const after = await updateProgress(child.id, (p) => {
        const done = applyNodeResult(p, world.id, node.id, result)
        return englishClass ? markClassToday(markClassDone(done, englishClass, 'lesson'), englishClass.topicId, new Date()) : done
      })
      // A reading (story or lesson) is worth one star: no «de 3» and no best mark for it.
      const reading = node.kind === 'story' || node.kind === 'lesson'
      setPhase({
        name: 'reward',
        payload: {
          kind,
          stars: result.stars,
          ...(reading ? { maxStars: 1 } : bestOf(before, after, world.id, node.id)),
          letter: result.letter,
          stickers: newStickers(before, after),
        },
      })
    } catch {
      toast('No hemos podido guardar el resultado. Vuelve a intentarlo en un momento.')
      navigate(mapPath, { replace: true })
    }
  }

  /** An activity or a review is passed with activityPassed (most of its items right); below that it shows the retry screen. */
  const finishActivity = (r: Outcome, moveOn = false) => {
    if (moveOn || activityPassed(r.correct, r.total)) {
      void complete({ stars: r.stars, ms: r.ms, passed: true })
      return
    }
    setFails((n) => n + 1)
    setPhase({ name: 'retry', result: r })
  }

  /** «Saltar» on a story: the node is done, but a story that was not read gives no star and no reward is shown. */
  const skipStory = async () => {
    try {
      await updateProgress(child.id, (p) => applyNodeResult(p, world.id, node.id, { stars: 0, passed: true }))
    } catch {
      toast('No hemos podido guardar el resultado. Vuelve a intentarlo en un momento.')
    }
    navigate(mapPath, { replace: true })
  }

  const rewardPhase = (payload: RewardPayload): Phase => ({ name: 'reward', payload })

  if (phase.name === 'story') {
    const story = getStory(phase.storyId)
    if (!story) return <Missing onBack={() => setPhase(phase.then)} />
    return <StoryPlayer story={story} onDone={() => setPhase(phase.then)} onExit={() => setPhase(phase.then)} />
  }

  if (phase.name === 'teach') {
    return <TeachBack world={world} node={node} onDone={() => setPhase(phase.then)} />
  }

  if (phase.name === 'retry') {
    const { result } = phase
    const review = lessonBefore(world, node.id)
    return (
      <Screen background={`linear-gradient(180deg, ${world.colorSoft}, var(--c-bg))`}>
        <NotYetPassed
          correct={result.correct}
          total={result.total}
          canMoveOn={fails >= FAILS_BEFORE_MOVING_ON}
          onRetry={() => setPhase({ name: 'play' })}
          onReview={review ? () => navigate(`/play/w/${world.id}/${review.id}`) : undefined}
          onMoveOn={() => finishActivity(result, true)}
          onExit={exit}
        />
      </Screen>
    )
  }

  if (phase.name === 'reward') {
    return (
      <Screen background={`linear-gradient(180deg, ${world.colorSoft}, var(--c-bg))`}>
        <RewardOverlay
          kind={phase.payload.kind === 'node' ? 'node' : phase.payload.kind === 'crystal' ? 'crystal' : 'season'}
          stars={phase.payload.stars}
          bestStars={phase.payload.bestStars}
          improved={phase.payload.improved}
          maxStars={phase.payload.maxStars}
          world={world}
          letter={phase.payload.letter}
          newStickers={phase.payload.stickers}
          onContinue={() => navigate(mapPath, { replace: true })}
        />
      </Screen>
    )
  }

  return <div className={s.frame}>{renderPlay()}</div>

  function renderPlay() {
    switch (node.kind) {
      case 'story': {
        const story = node.ref ? getStory(node.ref) : undefined
        if (!story) return <Missing onBack={exit} />
        return (
          <StoryPlayer
            story={story}
            onDone={() => void complete({ stars: COMPLETION_STARS, passed: true })}
            onSkip={() => void skipStory()}
            onExit={exit}
          />
        )
      }
      case 'lesson': {
        const lesson = node.ref ? getLesson(node.ref) : undefined
        if (!lesson) return <Missing onBack={exit} />
        const englishClass = world.id === ISLAND_ID ? INGLES_CLASSES.find((c) => c.lesson.id === node.ref) : undefined
        return (
          <GameHostProvider worldId={world.id} nodeId={node.id} activity="lesson">
            <LessonPlayer
              lesson={lesson}
              onDone={() => void complete({ stars: COMPLETION_STARS, passed: true }, 'node', englishClass)}
              onExit={exit}
            />
          </GameHostProvider>
        )
      }
      case 'activity': {
        if (!node.activity) return <Missing onBack={exit} />
        const config0 = node.activity
        const records = progress?.worlds[world.id]?.nodes[node.id]?.records
        // Race nodes get the child's personal records so the ghost pace and record text can show.
        const config = config0.kind === 'race' && records?.length
          ? { ...config0, params: { ...config0.params, records } }
          : config0
        return (
          <GameHostProvider worldId={world.id} nodeId={node.id} activity={config.kind}>
            <ActivityRunner
              config={config}
              onDone={(r) => finishActivity(r)}
              onExit={exit}
            />
            <CompanionBuddy />
          </GameHostProvider>
        )
      }
      case 'guardian': {
        const guardian = node.ref ? getGuardian(node.ref) : undefined
        if (!guardian) return <Missing onBack={exit} />
        return (
          <GameHostProvider worldId={world.id} nodeId={node.id} activity="guardian">
            <GuardianChallenge
              guardian={guardian}
              world={world}
              onPass={(r) => void passGuardian(r.correct, r.total, r.letter, guardian.rescueStory)}
              onFail={() => undefined}
              onExit={exit}
            />
            <CompanionBuddy />
          </GameHostProvider>
        )
      }
      case 'review': {
        return (
          <GameHostProvider worldId={world.id} nodeId={node.id} activity="review">
            <DailyReview
              onDone={(r) => finishActivity(r)}
              onExit={exit}
            />
            <CompanionBuddy />
          </GameHostProvider>
        )
      }
      default:
        return <Missing onBack={exit} />
    }
  }

  /** A guardian pass frees the companion (rescue story), then the crystal reward. World 8 also plays the finale. */
  async function passGuardian(correct: number, total: number, letter: string | undefined, rescueStory: string) {
    const stars = starsFor(correct, total)
    try {
      const before = await getProgress(child.id)
      const after = await updateProgress(child.id, (p) =>
        applyNodeResult(p, world.id, node.id, { stars, passed: true, letter }),
      )
      const earnedLetter = after.worlds[world.id]?.letter ?? letter
      const stickers = newStickers(before, after)
      const best = bestOf(before, after, world.id, node.id)
      // The island's guardians give no maths crystal (the horn and the secret word are the maths adventure's): a plain reward.
      const reward = rewardPhase({ kind: world.id === ISLAND_ID ? 'node' : 'crystal', stars, ...best, letter: earnedLetter, stickers })
      const seasonReward = rewardPhase({ kind: 'season', stars, ...best, letter: earnedLetter, stickers })
      // The finale of the 3.º adventure may hand over the optional game «Enséñale a Borrón» (its facts are the 6, 7 and 8 tables).
      const finale: Phase = world.index === 8
        ? { name: 'story', storyId: finaleStoryId(after.seasonId), then: after.seasonId === 's1' ? { name: 'teach', then: seasonReward } : seasonReward }
        : reward
      setPhase({ name: 'story', storyId: rescueStory, then: finale })
    } catch {
      toast('No hemos podido guardar el cristal. Vuelve a intentarlo en un momento.')
      navigate(mapPath, { replace: true })
    }
  }
}

/** The optional game of the finale: the child teaches Borrón. Its answers are practice like any game (they count
    for the tables' mastery), but it gives no stars and changes no progress of the node; «Ahora no» skips it. */
function TeachBack({ world, node, onDone }: { world: WorldDef; node: NodeDef; onDone: () => void }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <div className={s.frame}>
        <GameHostProvider worldId={world.id} nodeId={node.id} activity="facts">
          <ActivityRunner config={TEACH_BACK_ACTIVITY} onDone={onDone} onExit={onDone} />
        </GameHostProvider>
      </div>
    )
  }
  return (
    <Screen background={`linear-gradient(180deg, ${world.colorSoft}, var(--c-bg))`}>
      <div className={s.missing}>
        <Card>
          <p className={s.missingText}>Borrón quiere aprender. ¿Le enseñas un truco?</p>
          <Button onClick={() => setPlaying(true)}>¡Sí, enséñale!</Button>
          <Button variant="ghost" onClick={onDone}>Ahora no</Button>
        </Card>
      </div>
    </Screen>
  )
}

/** The lesson to review before this node: the nearest lesson stop of the world before it (none when no lesson comes before). */
function lessonBefore(world: WorldDef, nodeId: string): NodeDef | undefined {
  const i = world.nodes.findIndex((n) => n.id === nodeId)
  const before = world.nodes.slice(0, Math.max(i, 0)).filter((n) => n.kind === 'lesson')
  return before[before.length - 1]
}

/** Below the pass mark: how many were right, what it takes to move on, and the ways forward. */
function NotYetPassed({ correct, total, canMoveOn, onRetry, onReview, onMoveOn, onExit }: {
  correct: number
  total: number
  canMoveOn: boolean
  onRetry: () => void
  onReview?: () => void
  onMoveOn: () => void
  onExit: () => void
}) {
  const need = passMark(total)
  return (
    <div className={s.missing}>
      <Card>
        <p className={s.missingText}>¡Casi lo tienes!</p>
        <p className={s.missingText}>
          {`Has acertado ${correct} de ${total}. Para seguir al siguiente paso hacen falta ${need}. Repasa lo que te ha costado y vuelve a intentarlo.`}
        </p>
        {onReview && <Button variant="secondary" onClick={onReview}>Repasar con Lumi</Button>}
        <Button onClick={onRetry}>Volver a intentarlo</Button>
        {canMoveOn && <Button variant="ghost" onClick={onMoveOn}>Seguir por ahora</Button>}
        <Button variant="ghost" onClick={onExit}>Volver al mapa</Button>
      </Card>
    </div>
  )
}

function Missing({ onBack }: { onBack: () => void }) {
  return (
    <Screen>
      <div className={s.missing}>
        <Card>
          <p className={s.missingText}>Esta parte de la aventura todavía no está lista. ¡Vuelve al mapa!</p>
          <Button onClick={onBack}>Volver al mapa</Button>
        </Card>
      </div>
    </Screen>
  )
}
