/* NodeScreen: one node of a world. Dispatches by node kind (story, lesson, activity, guardian, review), wraps the
   play in GameHostProvider, saves the result through @/content applyNodeResult + @/data updateProgress and then
   shows the reward (RewardOverlay) before going back to the map. */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActivityRunner, LessonPlayer } from '@/activities'
import {
  applyNodeResult, FINALE_STORY_ID, getGuardian, getLesson, getNode, getStory, getWorld, isNodeUnlocked,
  newStickers, COMPLETION_STARS,
} from '@/content'
import { starsFor } from '@/engine'
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
  stars: number
  letter?: string
  stickers: string[]
}

/** What the node screen shows next. Story phases chain into `then`. */
type Phase =
  | { name: 'play' }
  | { name: 'story'; storyId: string; then: Phase }
  | { name: 'reward'; payload: RewardPayload }

export default function NodeScreen() {
  const { worldId = '', nodeId = '' } = useParams()
  const { child, loading } = useActiveChild()
  const world = getWorld(worldId)
  const node = getNode(worldId, nodeId)

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!world || !node) return <Navigate to="/play" replace />
  return <NodeRunner key={`${world.id}/${node.id}`} world={world} node={node} child={child} />
}

function NodeRunner({ world, node, child }: { world: WorldDef; node: NodeDef; child: ChildProfile }) {
  const navigate = useNavigate()
  const progress = useProgress(child.id)
  const [phase, setPhase] = useState<Phase>({ name: 'play' })
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

  /** Save a node result, then show the reward (or go back to the map if saving fails). */
  const complete = async (result: NodeResult, kind: RewardPayload['kind'] = 'node') => {
    try {
      const before: ProgressState = await getProgress(child.id)
      const after = await updateProgress(child.id, (p) => applyNodeResult(p, world.id, node.id, result))
      const stars = after.worlds[world.id]?.nodes[node.id]?.stars ?? result.stars
      setPhase({
        name: 'reward',
        payload: { kind, stars, letter: result.letter, stickers: newStickers(before, after) },
      })
    } catch {
      toast('No hemos podido guardar el resultado. Vuelve a intentarlo en un momento.')
      navigate(mapPath, { replace: true })
    }
  }

  const rewardPhase = (payload: RewardPayload): Phase => ({ name: 'reward', payload })

  if (phase.name === 'story') {
    const story = getStory(phase.storyId)
    if (!story) return <Missing onBack={() => setPhase(phase.then)} />
    return <StoryPlayer story={story} onDone={() => setPhase(phase.then)} onExit={() => setPhase(phase.then)} />
  }

  if (phase.name === 'reward') {
    return (
      <Screen background={`linear-gradient(180deg, ${world.colorSoft}, var(--c-bg))`}>
        <RewardOverlay
          kind={phase.payload.kind === 'node' ? 'node' : phase.payload.kind === 'crystal' ? 'crystal' : 'season'}
          stars={phase.payload.stars}
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
            onExit={exit}
          />
        )
      }
      case 'lesson': {
        const lesson = node.ref ? getLesson(node.ref) : undefined
        if (!lesson) return <Missing onBack={exit} />
        return (
          <GameHostProvider worldId={world.id} nodeId={node.id} activity="lesson">
            <LessonPlayer
              lesson={lesson}
              onDone={() => void complete({ stars: COMPLETION_STARS, passed: true })}
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
              onDone={(r) => void complete({ stars: r.stars, ms: r.ms })}
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
              onDone={(r) => void complete({ stars: r.stars, passed: r.total > 0 })}
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
      const reward = rewardPhase({ kind: 'crystal', stars, letter: earnedLetter, stickers })
      const finale: Phase = world.index === 8
        ? { name: 'story', storyId: FINALE_STORY_ID, then: rewardPhase({ kind: 'season', stars, letter: earnedLetter, stickers }) }
        : reward
      setPhase({ name: 'story', storyId: rescueStory, then: finale })
    } catch {
      toast('No hemos podido guardar el cristal. Vuelve a intentarlo en un momento.')
      navigate(mapPath, { replace: true })
    }
  }
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
