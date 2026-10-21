/* TEMPORARY placeholders (art agents replace and delete). Signatures are the contract. */
import type { CharacterProps, CompanionArtProps, PredicamentProps, WorldBackgroundProps } from '@/types'

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
export function Predicament({ children }: PredicamentProps) {
  return <>{children}</>
}
export function WorldBackground({ children, className }: WorldBackgroundProps) {
  return <div className={className} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#ede9fe,#faf5ff)' }}>{children}</div>
}
export function Crystal({ color = '#7c3aed', state = 'empty', size = 48 }: { color?: string; state?: 'locked' | 'empty' | 'glow' | 'collected'; size?: number }) {
  return <span style={{ fontSize: size * 0.8, opacity: state === 'collected' || state === 'glow' ? 1 : 0.35, color }}>💎</span>
}
export function StarIcon({ filled = false, size = 32 }: { filled?: boolean; size?: number }) {
  return <span style={{ fontSize: size * 0.8 }}>{filled ? '⭐' : '☆'}</span>
}
export function ChestArt({ open = false, size = 160 }: { open?: boolean; size?: number }) {
  return <span style={{ fontSize: size * 0.8 }}>{open ? '🎁' : '🧰'}</span>
}
export function Sparkles(_props: { active?: boolean; color?: string; count?: number }) {
  return null
}
export function LumiHorn({ crystals, size = 120 }: { crystals: boolean[]; size?: number }) {
  return <span style={{ fontSize: size * 0.3 }}>{crystals.map((c) => (c ? '💎' : '◇')).join('')}</span>
}
