/* The only place to tune the strict letra ligada scorer. All limits are in model units (the em is 100 units, the
   x-height 40) or dimensionless ratios, so they hold at any canvas size. A value at or below its limit passes. */

export type Criterion = 'shape' | 'line' | 'size' | 'start'

export const CURSIVE_THRESHOLDS = {
  /** Shape, mean: symmetric mean distance child↔model after aligning, in x-heights. */
  shape: 0.04,
  /** Shape, off the line: the share of points (both sides) farther than shapeTolerance from the other side. */
  shapeOff: 0.01,
  /** Model units beyond which a point counts as off the line (a noisy hand stays inside it; a spike or wobble does not). */
  shapeTolerance: 2.6,
  /** Shape, width: |(child width / child height) / (model width / model height) − 1|; the width is the 10th–90th percentile span. */
  shapeAspect: 0.08,
  /** Line: |mean offset of the child's baseline points from BASELINE|, in x-heights. */
  line: 0.06,
  /** Size: child body height / model body height (body = the 10th–90th percentile span of the ink, so one jittered point does not move it). */
  size: { min: 0.93, max: 1.07 },
  /** Start: max of the start-point error (x-heights) and the direction error (1 − cos of the set-off chord). */
  start: 0.15,
  /** Stars: how many criteria may fail for 3 stars (0 = all pass), and for 2 stars (shape must pass too). */
  stars: { threeMaxFailed: 0, twoMaxFailed: 1 },
  /** Model units off the model path before the live «Te has salido» mark (used while tracing). */
  liveOffPath: 6,
} as const
