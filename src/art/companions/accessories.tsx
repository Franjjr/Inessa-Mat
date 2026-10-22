/* Companion accessories, drawn as separate layers in canonical coordinates and placed on each species
   through its anchor points (head-top, eyes, neck, back, hand).
   Canonical spaces (before scaling):
     head : origin = hat base centre, base width ~100, up is -y
     face : origin = midpoint between the eyes, eye centres at x = -50 / +50
     neck : origin = neck centre, width ~100
     back : origin = shoulder-line centre behind the body, width ~100
     held : origin = the grip in the paw, item extends upward (-y), real size (scale ~1) */
import type { ReactNode } from 'react'
import { anim } from '../characters/shared/frame'

export type AccessorySlot = 'head' | 'face' | 'neck' | 'back' | 'held'

export const ACCESSORY_IDS = [
  'crown', 'wizard-hat', 'flower-crown', 'cap', 'bow', 'beanie',
  'star-glasses', 'sunglasses',
  'scarf', 'bowtie', 'medal',
  'cape', 'fairy-wings', 'backpack',
  'wand', 'balloon', 'lollipop', 'paintbrush',
] as const
export type AccessoryId = (typeof ACCESSORY_IDS)[number]

export interface AccCtx {
  /** Scale applied to the canonical drawing (divide stroke widths by it). */
  k: number
  animated: boolean
}

export interface AccessoryArt {
  slot: AccessorySlot
  /** Main layer (head/face/neck/held: in front; back: behind the body). */
  draw: (c: AccCtx) => ReactNode
  /** Optional front part for back items (straps, clasp), drawn in the neck layer. */
  front?: (c: AccCtx) => ReactNode
}

const lj = { strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

function star(cx: number, cy: number, ro: number, ri: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? ro : ri
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join(' L')} Z`
}

function Flower({ x, y, r, petal, ink, center = '#fde047' }: { x: number; y: number; r: number; petal: string; ink: string; center?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.62} rx={r * 0.5} ry={r * 0.62} fill={petal} stroke={ink} strokeWidth={r * 0.18} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={r * 0.4} fill={center} />
    </g>
  )
}

const ART: Record<AccessoryId, AccessoryArt> = {
  /* ---------------- head ---------------- */
  crown: {
    slot: 'head',
    draw: ({ k }) => (
      <g transform="scale(1.12)" {...lj}>
        <path d="M-38 6 L-46 -34 L-22 -14 L0 -44 L22 -14 L46 -34 L38 6 Q0 14 -38 6 Z" fill="#fcd34d" stroke="#a16207" strokeWidth={4.4 / k} />
        <path d="M-34 -2 Q0 6 34 -2" fill="none" stroke="#fef3c7" strokeWidth={4 / k} />
        <circle cx={-46} cy={-36} r={5.5} fill="#fef3c7" stroke="#a16207" strokeWidth={2.6 / k} />
        <circle cx={0} cy={-46} r={6} fill="#fef3c7" stroke="#a16207" strokeWidth={2.6 / k} />
        <circle cx={46} cy={-36} r={5.5} fill="#fef3c7" stroke="#a16207" strokeWidth={2.6 / k} />
        <path d="M0 -24 L7 -14 L0 -4 L-7 -14 Z" fill="#f43f5e" stroke="#9f1239" strokeWidth={2.4 / k} />
        <circle cx={-22} cy={-4} r={4.5} fill="#3b82f6" />
        <circle cx={22} cy={-4} r={4.5} fill="#22c55e" />
      </g>
    ),
  },
  'wizard-hat': {
    slot: 'head',
    draw: ({ k }) => (
      <g transform="translate(0 4) scale(1.25)" {...lj}>
        <path d="M-34 -4 Q-22 -46 4 -84 Q12 -94 22 -90 Q14 -84 14 -76 Q24 -40 34 -4 Z" fill="#8b5cf6" stroke="#5b21b6" strokeWidth={4.4 / k} />
        <path d="M-30 -16 Q0 -8 30 -16" fill="none" stroke="#fbbf24" strokeWidth={8 / k} />
        <ellipse cx={0} cy={-2} rx={58} ry={12} fill="#7c3aed" stroke="#5b21b6" strokeWidth={4.4 / k} />
        <path d={star(-8, -44, 9, 4)} fill="#fde047" />
        <path d={star(14, -62, 6, 2.6)} fill="#fde047" />
        <path d="M6 -30 a7 7 0 1 0 6 -11 a5.5 5.5 0 1 1 -6 11 Z" fill="#fef3c7" />
        <circle cx={22} cy={-90} r={5} fill="#fde047" stroke="#a16207" strokeWidth={2.4 / k} />
      </g>
    ),
  },
  'flower-crown': {
    slot: 'head',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-52 6 Q0 -20 52 6" fill="none" stroke="#16a34a" strokeWidth={5 / k} />
        <g fill="#86efac" stroke="#15803d" strokeWidth={2.2 / k}>
          <path d="M-34 -4 q-6 -12 6 -14 q2 10 -6 14 Z" />
          <path d="M12 -12 q4 -12 14 -6 q-6 8 -14 6 Z" />
          <path d="M34 -2 q8 -10 16 -2 q-8 6 -16 2 Z" />
        </g>
        <Flower x={-44} y={2} r={11} petal="#f9a8d4" ink="#db2777" />
        <Flower x={-20} y={-8} r={12} petal="#fde68a" ink="#d97706" center="#fb923c" />
        <Flower x={4} y={-12} r={13} petal="#c4b5fd" ink="#7c3aed" />
        <Flower x={28} y={-8} r={11} petal="#ffffff" ink="#db2777" center="#f472b6" />
        <Flower x={48} y={2} r={10} petal="#fdba74" ink="#ea580c" />
      </g>
    ),
  },
  cap: {
    slot: 'head',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-6 -2 Q36 -12 70 2 Q60 14 -6 8 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth={4.4 / k} />
        <path d="M-46 4 C-46 -30 -26 -46 0 -46 C26 -46 46 -30 46 4 Q0 12 -46 4 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth={4.4 / k} />
        <path d="M0 -46 L0 6 M-26 -38 Q-22 -16 -24 6 M26 -38 Q22 -16 24 6" fill="none" stroke="#1d4ed8" strokeWidth={2.4 / k} />
        <circle cx={0} cy={-46} r={5} fill="#fde047" stroke="#1e3a8a" strokeWidth={2.4 / k} />
        <path d={star(-13, -18, 11, 5)} fill="#fde047" stroke="#ca8a04" strokeWidth={1.6 / k} />
      </g>
    ),
  },
  bow: {
    slot: 'head',
    draw: ({ k }) => (
      <g transform="translate(34 -4) rotate(18)" {...lj}>
        <path d="M-2 4 L-12 24 L-4 22 L0 28 L4 10 Z" fill="#ec4899" stroke="#9d174d" strokeWidth={3 / k} />
        <path d="M2 4 L14 22 L6 22 L4 28 L-2 10 Z" fill="#ec4899" stroke="#9d174d" strokeWidth={3 / k} />
        <path d="M0 0 C-14 -18 -34 -12 -30 4 C-26 18 -10 12 0 0 Z" fill="#f472b6" stroke="#9d174d" strokeWidth={3.6 / k} />
        <path d="M0 0 C14 -18 34 -12 30 4 C26 18 10 12 0 0 Z" fill="#f472b6" stroke="#9d174d" strokeWidth={3.6 / k} />
        <path d="M-22 -4 Q-14 -4 -8 0 M22 -4 Q14 -4 8 0" fill="none" stroke="#fbcfe8" strokeWidth={3 / k} />
        <ellipse cx={0} cy={1} rx={7} ry={8} fill="#ec4899" stroke="#9d174d" strokeWidth={3.2 / k} />
      </g>
    ),
  },
  beanie: {
    slot: 'head',
    draw: ({ k }) => (
      <g transform="translate(0 10) scale(1.2)" {...lj}>
        <path d="M-48 2 C-48 -34 -28 -50 0 -50 C28 -50 48 -34 48 2 Z" fill="#2dd4bf" stroke="#0f766e" strokeWidth={4.4 / k} />
        <path d="M-24 -44 Q-28 -20 -26 0 M0 -50 L0 0 M24 -44 Q28 -20 26 0" fill="none" stroke="#14b8a6" strokeWidth={3 / k} />
        <rect x={-54} y={-8} width={108} height={20} rx={10} fill="#0d9488" stroke="#0f766e" strokeWidth={4.4 / k} />
        <path d="M-42 -4 L-42 8 M-28 -4 L-28 8 M-14 -4 L-14 8 M0 -4 L0 8 M14 -4 L14 8 M28 -4 L28 8 M42 -4 L42 8" stroke="#5eead4" strokeWidth={2.6 / k} />
        <circle cx={0} cy={-54} r={13} fill="#ffffff" stroke="#0f766e" strokeWidth={4 / k} />
        <path d="M-6 -58 q3 -3 6 0" fill="none" stroke="#ccfbf1" strokeWidth={3 / k} />
      </g>
    ),
  },

  /* ---------------- face ---------------- */
  'star-glasses': {
    slot: 'face',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-18 -6 Q0 -16 18 -6" fill="none" stroke="#be185d" strokeWidth={4 / k} />
        <path d={star(-50, 2, 40, 20)} fill="#fde68a" fillOpacity={0.45} stroke="#ec4899" strokeWidth={4.6 / k} />
        <path d={star(50, 2, 40, 20)} fill="#fde68a" fillOpacity={0.45} stroke="#ec4899" strokeWidth={4.6 / k} />
        <path d="M-90 -6 L-84 -4 M90 -6 L84 -4" stroke="#ec4899" strokeWidth={4 / k} />
      </g>
    ),
  },
  sunglasses: {
    slot: 'face',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-16 -8 Q0 -16 16 -8" fill="none" stroke="#0f172a" strokeWidth={5 / k} />
        <rect x={-84} y={-26} width={68} height={54} rx={22} fill="#1e293b" stroke="#0f172a" strokeWidth={4.6 / k} />
        <rect x={16} y={-26} width={68} height={54} rx={22} fill="#1e293b" stroke="#0f172a" strokeWidth={4.6 / k} />
        <path d="M-70 -10 Q-62 -18 -52 -18 M30 -10 Q38 -18 48 -18" fill="none" stroke="#ffffff" strokeWidth={5 / k} opacity={0.85} />
        <path d="M-84 -14 L-96 -18 M84 -14 L96 -18" stroke="#0f172a" strokeWidth={4.6 / k} />
      </g>
    ),
  },

  /* ---------------- neck ---------------- */
  scarf: {
    slot: 'neck',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-36 6 L-16 10 L-22 54 L-42 50 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth={4 / k} />
        <path d="M-38 26 L-19 29 M-40 38 L-21 41" stroke="#fecaca" strokeWidth={5 / k} />
        <path d="M-41 50 l-2 8 M-35 51 l-2 8 M-29 52 l-2 8 M-23 53 l-2 8" stroke="#b91c1c" strokeWidth={3 / k} />
        <path d="M-54 -8 Q0 10 54 -8 L56 8 Q0 30 -56 8 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth={4.4 / k} />
        <path d="M-30 -1 L-31 16 M0 4 L0 20 M30 -1 L31 16" stroke="#fecaca" strokeWidth={6 / k} />
      </g>
    ),
  },
  bowtie: {
    slot: 'neck',
    draw: ({ k }) => (
      <g transform="translate(0 6)" {...lj}>
        <path d="M0 0 L-28 -15 Q-35 0 -28 15 Z" fill="#8b5cf6" stroke="#5b21b6" strokeWidth={4 / k} />
        <path d="M0 0 L28 -15 Q35 0 28 15 Z" fill="#8b5cf6" stroke="#5b21b6" strokeWidth={4 / k} />
        <g fill="#ede9fe">
          <circle cx={-20} cy={-4} r={3} />
          <circle cx={-18} cy={7} r={2.4} />
          <circle cx={20} cy={-4} r={3} />
          <circle cx={18} cy={7} r={2.4} />
        </g>
        <rect x={-8} y={-9} width={16} height={18} rx={5} fill="#a78bfa" stroke="#5b21b6" strokeWidth={4 / k} />
      </g>
    ),
  },
  medal: {
    slot: 'neck',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-24 -6 L-6 34 L6 34 L24 -6 L11 -6 L0 22 L-11 -6 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth={3.6 / k} />
        <path d="M-6 34 L-11 -6 M6 34 L11 -6" stroke="#ef4444" strokeWidth={5 / k} />
        <circle cx={0} cy={46} r={17} fill="#fcd34d" stroke="#a16207" strokeWidth={4.4 / k} />
        <circle cx={0} cy={46} r={11} fill="none" stroke="#fef3c7" strokeWidth={2.6 / k} />
        <path d={star(0, 47, 8, 3.6)} fill="#f59e0b" />
      </g>
    ),
  },

  /* ---------------- back ---------------- */
  cape: {
    slot: 'back',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-46 -4 Q-74 40 -84 90 Q-42 100 0 96 Q42 100 84 90 Q74 40 46 -4 Z" fill="#e11d48" stroke="#9f1239" strokeWidth={4.6 / k} />
        <path d="M-66 80 Q-62 50 -46 22 M66 80 Q62 50 46 22" fill="none" stroke="#fb7185" strokeWidth={4 / k} />
      </g>
    ),
    front: ({ k }) => (
      <g {...lj}>
        <path d="M-50 -6 Q0 14 50 -6 L46 8 Q0 26 -46 8 Z" fill="#e11d48" stroke="#9f1239" strokeWidth={4 / k} />
        <circle cx={0} cy={12} r={8} fill="#fcd34d" stroke="#a16207" strokeWidth={3.2 / k} />
        <circle cx={-2.5} cy={9.5} r={2.4} fill="#fef3c7" />
      </g>
    ),
  },
  'fairy-wings': {
    slot: 'back',
    draw: ({ k, animated }) => {
      const wing = (
        <g {...lj}>
          <path d="M-8 0 C-34 -60 -104 -76 -106 -24 C-108 8 -60 18 -8 6 Z" fill="#fbcfe8" stroke="#ec4899" strokeWidth={4 / k} />
          <path d="M-8 8 C-36 20 -80 44 -70 70 C-58 88 -20 52 -8 14 Z" fill="#bae6fd" stroke="#0ea5e9" strokeWidth={4 / k} />
          <path d="M-22 -8 C-44 -36 -76 -48 -84 -26" fill="none" stroke="#ffffff" strokeWidth={4.5 / k} />
          <circle cx={-80} cy={-8} r={5} fill="#ffffff" />
          <circle cx={-50} cy={50} r={4} fill="#ffffff" />
        </g>
      )
      return (
        <g>
          <g className={animated ? anim.flapSlow : undefined} style={{ transformOrigin: '0px 4px' }}>{wing}</g>
          <g transform="scale(-1 1)">
            <g className={animated ? anim.flapSlow : undefined} style={{ transformOrigin: '0px 4px' }}>{wing}</g>
          </g>
        </g>
      )
    },
  },
  backpack: {
    slot: 'back',
    draw: ({ k }) => (
      <g {...lj}>
        <path d="M-16 -12 Q0 -30 16 -12" fill="none" stroke="#b45309" strokeWidth={7 / k} />
        <rect x={-68} y={-12} width={136} height={84} rx={26} fill="#f59e0b" stroke="#b45309" strokeWidth={4.6 / k} />
        <rect x={-68} y={26} width={22} height={34} rx={9} fill="#fbbf24" stroke="#b45309" strokeWidth={3.4 / k} />
        <rect x={46} y={26} width={22} height={34} rx={9} fill="#fbbf24" stroke="#b45309" strokeWidth={3.4 / k} />
      </g>
    ),
    front: ({ k }) => (
      <g {...lj}>
        <path d="M-30 2 Q-34 26 -28 48 M30 2 Q34 26 28 48" fill="none" stroke="#b45309" strokeWidth={13 / k} />
        <path d="M-30 2 Q-34 26 -28 48 M30 2 Q34 26 28 48" fill="none" stroke="#fbbf24" strokeWidth={6.5 / k} />
        <rect x={-38} y={24} width={14} height={10} rx={2} fill="#fef3c7" stroke="#b45309" strokeWidth={2.4 / k} />
        <rect x={24} y={24} width={14} height={10} rx={2} fill="#fef3c7" stroke="#b45309" strokeWidth={2.4 / k} />
      </g>
    ),
  },

  /* ---------------- held ---------------- */
  wand: {
    slot: 'held',
    draw: ({ k, animated }) => (
      <g transform="scale(1.3)" {...lj}>
        <path d="M0 8 L0 -32" stroke="#9d174d" strokeWidth={7 / k} />
        <path d="M0 8 L0 -32" stroke="#f9a8d4" strokeWidth={3.2 / k} />
        <g className={animated ? `${anim.self} ${anim.wiggle}` : undefined}>
          <path d={star(0, -42, 14, 6.4)} fill="#fde047" stroke="#ca8a04" strokeWidth={3.2 / k} />
          <circle cx={-4} cy={-45} r={2.4} fill="#ffffff" />
        </g>
        <path d="M14 -56 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z" fill="#f472b6" className={animated ? `${anim.self} ${anim.twinkle}` : undefined} />
      </g>
    ),
  },
  balloon: {
    slot: 'held',
    draw: ({ k, animated }) => (
      <g {...lj}>
        <path d="M0 2 C10 -14 -4 -30 10 -46 C18 -54 18 -60 20 -64" fill="none" stroke="#64748b" strokeWidth={2.2 / k} />
        <g className={animated ? anim.bob : undefined} style={{ transformOrigin: '20px -64px' }}>
          <path d="M16 -62 L24 -62 L20 -68 Z" fill="#e11d48" stroke="#9f1239" strokeWidth={2.4 / k} />
          <ellipse cx={20} cy={-88} rx={18} ry={21} fill="#f43f5e" stroke="#9f1239" strokeWidth={4 / k} />
          <path d="M10 -96 Q12 -104 20 -105" fill="none" stroke="#ffe4e6" strokeWidth={4 / k} />
        </g>
      </g>
    ),
  },
  lollipop: {
    slot: 'held',
    draw: ({ k }) => (
      <g transform="scale(1.25)" {...lj}>
        <path d="M0 8 L0 -28" stroke="#94a3b8" strokeWidth={6.5 / k} />
        <path d="M0 8 L0 -28" stroke="#ffffff" strokeWidth={3 / k} />
        <circle cx={0} cy={-42} r={16} fill="#f9a8d4" stroke="#db2777" strokeWidth={3.8 / k} />
        <path d="M0 -42 a3.5 3.5 0 0 1 7 0 a7 7 0 0 1 -14 0 a10.5 10.5 0 0 1 21 0" fill="none" stroke="#ffffff" strokeWidth={3.6 / k} />
        <path d="M-7 -52 q4 -4 9 -4" fill="none" stroke="#ffffff" strokeWidth={2.4 / k} opacity={0.9} />
      </g>
    ),
  },
  paintbrush: {
    slot: 'held',
    draw: ({ k }) => (
      <g transform="scale(1.35)" {...lj}>
        <rect x={-3.6} y={-30} width={7.2} height={40} rx={3.6} fill="#fbbf24" stroke="#b45309" strokeWidth={3 / k} />
        <rect x={-5} y={-40} width={10} height={11} rx={2} fill="#e2e8f0" stroke="#64748b" strokeWidth={2.6 / k} />
        <path d="M-5.6 -40 Q-7 -52 0 -58 Q7 -52 5.6 -40 Z" fill="#a855f7" stroke="#6b21a8" strokeWidth={3 / k} />
        <path d="M-3 -50 Q0 -56 3 -50" fill="none" stroke="#f0abfc" strokeWidth={2.4 / k} />
        <path d="M8 -50 C12 -46 13 -42 10 -40 C7 -42 7 -46 8 -50 Z" fill="#ec4899" />
      </g>
    ),
  },
}

export function isAccessoryId(id: unknown): id is AccessoryId {
  return typeof id === 'string' && (ACCESSORY_IDS as readonly string[]).includes(id)
}

export function accessoryArt(id: AccessoryId): AccessoryArt {
  return ART[id]
}

export function accessorySlot(id: AccessoryId): AccessorySlot {
  return ART[id].slot
}

/** Keeps known ids only and one item per slot (the last one listed wins). */
export function resolveEquipped(equipped: readonly unknown[] | undefined): Partial<Record<AccessorySlot, AccessoryId>> {
  const out: Partial<Record<AccessorySlot, AccessoryId>> = {}
  for (const id of equipped ?? []) {
    if (isAccessoryId(id)) out[ART[id].slot] = id
  }
  return out
}
