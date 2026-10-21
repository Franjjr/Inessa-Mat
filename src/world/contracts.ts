/* Cross-agent component contracts inside src/world (integrator-owned).
   world-core agent: picker/, onboarding/, home/, map/, node/, story/, host/
   world-meta agent: guardian/, rewards/, album/, shop/, chest/, diploma/, free/, review/ */
import type { GuardianDef, StoryDef, WorldDef } from '@/types'

/** world-meta → src/world/guardian/GuardianChallenge.tsx (default export). Rendered by NodeScreen (world-core). */
export interface GuardianChallengeProps {
  guardian: GuardianDef
  world: WorldDef
  /** Passed: crystal + letter earned. NodeScreen persists progress and plays the rescue story. */
  onPass: (r: { correct: number; total: number; letter: string }) => void
  onFail: (r: { correct: number; total: number }) => void
  onExit: () => void
}

/** world-meta → src/world/rewards/RewardOverlay.tsx (default export). Shown after any node completes. */
export interface RewardOverlayProps {
  kind: 'node' | 'crystal' | 'season'
  stars: number
  world: WorldDef
  letter?: string
  /** New stickers / accessories unlocked by this result. */
  newStickers?: string[]
  onContinue: () => void
}

/** world-core → src/world/story/StoryPlayer.tsx (default export). Also used by world-meta (rescue/finale scenes). */
export interface StoryPlayerProps {
  story: StoryDef
  onDone: () => void
  onExit?: () => void
}

/** world-meta → src/world/review/DailyReview.tsx (default export). Used as a node of kind 'review' and from home. */
export interface DailyReviewProps {
  onDone: (r: { correct: number; total: number; stars: number }) => void
  onExit?: () => void
}

/** world-core → src/world/host/GameHost.tsx exports <GameHostProvider worldId? nodeId?> which provides the real
    ActivityHost (attempt logging + mastery update + companion reactions) to everything below it. */
export interface GameHostProviderProps {
  worldId?: string
  nodeId?: string
  activity?: string
  children: React.ReactNode
}

/** world-core → src/world/host/CompanionBuddy.tsx: the companion + Lumi corner widget that reacts to host.react(). */
export interface CompanionBuddyProps {
  position?: 'bottom-left' | 'bottom-right'
  size?: number
}
