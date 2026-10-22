/* Registry of every LessonVisualId (src/types/content.ts) → its animated component. The exhaustiveness test in
   visuals.test.tsx reads the union from the types file, so a new id without a component fails the build. */
import type { LessonVisualId } from '@/types'
import { SplitMultiplyVisual, ColumnMulVisual, FivePlusOneVisual, ArrayRotateVisual, GroupsVisual, SquareRhymeVisual } from './multiplication'
import { CarryVisual, PlaceValueVisual } from './addition'
import { BorrowVisual, SubCarryVisual, SubCheckVisual, SubLineVisual, SubPartsVisual, ZeroBorrowVisual } from './subtraction'
import {
  DoubleChainVisual, EasyTablesVisual, EvenSixRhymeVisual, FiveSixSevenEightVisual, KnownFactsVisual,
  NineTrickVisual, PatternUnitsVisual,
} from './tables'
import { DivisionCheckVisual, FactFamilyVisual, GaleraVisual, ShareVisual } from './division'
import type { VisualRegistry } from './types'

export type { VisualProps, LessonParams } from './types'
export { FINAL, stateOf } from './types'

export const LESSON_VISUALS: VisualRegistry = {
  groups: GroupsVisual,
  'array-rotate': ArrayRotateVisual,
  'easy-tables': EasyTablesVisual,
  'place-value': PlaceValueVisual,
  carry: CarryVisual,
  borrow: BorrowVisual,
  'zero-borrow': ZeroBorrowVisual,
  'sub-check': SubCheckVisual,
  'sub-carry': SubCarryVisual,
  'sub-parts': SubPartsVisual,
  'sub-line': SubLineVisual,
  'five-plus-one': FivePlusOneVisual,
  'even-six-rhyme': EvenSixRhymeVisual,
  'double-chain': DoubleChainVisual,
  'pattern-units': PatternUnitsVisual,
  'known-facts': KnownFactsVisual,
  'nine-trick': NineTrickVisual,
  'square-rhyme': SquareRhymeVisual,
  'five-six-seven-eight': FiveSixSevenEightVisual,
  'split-multiply': SplitMultiplyVisual,
  'column-mul': ColumnMulVisual,
  share: ShareVisual,
  'fact-family': FactFamilyVisual,
  galera: GaleraVisual,
  'division-check': DivisionCheckVisual,
}

/** Visual ids in a stable order (for galleries and tests). */
export const LESSON_VISUAL_IDS = Object.keys(LESSON_VISUALS) as LessonVisualId[]
