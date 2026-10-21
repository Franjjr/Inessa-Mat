/* TEMPORARY placeholders (art-worlds replaces and deletes). Signatures are the contract. */
import type { NodeKind, PredicamentProps, WorldBackgroundProps } from '@/types'

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
export function NodeIcon({ kind, size = 56 }: { kind: NodeKind; size?: number; done?: boolean; locked?: boolean; color?: string }) {
  const e = { story: '📖', lesson: '💡', activity: '🧩', guardian: '🛡️', review: '⭐' }[kind]
  return <span style={{ fontSize: size * 0.6 }}>{e}</span>
}
