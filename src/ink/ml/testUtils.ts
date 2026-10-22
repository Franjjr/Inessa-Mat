/* Test helpers (vitest / node only): load the exported model and fixtures from disk.
   Node modules are imported dynamically so the app tsconfig (no @types/node) still type-checks. */
import type { InkStroke } from '@/types'
import { Cnn, type ModelSpec } from './cnn'

interface NodeFs { readFileSync(path: string): Uint8Array }
const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as NodeFs
// vitest runs from the project root
const ROOT = (globalThis as unknown as { process: { cwd(): string } }).process.cwd()

export const MODEL_DIR = `${ROOT}/public/models/digits/`
const FIXTURES = `${ROOT}/src/ink/ml/__fixtures__/`

export function readBytes(path: string): ArrayBuffer {
  const b = fs.readFileSync(path)
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}

export function readText(path: string): string {
  return new TextDecoder().decode(fs.readFileSync(path))
}

export function loadModelFromDisk(): Cnn {
  const spec = JSON.parse(readText(MODEL_DIR + 'model.json')) as ModelSpec
  return new Cnn(spec, readBytes(MODEL_DIR + spec.weights.file))
}

export function readFixture<T>(name: string): T {
  return JSON.parse(readText(FIXTURES + name)) as T
}

function b64bytes(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

export function decodeF32(b64: string): Float32Array {
  return new Float32Array(b64bytes(b64))
}

export interface FixtureCase {
  name: string
  expected: number | null
  zone: { width: number; height: number }
  strokes: InkStroke[]
  reference: { image: { idx: string; val: string } | null; output?: number[]; embedding?: number[] }
}

export function decodeSparseImage(img: { idx: string; val: string }): Float32Array {
  const idx = new Uint16Array(b64bytes(img.idx))
  const val = decodeF32(img.val)
  const out = new Float32Array(784)
  idx.forEach((i, k) => (out[i] = val[k]))
  return out
}

export function maxAbsDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]))
  return a.length === b.length ? m : Infinity
}

/** Robust timing under machine load: best (minimum) average over several batches, in ms per call. */
export function benchMs(fn: () => void, batches = 8, perBatch = 40): number {
  for (let i = 0; i < 30; i++) fn() // warm-up (JIT)
  let best = Infinity
  for (let b = 0; b < batches; b++) {
    const t0 = performance.now()
    for (let i = 0; i < perBatch; i++) fn()
    best = Math.min(best, (performance.now() - t0) / perBatch)
  }
  return best
}
