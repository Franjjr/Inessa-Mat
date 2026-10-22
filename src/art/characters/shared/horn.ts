/* Geometry for Lumi's golden spiral horn: stacked, slightly twisted rings with 2 crystal sockets
   per ring (4 rings x 2 = 8 sockets). Shared by Lumi (character) and LumiHorn (HUD). */

type P = [number, number]

export interface SpiralHorn {
  /** Ring outlines, drawn in order (tip first, base last). */
  rings: string[]
  /** One highlight stroke per ring (same order as rings). */
  highlights: Array<{ d: string; w: number }>
  /** 8 sockets from base (index 0) to tip (index 7). */
  sockets: Array<{ x: number; y: number; r: number }>
}

const f = (n: number) => n.toFixed(1)
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/**
 * @param base centre of the horn base
 * @param tip  tip point
 * @param width base width
 * @param socketR radius of the base sockets (they shrink toward the tip)
 * @param rings number of stacked rings
 * @param twist how much each ring is slanted (spiral look)
 */
export function spiralHorn(base: P, tip: P, width: number, socketR = 2.7, rings = 4, twist = 0.07): SpiralHorn {
  const ax: P = [tip[0] - base[0], tip[1] - base[1]]
  const len = Math.hypot(ax[0], ax[1])
  const u: P = [ax[0] / len, ax[1] / len]
  // Normal pointing to the viewer-left side of the axis.
  let nx: P = [-u[1], u[0]]
  if (nx[0] > 0 || (nx[0] === 0 && nx[1] > 0)) nx = [-nx[0], -nx[1]]
  const delta = twist
  const bulge = width * 0.1
  const lift = width * 0.16
  // P2(t, -1) is the left edge, P2(t, 1) the right edge.
  const P2 = (t: number, s: number): P => {
    const c = lerp(base, tip, t)
    const w = (width * (1 - t) + 0.8) / 2
    return [c[0] - nx[0] * w * s, c[1] - nx[1] * w * s]
  }
  const ts = Array.from({ length: rings + 1 }, (_, i) => (i / rings) * 0.92)
  const out: SpiralHorn = { rings: [], highlights: [], sockets: [] }
  const mid = (a: P, b: P, s: number, amt: number): P => [(a[0] + b[0]) / 2 - nx[0] * amt * s, (a[1] + b[1]) / 2 - nx[1] * amt * s]
  const sockets: Array<{ x: number; y: number; r: number }> = []
  for (let k = rings - 1; k >= 0; k--) {
    const t0 = ts[k]
    const t1 = k < rings - 1 ? ts[k + 1] : 1
    const last = k === rings - 1
    const bl = P2(t0, -1)
    const br = P2(t0 + delta, 1)
    const tl = last ? tip : P2(t1, -1)
    const tr = last ? tip : P2(Math.min(1, t1 + delta), 1)
    const cl = mid(bl, tl, -1, bulge)
    const cr = mid(br, tr, 1, bulge)
    const cb: P = [(bl[0] + br[0]) / 2 + u[0] * lift, (bl[1] + br[1]) / 2 + u[1] * lift]
    let d = `M${f(bl[0])} ${f(bl[1])} Q${f(cl[0])} ${f(cl[1])} ${f(tl[0])} ${f(tl[1])} `
    if (!last) {
      const ct: P = [(tl[0] + tr[0]) / 2 + u[0] * lift, (tl[1] + tr[1]) / 2 + u[1] * lift]
      d += `Q${f(ct[0])} ${f(ct[1])} ${f(tr[0])} ${f(tr[1])} `
    }
    d += `Q${f(cr[0])} ${f(cr[1])} ${f(br[0])} ${f(br[1])} Q${f(cb[0])} ${f(cb[1])} ${f(bl[0])} ${f(bl[1])} Z`
    out.rings.push(d)
    const h1 = P2(t0 + 0.035, -0.45)
    const h2 = P2(last ? 0.95 : t1 - 0.02, -0.3)
    out.highlights.push({ d: `M${f(h1[0])} ${f(h1[1])} L${f(h2[0])} ${f(h2[1])}`, w: Math.max(0.8, (width / 10) * (1 - k * 0.16)) })
    const ringSockets: Array<{ x: number; y: number; r: number }> = []
    ;[[-0.05, 0.42], [0.5, 0.62]].forEach(([s, frac]) => {
      const tt = t0 + (t1 - t0) * frac + delta * 0.5
      const p = P2(tt, s)
      ringSockets.push({ x: p[0], y: p[1], r: socketR * (1 - k * 0.13) })
    })
    sockets.unshift(...ringSockets)
  }
  out.sockets = sockets
  return out
}
