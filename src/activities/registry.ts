/* Contract file (owned by the integrator). Maps activity kinds and exercise kinds to lazily loaded components.
   Each module creates the folder referenced here with a DEFAULT export. Do not import activities directly elsewhere:
   use <ActivityRunner/> and <ExerciseView/> (src/activities/index.ts). */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ActivityKind, ActivityProps, ExerciseKind, ExerciseViewProps } from '@/types'

type LazyActivity = LazyExoticComponent<ComponentType<ActivityProps>>
type LazyView = LazyExoticComponent<ComponentType<ExerciseViewProps>>

export const activityRegistry: Record<ActivityKind, LazyActivity> = {
  // ---- Activities A (agent: activities-facts) — src/activities/<kind>/index.tsx
  facts: lazy(() => import('./facts')),
  race: lazy(() => import('./race')),
  missing: lazy(() => import('./missing')),
  wheel: lazy(() => import('./wheel')),
  necklace: lazy(() => import('./necklace')),
  chain: lazy(() => import('./chain')),
  family: lazy(() => import('./family')),
  maze: lazy(() => import('./maze')),
  pixel: lazy(() => import('./pixel')),
  memory: lazy(() => import('./memory')),
  bubbles: lazy(() => import('./bubbles')),
  // ---- Activities B (agent: activities-ops) — src/activities/<kind>/index.tsx
  groups: lazy(() => import('./groups')),
  array: lazy(() => import('./array')),
  column: lazy(() => import('./column')),
  division: lazy(() => import('./division')),
  share: lazy(() => import('./share')),
  word: lazy(() => import('./word')),
  board: lazy(() => import('./board')),
}

export const exerciseViewRegistry: Record<ExerciseKind, LazyView> = {
  // ---- views owned by activities-facts — src/activities/views/<name>.tsx
  'fact-mul': lazy(() => import('./views/FactView')),
  'fact-div': lazy(() => import('./views/FactView')),
  'missing-factor': lazy(() => import('./views/MissingFactorView')),
  'skip-count': lazy(() => import('./views/SkipCountView')),
  'double-chain': lazy(() => import('./views/DoubleChainView')),
  'fact-family': lazy(() => import('./views/FactFamilyView')),
  // ---- views owned by activities-ops
  groups: lazy(() => import('./views/GroupsView')),
  array: lazy(() => import('./views/ArrayView')),
  'column-add': lazy(() => import('./views/ColumnView')),
  'column-sub': lazy(() => import('./views/SubtractionView')),
  'column-mul': lazy(() => import('./views/ColumnView')),
  division: lazy(() => import('./views/DivisionView')),
  'word-problem': lazy(() => import('./views/WordProblemView')),
  // ---- numbers up to 9 999, cálculo mental and signo igual (3.º, block A) — src/activities/views/<name>.tsx
  'place-value': lazy(() => import('./views/PlaceValueView')),
  compare: lazy(() => import('./views/CompareView')),
  order: lazy(() => import('./views/OrderView')),
  round: lazy(() => import('./views/RoundView')),
  'number-line': lazy(() => import('./views/NumberLineView')),
  mental: lazy(() => import('./views/MentalView')),
  equation: lazy(() => import('./views/EquationView')),
}
