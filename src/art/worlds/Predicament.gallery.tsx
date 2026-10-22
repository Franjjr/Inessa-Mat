/* Gallery: every predicament at rescue 0 / 0.5 / 1 (1 plays the release, then shows the freed companion), plus a
   stepper to watch the transitions. URL filters: &kind=ice &pet=companion (use CompanionArt from @/art). */
import { useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import type { PredicamentKind } from '@/types'
import { CompanionArt } from '@/art'
import { Predicament } from './Predicament'

const KINDS: PredicamentKind[] = ['bubble', 'net', 'ice', 'fog', 'vines', 'cage', 'ink', 'stuck', 'none']
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const onlyKind = params.get('kind')
const realPet = params.get('pet') === 'companion'

/** Simple chibi placeholder pet (200×200 box like every character). */
export function PlaceholderPet({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-label="mascota">
      <ellipse cx={100} cy={192} rx={56} ry={8} fill="#2e1a47" opacity={0.12} />
      <path d="M 52 70 L 46 24 L 86 50 Z M 148 70 L 154 24 L 114 50 Z" fill="#fdba74" stroke="#9a3412" strokeWidth={5} strokeLinejoin="round" />
      <path d="M 56 60 L 54 36 L 76 52 Z M 144 60 L 146 36 L 124 52 Z" fill="#fbcfe8" />
      <ellipse cx={100} cy={150} rx={50} ry={42} fill="#fdba74" stroke="#9a3412" strokeWidth={5} />
      <circle cx={100} cy={92} r={58} fill="#fdba74" stroke="#9a3412" strokeWidth={5} />
      <ellipse cx={100} cy={160} rx={26} ry={22} fill="#fff7ed" />
      <ellipse cx={78} cy={92} rx={9} ry={12} fill="#2e1a47" />
      <ellipse cx={122} cy={92} rx={9} ry={12} fill="#2e1a47" />
      <circle cx={81} cy={87} r={3.5} fill="#fff" />
      <circle cx={125} cy={87} r={3.5} fill="#fff" />
      <ellipse cx={64} cy={112} rx={9} ry={5} fill="#f9a8d4" />
      <ellipse cx={136} cy={112} rx={9} ry={5} fill="#f9a8d4" />
      <path d="M 92 112 Q 100 120 108 112" fill="none" stroke="#2e1a47" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={74} cy={186} rx={16} ry={9} fill="#fdba74" stroke="#9a3412" strokeWidth={4} />
      <ellipse cx={126} cy={186} rx={16} ry={9} fill="#fdba74" stroke="#9a3412" strokeWidth={4} />
    </svg>
  )
}

function Pet() {
  return realPet ? <CompanionArt species="fox" size={150} pose="worried" /> : <PlaceholderPet />
}

function Cell({ kind, rescue }: { kind: PredicamentKind; rescue: number }) {
  return (
    <div style={{ width: 230, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(#ede9fe, #fdf4ff)', borderRadius: 12 }}>
      <Predicament kind={kind} rescue={rescue}>
        <Pet />
      </Predicament>
    </div>
  )
}

function Stepper({ kind }: { kind: PredicamentKind }) {
  const [r, setR] = useState(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <Cell kind={kind} rescue={r} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={{ minHeight: 56, minWidth: 56, borderRadius: 16 }} onClick={() => setR(0)}>↺</button>
        <button type="button" style={{ minHeight: 56, minWidth: 120, borderRadius: 16 }} onClick={() => setR((x) => Math.min(1, x + 0.25))}>
          rescate {Math.round(r * 100)}%
        </button>
      </div>
    </div>
  )
}

const entries: GalleryEntry[] = []
for (const kind of KINDS) {
  if (onlyKind && onlyKind !== kind) continue
  for (const rescue of [0, 0.5, 1]) {
    entries.push({ title: `${kind} · rescue ${rescue}`, render: () => <Cell kind={kind} rescue={rescue} /> })
  }
}
for (const kind of KINDS) {
  if (onlyKind && onlyKind !== kind) continue
  if (kind === 'none') continue
  entries.push({ title: `${kind} · paso a paso`, render: () => <Stepper kind={kind} /> })
}

export default entries
