/** Sound effects synthesised with Web Audio (src/audio/sfx.ts). No audio files required. */
export type SfxName =
  | 'tap' | 'select' | 'write' | 'erase'
  | 'correct' | 'wrong' | 'streak' | 'hint'
  | 'star' | 'crystal' | 'levelup' | 'unlock' | 'rescue'
  | 'whoosh' | 'pop' | 'sparkle' | 'page' | 'dice' | 'step'
  | 'chest-open' | 'fanfare' | 'tick' | 'timeup' | 'coin'

export type MusicTheme = 'map' | 'calm' | 'play' | 'guardian' | 'celebration' | 'none'

export interface SpeechOptions {
  /** 'lumi' slightly higher/brighter, 'companion' playful, 'narrator' neutral. */
  voice?: 'lumi' | 'companion' | 'narrator' | 'guardian'
  rate?: number
  interrupt?: boolean
}
