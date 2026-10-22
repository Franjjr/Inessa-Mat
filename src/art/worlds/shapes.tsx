/* Reusable storybook primitives (flat fills, thick rounded outlines in a darker shade, tiny highlight shapes).
   Every colour goes through the tint context so Borrón's fog can drain the scene. Coordinates: (x, y) is the
   base/centre-bottom of the shape; `s` scales it; outline widths stay constant in stage units. */
import type { ReactNode } from 'react'
import { light, shade } from './color'
import { useTint } from './kit'

type Circ = [number, number, number] // cx, cy, r

/** Outer-outline blob: stroke pass under a fill pass, so overlapping circles read as one shape. */
export function Blob({ circles, rects, fill, stroke, sw }: { circles: Circ[]; rects?: [number, number, number, number, number][]; fill: string; stroke: string; sw: number }) {
  const t = useTint()
  const shapes = (paint: { fill: string; stroke?: string; strokeWidth?: number }) => (
    <g {...paint} strokeLinejoin="round">
      {circles.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
      {rects?.map(([x, y, w, h, rx], i) => <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={rx} />)}
    </g>
  )
  return (
    <>
      {shapes({ fill: t(stroke), stroke: t(stroke), strokeWidth: sw * 2 })}
      {shapes({ fill: t(fill) })}
    </>
  )
}

export function Cloud({ x, y, s = 1, fill = '#ffffff', stroke = '#c7d2fe', sw = 4, flip }: { x: number; y: number; s?: number; fill?: string; stroke?: string; sw?: number; flip?: boolean }) {
  const t = useTint()
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Blob
        circles={[[-56, -16, 24], [-24, -34, 32], [14, -42, 40], [52, -24, 28], [80, -10, 16]]}
        rects={[[-80, -26, 176, 26, 13]]}
        fill={fill}
        stroke={stroke}
        sw={sw / s}
      />
      <ellipse cx={0} cy={-58} rx={14} ry={7} fill={t('#ffffff')} opacity={0.9} />
      <path d="M -64 -6 L 84 -6" stroke={t(light(stroke, 0.35))} strokeWidth={3 / s} strokeLinecap="round" opacity={0.5} />
    </g>
  )
}

export function RoundTree({ x, y, s = 1, leaf = '#6cc58a', trunk = '#b9875b', fruit, sw = 4 }: { x: number; y: number; s?: number; leaf?: string; trunk?: string; fruit?: string; sw?: number }) {
  const t = useTint()
  const w = sw / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -13 0 C -11 -30 -10 -52 -8 -78 L 8 -78 C 10 -52 11 -30 13 0 Z" fill={t(trunk)} stroke={t(shade(trunk))} strokeWidth={w} strokeLinejoin="round" />
      <path d="M 0 -40 L 16 -60 M 0 -52 L -14 -68" stroke={t(shade(trunk))} strokeWidth={w * 0.9} strokeLinecap="round" />
      <Blob circles={[[0, -112, 50], [-40, -86, 36], [40, -88, 38], [-20, -142, 34], [22, -138, 32]]} fill={leaf} stroke={shade(leaf)} sw={w} />
      <ellipse cx={-22} cy={-142} rx={13} ry={8} fill={t(light(leaf, 0.45))} transform="rotate(-24 -22 -142)" />
      <ellipse cx={-48} cy={-96} rx={8} ry={5} fill={t(light(leaf, 0.45))} transform="rotate(-30 -48 -96)" />
      <path d="M 20 -84 Q 34 -80 42 -92" fill="none" stroke={t(shade(leaf, 0.18))} strokeWidth={w * 0.8} strokeLinecap="round" />
      {fruit && [[-26, -100], [18, -118], [36, -74], [-6, -78], [-30, -128]].map(([fx, fy], i) => (
        <circle key={i} cx={fx} cy={fy} r={6} fill={t(fruit)} stroke={t(shade(fruit))} strokeWidth={w * 0.6} />
      ))}
    </g>
  )
}

/** Conifer with optional snow caps. */
export function Pine({ x, y, s = 1, fill = '#3f9a7a', snow = false, sw = 4 }: { x: number; y: number; s?: number; fill?: string; snow?: boolean; sw?: number }) {
  const t = useTint()
  const w = sw / s
  const tiers: [number, number, number][] = [[-14, -70, 92], [-52, -112, 72], [-88, -150, 52]] // baseY, tipY, width
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={-22} width={16} height={24} rx={4} fill={t('#a47148')} stroke={t(shade('#a47148'))} strokeWidth={w} />
      {tiers.map(([b, tip, wd], i) => (
        <g key={i}>
          <path d={`M ${-wd / 2} ${b} L 0 ${tip} L ${wd / 2} ${b} Q 0 ${b + 12} ${-wd / 2} ${b} Z`} fill={t(fill)} stroke={t(shade(fill))} strokeWidth={w} strokeLinejoin="round" />
          {snow && (
            <path
              d={`M ${-wd * 0.26} ${tip + (b - tip) * 0.42} L 0 ${tip + 2} L ${wd * 0.26} ${tip + (b - tip) * 0.42} Q ${wd * 0.13} ${tip + (b - tip) * 0.52} 0 ${tip + (b - tip) * 0.4} Q ${-wd * 0.13} ${tip + (b - tip) * 0.54} ${-wd * 0.26} ${tip + (b - tip) * 0.42} Z`}
              fill={t('#ffffff')}
              stroke={t('#b9dbe8')}
              strokeWidth={w * 0.6}
              strokeLinejoin="round"
            />
          )}
          {!snow && <path d={`M ${-wd * 0.18} ${b - 8} Q ${-wd * 0.28} ${b - 18} ${-wd * 0.12} ${tip + (b - tip) * 0.55}`} fill="none" stroke={t(light(fill, 0.35))} strokeWidth={w * 0.8} strokeLinecap="round" />}
        </g>
      ))}
      {snow && <path d="M -46 -14 Q -20 -6 0 -9 Q 24 -6 46 -14" fill="none" stroke={t('#ffffff')} strokeWidth={w * 1.4} strokeLinecap="round" />}
    </g>
  )
}

export function Bush({ x, y, s = 1, fill = '#5fb878', sw = 4, berries }: { x: number; y: number; s?: number; fill?: string; sw?: number; berries?: string }) {
  const t = useTint()
  const w = sw / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Blob circles={[[-38, -22, 24], [-10, -38, 32], [26, -32, 28], [50, -16, 18]]} rects={[[-60, -24, 124, 24, 10]]} fill={fill} stroke={shade(fill)} sw={w} />
      <ellipse cx={-14} cy={-52} rx={10} ry={6} fill={t(light(fill, 0.4))} transform="rotate(-20 -14 -52)" />
      {berries && [[-30, -24], [6, -30], [30, -18], [-4, -12]].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r={5} fill={t(berries)} stroke={t(shade(berries))} strokeWidth={w * 0.5} />
      ))}
    </g>
  )
}

export function Flower({ x, y, s = 1, petal = '#f9a8d4', center = '#fde68a', stem = '#4ade80', sw = 3, stemH = 34 }: { x: number; y: number; s?: number; petal?: string; center?: string; stem?: string; sw?: number; stemH?: number }) {
  const t = useTint()
  const w = sw / s
  const petals = [0, 72, 144, 216, 288]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {stemH > 0 && <path d={`M 0 0 Q 3 ${-stemH / 2} 0 ${-stemH}`} fill="none" stroke={t(shade(stem, 0.2))} strokeWidth={w * 1.3} strokeLinecap="round" />}
      {stemH > 0 && <path d={`M 1 ${-stemH * 0.35} Q 12 ${-stemH * 0.55} 16 ${-stemH * 0.45} Q 10 ${-stemH * 0.32} 1 ${-stemH * 0.35} Z`} fill={t(stem)} stroke={t(shade(stem))} strokeWidth={w * 0.7} strokeLinejoin="round" />}
      <g transform={`translate(0 ${-stemH})`}>
        {petals.map((a) => (
          <circle key={a} cx={Math.cos((a - 90) * Math.PI / 180) * 9} cy={Math.sin((a - 90) * Math.PI / 180) * 9} r={8} fill={t(petal)} stroke={t(shade(petal))} strokeWidth={w} />
        ))}
        {petals.map((a) => (
          <circle key={`f${a}`} cx={Math.cos((a - 90) * Math.PI / 180) * 9} cy={Math.sin((a - 90) * Math.PI / 180) * 9} r={8 - w / 2} fill={t(petal)} />
        ))}
        <circle r={6} fill={t(center)} stroke={t(shade(center))} strokeWidth={w * 0.8} />
        <circle cx={-2} cy={-2} r={1.8} fill={t('#ffffff')} opacity={0.8} />
      </g>
    </g>
  )
}

export function Daisy({ x, y, s = 1, petal = '#ffffff', center = '#fbbf24', sw = 3 }: { x: number; y: number; s?: number; petal?: string; center?: string; sw?: number }) {
  const t = useTint()
  const w = sw / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 Q -3 -14 0 -28" fill="none" stroke={t('#3f9a5a')} strokeWidth={w * 1.2} strokeLinecap="round" />
      <g transform="translate(0 -28)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse key={a} cx={0} cy={-9} rx={4.2} ry={8} transform={`rotate(${a})`} fill={t(petal)} stroke={t(shade(petal === '#ffffff' ? '#e9d5ff' : petal, 0.15))} strokeWidth={w * 0.6} />
        ))}
        <circle r={5} fill={t(center)} stroke={t(shade(center))} strokeWidth={w * 0.6} />
      </g>
    </g>
  )
}

export function Tuft({ x, y, s = 1, fill = '#4fb36f', sw = 3 }: { x: number; y: number; s?: number; fill?: string; sw?: number }) {
  const t = useTint()
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M -14 0 Q -16 -14 -24 -22 Q -8 -16 -4 -6 Q -4 -22 2 -32 Q 6 -16 4 -6 Q 10 -18 22 -22 Q 12 -12 12 0 Z"
      fill={t(fill)}
      stroke={t(shade(fill))}
      strokeWidth={sw / s}
      strokeLinejoin="round"
    />
  )
}

export function Rock({ x, y, s = 1, fill = '#c4c9d8', sw = 4, flip }: { x: number; y: number; s?: number; fill?: string; sw?: number; flip?: boolean }) {
  const t = useTint()
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M -44 0 Q -50 -26 -26 -38 Q -6 -50 20 -40 Q 46 -28 44 0 Z" fill={t(fill)} stroke={t(shade(fill))} strokeWidth={sw / s} strokeLinejoin="round" />
      <path d="M -28 -26 Q -18 -36 -4 -36" fill="none" stroke={t(light(fill, 0.55))} strokeWidth={(sw / s) * 1.3} strokeLinecap="round" />
      <path d="M 18 -10 Q 26 -16 32 -10" fill="none" stroke={t(shade(fill, 0.15))} strokeWidth={(sw / s) * 0.8} strokeLinecap="round" />
    </g>
  )
}

export function Mushroom({ x, y, s = 1, cap = '#f87171', dots = '#ffffff', sw = 4 }: { x: number; y: number; s?: number; cap?: string; dots?: string; sw?: number }) {
  const t = useTint()
  const w = sw / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -9 0 Q -11 -16 -7 -28 L 7 -28 Q 11 -16 9 0 Z" fill={t('#fff7ed')} stroke={t(shade('#fde7d3'))} strokeWidth={w} strokeLinejoin="round" />
      <path d="M -30 -24 Q -30 -58 0 -60 Q 30 -58 30 -24 Q 0 -18 -30 -24 Z" fill={t(cap)} stroke={t(shade(cap))} strokeWidth={w} strokeLinejoin="round" />
      <circle cx={-14} cy={-40} r={5} fill={t(dots)} />
      <circle cx={6} cy={-49} r={4} fill={t(dots)} />
      <circle cx={16} cy={-33} r={4.5} fill={t(dots)} />
      <circle cx={-2} cy={-31} r={3} fill={t(dots)} />
    </g>
  )
}

/** Four-point sparkle (same as the printed workbook). */
export function SparklePath({ x, y, r, fill, opacity }: { x: number; y: number; r: number; fill: string; opacity?: number }) {
  const k = r / 50
  return (
    <path
      transform={`translate(${x - r} ${y - r}) scale(${k})`}
      d="M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0 Z"
      fill={fill}
      opacity={opacity}
    />
  )
}

/** Five-point star polygon points around (cx, cy). */
export function starPoints(cx: number, cy: number, R: number, r = R * 0.45): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function LilyPad({ x, y, s = 1, fill = '#6fcf8e', bloom, sw = 3 }: { x: number; y: number; s?: number; fill?: string; bloom?: string; sw?: number }) {
  const t = useTint()
  const w = sw / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * 0.45})`}>
      <path d="M 0 0 L 30 -8 A 32 32 0 1 1 30 8 Z" fill={t(fill)} stroke={t(shade(fill))} strokeWidth={w * 1.4} strokeLinejoin="round" />
      <path d="M -6 -14 Q -18 -2 -8 14" fill="none" stroke={t(light(fill, 0.4))} strokeWidth={w * 1.6} strokeLinecap="round" />
      {bloom && (
        <g transform={`scale(1 ${1 / 0.45}) translate(0 -6)`}>
          <path d="M -12 0 Q -14 -12 -6 -16 Q 0 -6 0 0 Z M 12 0 Q 14 -12 6 -16 Q 0 -6 0 0 Z M -6 0 Q 0 -22 6 0 Z" fill={t(bloom)} stroke={t(shade(bloom))} strokeWidth={w * 0.7} strokeLinejoin="round" />
        </g>
      )}
    </g>
  )
}

export function Reed({ x, y, h = 120, lean = 0, sw = 3, cattail = true }: { x: number; y: number; h?: number; lean?: number; sw?: number; cattail?: boolean }) {
  const t = useTint()
  const tipX = x + lean
  return (
    <g>
      <path d={`M ${x} ${y} Q ${x + lean * 0.2} ${y - h * 0.6} ${tipX} ${y - h}`} fill="none" stroke={t('#3f8f5a')} strokeWidth={sw * 1.4} strokeLinecap="round" />
      <path d={`M ${x - 2} ${y} Q ${x - 18 + lean * 0.1} ${y - h * 0.4} ${x - 26 + lean * 0.3} ${y - h * 0.62} Q ${x - 8} ${y - h * 0.42} ${x + 3} ${y}`} fill={t('#7ccf8c')} stroke={t(shade('#7ccf8c'))} strokeWidth={sw} strokeLinejoin="round" />
      {cattail && <rect x={tipX - 6} y={y - h - 8} width={12} height={34} rx={6} transform={`rotate(${lean * 0.3} ${tipX} ${y - h})`} fill={t('#a0673f')} stroke={t(shade('#a0673f'))} strokeWidth={sw} />}
    </g>
  )
}

/** Simple wavy horizontal highlight line (water). */
export function WaveLine({ x, y, w, color, sw = 4, amp = 4 }: { x: number; y: number; w: number; color: string; sw?: number; amp?: number }) {
  const t = useTint()
  const seg = w / 4
  return (
    <path
      d={`M ${x} ${y} q ${seg / 2} ${-amp} ${seg} 0 t ${seg} 0 t ${seg} 0 t ${seg} 0`}
      fill="none"
      stroke={t(color)}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  )
}

/** Soft round glow made with a radial gradient (no blur filters). Requires a <defs> gradient id. */
export function GlowDisc({ cx, cy, r, id, opacity = 1 }: { cx: number; cy: number; r: number; id: string; opacity?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} opacity={opacity} />
}

export function RadialGlow({ id, color, inner = 0.9 }: { id: string; color: string; inner?: number }) {
  const t = useTint()
  return (
    <radialGradient id={id}>
      <stop offset="0%" stopColor={t(color)} stopOpacity={inner} />
      <stop offset="45%" stopColor={t(color)} stopOpacity={inner * 0.45} />
      <stop offset="100%" stopColor={t(color)} stopOpacity={0} />
    </radialGradient>
  )
}

export function VGradient({ id, stops }: { id: string; stops: [number, string, number?][] }) {
  const t = useTint()
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([o, c, op], i) => <stop key={i} offset={`${o}%`} stopColor={t(c)} stopOpacity={op ?? 1} />)}
    </linearGradient>
  )
}

/* --------------------------------------------------- particles (viewBox -10 -10 20 20) ---- */

export function LeafParticle({ color = '#86d39b' }: { color?: string }) {
  const t = useTint()
  return (
    <g>
      <path d="M -7 6 C -9 -2 -3 -8 7 -8 C 8 2 2 8 -7 6 Z" fill={t(color)} stroke={t(shade(color))} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M -6 5 Q 0 -1 5 -6" fill="none" stroke={t(shade(color, 0.2))} strokeWidth={1} strokeLinecap="round" />
    </g>
  )
}

export function PetalParticle({ color = '#f9a8d4' }: { color?: string }) {
  const t = useTint()
  return <path d="M 0 -8 C 7 -5 7 4 0 8 C -7 4 -7 -5 0 -8 Z" fill={t(color)} stroke={t(shade(color, 0.2))} strokeWidth={1.2} />
}

export function SnowParticle() {
  const t = useTint()
  return (
    <g>
      <circle r={6} fill={t('#ffffff')} stroke={t('#b6d8e6')} strokeWidth={1.6} />
      <circle cx={-2} cy={-2} r={1.6} fill={t('#e0f2fe')} />
    </g>
  )
}

export function BubbleParticle({ color = '#c7d2fe' }: { color?: string }) {
  const t = useTint()
  return (
    <g>
      <circle r={8} fill={t('#ffffff')} fillOpacity={0.28} stroke={t(color)} strokeWidth={1.6} />
      <path d="M -5 -2 A 5 5 0 0 1 -1 -5.5" fill="none" stroke={t('#ffffff')} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  )
}

export function SparkParticle({ color = '#fbbf24', core = '#fff7cc' }: { color?: string; core?: string }) {
  const t = useTint()
  return (
    <g>
      <circle r={7} fill={t(color)} opacity={0.35} />
      <path d="M 0 -6 Q 1 -1 6 0 Q 1 1 0 6 Q -1 1 -6 0 Q -1 -1 0 -6 Z" fill={t(color)} />
      <circle r={1.8} fill={t(core)} />
    </g>
  )
}

export function SmokeParticle({ color = '#efe7f5' }: { color?: string }) {
  const t = useTint()
  return (
    <g>
      <circle cx={-3} cy={1} r={6} fill={t(color)} stroke={t(shade(color, 0.12))} strokeWidth={1} />
      <circle cx={3} cy={-2} r={5.5} fill={t(color)} />
      <circle cx={3} cy={-2} r={5.5} fill="none" stroke={t(shade(color, 0.12))} strokeWidth={1} strokeDasharray="12 40" />
    </g>
  )
}

export function Butterfly({ cx, cy, s = 1, wing = '#f9a8d4', wing2 = '#c4b5fd', flapClass }: { cx: number; cy: number; s?: number; wing?: string; wing2?: string; flapClass?: string }) {
  const t = useTint()
  const w = 2 / s
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <g className={flapClass}>
        <path d="M 0 0 C -6 -18 -26 -20 -24 -6 C -23 2 -10 4 0 0 Z" fill={t(wing)} stroke={t(shade(wing))} strokeWidth={w} strokeLinejoin="round" />
        <path d="M 0 0 C 6 -18 26 -20 24 -6 C 23 2 10 4 0 0 Z" fill={t(wing)} stroke={t(shade(wing))} strokeWidth={w} strokeLinejoin="round" />
        <path d="M 0 1 C -5 12 -18 16 -16 6 C -14 2 -6 1 0 1 Z" fill={t(wing2)} stroke={t(shade(wing2))} strokeWidth={w} strokeLinejoin="round" />
        <path d="M 0 1 C 5 12 18 16 16 6 C 14 2 6 1 0 1 Z" fill={t(wing2)} stroke={t(shade(wing2))} strokeWidth={w} strokeLinejoin="round" />
        <circle cx={-13} cy={-9} r={3} fill={t('#ffffff')} opacity={0.75} />
        <circle cx={13} cy={-9} r={3} fill={t('#ffffff')} opacity={0.75} />
      </g>
      <rect x={-2.2} y={-9} width={4.4} height={20} rx={2.2} fill={t('#5b3a80')} />
      <path d="M -1 -8 Q -5 -15 -8 -16 M 1 -8 Q 5 -15 8 -16" fill="none" stroke={t('#5b3a80')} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  )
}

/** Wrap static art in a translated group (handy for mirrored edge stages). */
export function G({ x = 0, y = 0, s = 1, flip, children }: { x?: number; y?: number; s?: number; flip?: boolean; children: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>{children}</g>
}

/** Cluster of pointed crystal prisms (cave walls, forge). */
export function CrystalCluster({ x, y, s = 1, color = '#f87171', sw = 4, flip }: { x: number; y: number; s?: number; color?: string; sw?: number; flip?: boolean }) {
  const t = useTint()
  const w = sw / s
  const prisms: [number, number, number, number][] = [[-30, -26, 22, 62], [-8, -8, 28, 100], [16, 12, 24, 78], [34, 30, 18, 46]] // dx, angle, width, height
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {prisms.map(([dx, ang, pw, ph], i) => (
        <g key={i} transform={`translate(${dx} 0) rotate(${ang})`}>
          <path d={`M ${-pw / 2} 0 L ${-pw / 2} ${-ph * 0.74} L 0 ${-ph} L ${pw / 2} ${-ph * 0.74} L ${pw / 2} 0 Z`} fill={t(color)} stroke={t(shade(color))} strokeWidth={w} strokeLinejoin="round" />
          <path d={`M ${-pw / 2} 0 L ${-pw / 2} ${-ph * 0.74} L 0 ${-ph} L 0 0 Z`} fill={t(light(color, 0.38))} />
          <path d={`M ${-pw / 2} ${-ph * 0.74} L 0 ${-ph} L ${pw / 2} ${-ph * 0.74} L 0 ${-ph * 0.62} Z`} fill={t(light(color, 0.62))} />
          <path d={`M ${-pw * 0.22} ${-ph * 0.2} L ${-pw * 0.22} ${-ph * 0.58}`} stroke={t('#ffffff')} strokeWidth={w * 1.1} strokeLinecap="round" opacity={0.8} />
          <path d={`M ${-pw / 2} 0 L ${-pw / 2} ${-ph * 0.74} L 0 ${-ph} L ${pw / 2} ${-ph * 0.74} L ${pw / 2} 0 Z`} fill="none" stroke={t(shade(color))} strokeWidth={w} strokeLinejoin="round" />
        </g>
      ))}
      <ellipse cx={2} cy={0} rx={52} ry={9} fill={t(shade(color, 0.1))} opacity={0.35} />
    </g>
  )
}

/** Stalactite / stalagmite (pointed rounded cone). dir 1 = hanging down, -1 = growing up. */
export function Spike({ x, y, w, h, dir = 1, fill = '#d49590', sw = 4 }: { x: number; y: number; w: number; h: number; dir?: 1 | -1; fill?: string; sw?: number }) {
  const t = useTint()
  const tip = y + h * dir
  return (
    <g>
      <path d={`M ${x - w / 2} ${y} Q ${x - w * 0.18} ${y + h * 0.55 * dir} ${x} ${tip} Q ${x + w * 0.18} ${y + h * 0.55 * dir} ${x + w / 2} ${y} Z`} fill={t(fill)} stroke={t(shade(fill))} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M ${x - w * 0.22} ${y + h * 0.12 * dir} Q ${x - w * 0.12} ${y + h * 0.45 * dir} ${x - w * 0.04} ${y + h * 0.7 * dir}`} fill="none" stroke={t(light(fill, 0.4))} strokeWidth={sw} strokeLinecap="round" />
    </g>
  )
}
