/* PUBLIC API of the activities module (integrator-owned entry; implementations by activities-facts,
   activities-ops and lessons agents in their own folders). */
import { Suspense } from 'react'
import type { ActivityConfig, ActivityProps, ExerciseViewProps, LessonDef } from '@/types'
import { Spinner } from '@/ui'
import { activityRegistry, exerciseViewRegistry } from './registry'
import LessonPlayerImpl from './lesson/LessonPlayer'

export { useActivityHost, ActivityHostProvider, defaultActivityHost } from './host'

/** Renders any activity by its kind. */
export function ActivityRunner(props: ActivityProps & { config: ActivityConfig }) {
  const Comp = activityRegistry[props.config.kind]
  return (
    <Suspense fallback={<Spinner />}>
      <Comp {...props} />
    </Suspense>
  )
}

/** Renders a single exercise of any kind with the right answer input. */
export function ExerciseView(props: ExerciseViewProps) {
  const Comp = exerciseViewRegistry[props.exercise.kind]
  return (
    <Suspense fallback={<Spinner />}>
      <Comp {...props} />
    </Suspense>
  )
}

export interface LessonPlayerProps {
  lesson: LessonDef
  onDone: () => void
  onExit?: () => void
}

/** Animated step-by-step lesson (agent: lessons). */
export function LessonPlayer(props: LessonPlayerProps) {
  return <LessonPlayerImpl {...props} />
}
