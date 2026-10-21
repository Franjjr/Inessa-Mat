/* TEMPORARY placeholders (art-characters replaces and deletes). Signatures are the contract. */
import type { CharacterProps, CompanionArtProps } from '@/types'

const EMOJI: Record<string, string> = {
  lumi: '🦄', borron: '☁️', owl: '🦉', frog: '🐸', ladybug: '🐞', polarbear: '🐻‍❄️', octopus: '🐙', fairy: '🧚', dragon: '🐉', queen: '👸',
  cat: '🐱', dog: '🐶', fox: '🦊', bunny: '🐰', panda: '🐼', penguin: '🐧', unicorn: '🦄',
}

export function Character({ id, size = 160 }: CharacterProps) {
  return <span style={{ fontSize: size * 0.8, lineHeight: 1, display: 'inline-block' }}>{EMOJI[id] ?? '❓'}</span>
}
export function CompanionArt({ species, size = 160 }: CompanionArtProps) {
  return <span style={{ fontSize: size * 0.8, lineHeight: 1, display: 'inline-block' }}>{EMOJI[species] ?? '❓'}</span>
}
export function LumiHorn({ crystals, size = 120 }: { crystals: boolean[]; size?: number }) {
  return <span style={{ fontSize: size * 0.3 }}>{crystals.map((c) => (c ? '💎' : '◇')).join('')}</span>
}
