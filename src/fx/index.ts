/* PUBLIC API of visual effects (agent: audio-pwa). Stub until implemented. */
export type CelebrationKind = 'small' | 'big' | 'crystal' | 'stars' | 'chest'

/** Fire a themed celebration (confetti/stars). Respects prefers-reduced-motion. */
export function celebrate(_kind: CelebrationKind, _opts?: { colors?: string[]; origin?: { x: number; y: number } }): void {}
