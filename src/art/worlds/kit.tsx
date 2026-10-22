/* Scene-building kit: tint context (vividness), stages, sprites and particle lanes. Internal to art-worlds. */
import clsx from 'clsx'
import { createContext, useContext, useId, useMemo, type CSSProperties, type ReactNode, type SVGProps } from 'react'
import { makeTint, shade, type Tint } from './color'
import k from './kit.module.css'

/* ---------------------------------------------------------------- tint ---- */

const TintCtx = createContext<Tint>((h) => h)

export function TintProvider({ vividness, children }: { vividness: number; children: ReactNode }) {
  const t = useMemo(() => makeTint(vividness), [vividness])
  return <TintCtx.Provider value={t}>{children}</TintCtx.Provider>
}

/** Returns the tinter for the current vividness: t('#7cc796') → fogged or original colour. */
export const useTint = () => useContext(TintCtx)

type Paint = Pick<SVGProps<SVGElement>, 'fill' | 'stroke' | 'strokeWidth' | 'strokeLinejoin' | 'strokeLinecap'>

/** Fill + darker outline (both tinted). `ol('#a7f3d0', 4)` → spread onto any SVG shape. */
export function useOutline() {
  const t = useTint()
  return (fill: string, width = 4, stroke?: string): Paint => ({
    fill: t(fill),
    stroke: t(stroke ?? shade(fill)),
    strokeWidth: width,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  })
}

/* ------------------------------------------------------------------ ids ---- */

const IdCtx = createContext('nw')

/** Unique prefix for gradient ids, so several scenes on one page never share (differently tinted) defs. */
export function IdScope({ children }: { children: ReactNode }) {
  const raw = useId()
  return <IdCtx.Provider value={'nw' + raw.replace(/[^a-zA-Z0-9]/g, '')}>{children}</IdCtx.Provider>
}

/** ids('sky') → 'nwr3-sky'; url(ids('sky')) → 'url(#nwr3-sky)' */
export function useIds() {
  const p = useContext(IdCtx)
  const ids = (name: string) => `${p}-${name}`
  ids.url = (name: string) => `url(#${p}-${name})`
  return ids
}

/* --------------------------------------------------------------- stages ---- */

export type Anchor = 'cover' | 'coverTop' | 'bl' | 'br' | 'tl' | 'tr' | 'full'

interface StageDims { w: number; h: number }
const StageCtx = createContext<StageDims>({ w: 1600, h: 1000 })

export interface StageProps {
  /** Stage coordinate system (also the aspect ratio). */
  w: number
  h: number
  anchor?: Anchor
  /** Edge anchors: max width as a share of the container (CSS length, default 32%). */
  maxW?: string
  /** Edge anchors: height budget (CSS length, default 100cqh = full height). */
  maxH?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function Stage({ w, h, anchor = 'cover', maxW, maxH, className, style, children }: StageProps) {
  const vars = { '--aw': w, '--ah': h, ...(maxW ? { '--ew': maxW } : null), ...(maxH ? { '--eh': maxH } : null) } as CSSProperties
  return (
    <StageCtx.Provider value={{ w, h }}>
      <div className={clsx(k.stage, k[anchor], className)} style={{ ...vars, ...style }} data-stage={anchor}>
        {children}
      </div>
    </StageCtx.Provider>
  )
}

/** The static SVG of a stage, drawn in stage coordinates. */
export function Art({ children, className }: { children: ReactNode; className?: string }) {
  const { w, h } = useContext(StageCtx)
  return (
    <svg className={clsx(k.svg, className)} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

const pct = (a: number, b: number) => `${(a / b) * 100}%`

export interface SpriteProps {
  /** Box in stage coordinates; the inner SVG uses the same coordinates, so draw with global positions. */
  x: number
  y: number
  w: number
  h: number
  /** Outer animation class (e.g. drift) + timing variables ({ '--d': '6s', '--dl': '-2s' }). */
  className?: string
  vars?: Record<string, string | number>
  /** Optional nested animation (e.g. bob inside drift). */
  inner?: string
  innerVars?: Record<string, string | number>
  style?: CSSProperties
  children: ReactNode
}

interface BoxDims { x: number; y: number; w: number; h: number }
const BoxCtx = createContext<BoxDims>({ x: 0, y: 0, w: 100, h: 100 })

/** Positioned HTML box in stage coordinates (children are HTML). */
export function Box({ x, y, w, h, className, vars, style, children }: Omit<SpriteProps, 'inner' | 'innerVars'>) {
  const st = useContext(StageCtx)
  return (
    <BoxCtx.Provider value={{ x, y, w, h }}>
      <div
        className={clsx(k.sprite, className)}
        style={{ left: pct(x, st.w), top: pct(y, st.h), width: pct(w, st.w), height: pct(h, st.h), ...(vars as CSSProperties), ...style }}
      >
        {children}
      </div>
    </BoxCtx.Provider>
  )
}

/** SVG filling the enclosing Box, drawn in stage coordinates. */
export function BoxSvg({ children }: { children: ReactNode }) {
  const b = useContext(BoxCtx)
  return (
    <svg className={k.boxSvg} viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

/** A small independently animated piece of a stage (composited HTML box + its own little SVG). */
export function Sprite({ inner, innerVars, children, ...box }: SpriteProps) {
  return (
    <Box {...box}>
      {inner ? (
        <Wrap className={inner} vars={innerVars}>
          <BoxSvg>{children}</BoxSvg>
        </Wrap>
      ) : (
        <BoxSvg>{children}</BoxSvg>
      )}
    </Box>
  )
}

/** Nested animation wrapper (fills its parent box). */
export function Wrap({ className, vars, children }: { className?: string; vars?: Record<string, string | number>; children: ReactNode }) {
  return (
    <div className={clsx(k.wrap, className)} style={vars as CSSProperties}>
      {children}
    </div>
  )
}

export interface LaneProps {
  /** Lane box in stage units: particles travel from the top (fall) or bottom (rise) across `h`. */
  x: number
  y: number
  h: number
  /** Particle size in stage units (lane width). */
  size: number
  dir?: 'fall' | 'rise'
  /** Animation class for the lane (fall / rise) and particle (sway / wobble / puff …). */
  laneClass: string
  particleClass?: string
  vars?: Record<string, string | number>
  /** Particle drawing in a viewBox of -10 -10 20 20. */
  children: ReactNode
}

export function Lane({ x, y, h, size, dir = 'fall', laneClass, particleClass, vars, children }: LaneProps) {
  const st = useContext(StageCtx)
  return (
    <div
      className={clsx(k.lane, laneClass)}
      style={{ left: pct(x - size / 2, st.w), top: pct(y, st.h), width: pct(size, st.w), height: pct(h, st.h), ...(vars as CSSProperties) }}
    >
      <div className={clsx(k.particle, dir === 'fall' ? k.fromTop : k.fromBottom, particleClass)}>
        <svg viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
          {children}
        </svg>
      </div>
    </div>
  )
}

export const tintedClass = k.tinted

/** Deterministic pseudo-random sequence (so scenes look identical on every render and in tests). */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
