/* Test helpers for jsdom: canvas mock (jsdom has no 2D context) and fixed element sizes. */

export interface CanvasCalls { quadraticCurveTo: number; stroke: number; arc: number; lineWidths: number[] }

export function mockCanvas(): CanvasCalls {
  const calls: CanvasCalls = { quadraticCurveTo: 0, stroke: 0, arc: 0, lineWidths: [] }
  const ctx = {
    setTransform() {},
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() { calls.quadraticCurveTo++ },
    arc() { calls.arc++ },
    fill() {},
    stroke() { calls.stroke++; calls.lineWidths.push(ctx.lineWidth) },
    lineWidth: 1,
    globalAlpha: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeStyle: '#000',
    fillStyle: '#000',
  }
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext']
  return calls
}

/** Gives every element a layout size (jsdom reports 0). Returns a restore function. */
export function fixedElementSize(width: number, height: number): () => void {
  const w = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
  const h = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => height })
  return () => {
    if (w) Object.defineProperty(HTMLElement.prototype, 'clientWidth', w)
    if (h) Object.defineProperty(HTMLElement.prototype, 'clientHeight', h)
  }
}

/** Makes the device look like a tablet (coarse main pointer): «auto» input writes by hand. Without it jsdom looks like a
    computer, where «auto» shows the on-screen keypad. Returns a restore function. */
export function asTablet(): () => void {
  const had = Object.prototype.hasOwnProperty.call(window, 'matchMedia')
  const prev = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)', media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return () => { if (had) window.matchMedia = prev; else delete (window as { matchMedia?: unknown }).matchMedia }
}
