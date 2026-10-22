/* PUBLIC API of visual effects (agent: audio-pwa). Implementation in ./celebrate (canvas-confetti, themed
   star/sparkle particles, reduced-motion glow) and ./palettes (token-derived colours).
   Extra beyond the original contract: stopCelebrations(). */
export type { CelebrationKind } from './celebrate'
export { celebrate, stopCelebrations } from './celebrate'
