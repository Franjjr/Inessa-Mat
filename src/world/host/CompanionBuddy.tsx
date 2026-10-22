/* CompanionBuddy: the child's companion and Lumi in a corner. They react to host.react() with a pose change and a
   short speech bubble. Pointer events pass through, so it never blocks an answer. */
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Character, CompanionArt } from '@/art'
import { templateContext, FALLBACK_CHILD_NAME } from '@/content'
import { useActiveChild } from '@/data'
import type { CompanionBuddyProps } from '../contracts'
import type { Pose, ReactionKind } from '@/types'
import { useBuddyBus, type ReactionEvent } from './GameHost'
import s from './CompanionBuddy.module.css'

const COMPANION_POSE: Record<ReactionKind, Pose> = {
  correct: 'happy',
  streak: 'cheer',
  celebrate: 'cheer',
  wrong: 'worried',
  hint: 'think',
  thinking: 'think',
  encourage: 'happy',
}

const LUMI_POSE: Record<ReactionKind, Pose> = {
  correct: 'happy',
  streak: 'surprised',
  celebrate: 'cheer',
  wrong: 'talk',
  hint: 'talk',
  thinking: 'think',
  encourage: 'talk',
}

const BUBBLE_MS = 2600

export default function CompanionBuddy({ position = 'bottom-right', size = 120 }: CompanionBuddyProps) {
  const { child } = useActiveChild()
  const bus = useBuddyBus()
  const [event, setEvent] = useState<ReactionEvent | null>(null)

  useEffect(() => {
    if (!bus) return
    return bus.subscribe((e) => setEvent(e))
  }, [bus])

  // Show the bubble for a while, then settle back to idle.
  useEffect(() => {
    if (!event) return
    const timer = setTimeout(() => setEvent(null), BUBBLE_MS)
    return () => clearTimeout(timer)
  }, [event])

  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const companion = child?.companion
  const companionPose: Pose = event ? COMPANION_POSE[event.kind] : 'idle'
  const lumiPose: Pose = event ? LUMI_POSE[event.kind] : 'idle'
  const petName = companion?.name?.trim() || (child ? templateContext(child).petName : FALLBACK_CHILD_NAME)

  return (
    <div className={clsx(s.buddy, position === 'bottom-left' ? s.left : s.right)}>
      {event?.phrase && (
        <div key={`bubble-${event.id}`} className={s.bubble} role="status">
          <span className={s.speaker}>{petName}</span>
          <span className={s.text}>{event.phrase}</span>
        </div>
      )}
      <div className={clsx(s.figures, event && !reduced && s.bounce)} key={`figures-${event?.id ?? 'idle'}`} aria-hidden="true">
        <div className={s.companion}>
          <CompanionArt
            species={companion?.species ?? 'cat'}
            colorway={companion?.colorway}
            equipped={companion?.equipped}
            pose={companionPose}
            size={size}
            animated={!reduced}
          />
        </div>
        <div className={s.lumi}>
          <Character id="lumi" pose={lumiPose} size={Math.round(size * 0.8)} animated={!reduced} />
        </div>
      </div>
    </div>
  )
}
