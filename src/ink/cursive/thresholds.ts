/* The only place to tune the strict letra ligada scorer. Shape, line and start are dimensionless: their value
   is a distance or error divided by XHEIGHT (or a 0..1 error for start), and a value at or below the limit passes.
   Size is the child's stroke height over the model's, and must sit inside the band. */

export type Criterion = 'shape' | 'line' | 'size' | 'start'

export const CURSIVE_THRESHOLDS = {
  /** Shape: symmetric mean distance child↔model after aligning, in x-heights. */
  shape: 0.04,
  /** Line: |mean offset of the child's baseline points from BASELINE|, in x-heights. */
  line: 0.06,
  /** Size: child height / model height. */
  size: { min: 0.9, max: 1.1 },
  /** Start: max of the start-point error and the direction error (0 = same, 1 = opposite), in x-heights for the point. */
  start: 0.25,
  /** Stars: how many criteria may fail for 3 stars (0 = all pass), and for 2 stars (shape must pass too). */
  stars: { threeMaxFailed: 0, twoMaxFailed: 1 },
  /** Model units off the model path before the live «Te has salido» mark (used while tracing). */
  liveOffPath: 6,
} as const
