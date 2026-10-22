/* Pure-TS inference for the generic sequential CNN exported by ml/export.py
   (public/models/digits/model.json + model.bin). No dependencies, Float32Array maths, preallocated buffers:
   ~4 M multiply-adds per digit.

   Format "numeria-seq-cnn" v1:
     { format, version, modelId, input: { shape: [C,H,W] }, labels, rejectIndex?, embeddingSize?,
       weights: { file, byteLength, dtype, endianness }, layers: LayerSpec[] }
   Tensors: { offset (bytes into model.bin), shape, dtype: 'float32' | 'int8', scale?, scales? (per output
   channel) }. int8 tensors are dequantised at load time. Layer types: conv2d (stride 1, zero padding),
   maxpool2d (floor), flatten, dense, relu, softmax, dropout (no-op). conv2d/dense may carry
   activation: 'relu' | 'none'. The dense layer with `embedding: true` exposes its (post-activation) output. */

export const MODEL_FORMAT = 'numeria-seq-cnn'
export const MAX_FORMAT_VERSION = 1

export interface TensorSpec {
  offset: number
  shape: number[]
  dtype?: 'float32' | 'int8'
  scale?: number
  scales?: number[]
}

export interface LayerSpec {
  type: 'conv2d' | 'maxpool2d' | 'flatten' | 'dense' | 'relu' | 'softmax' | 'dropout'
  name?: string
  inShape?: number[]
  outShape?: number[]
  kernel?: [number, number] | number
  stride?: number
  padding?: number
  size?: number
  activation?: 'relu' | 'none'
  embedding?: boolean
  weight?: TensorSpec
  bias?: TensorSpec
}

export interface ModelSpec {
  format: string
  version: number
  modelId: string
  createdAt?: string
  input: { shape: number[]; layout?: string; range?: [number, number] }
  labels: string[]
  rejectIndex?: number | null
  embeddingSize?: number
  preprocess?: Record<string, number>
  weights: { file: string; byteLength?: number; dtype?: string; endianness?: string }
  layers: LayerSpec[]
  metrics?: unknown
}

export interface CnnOutput {
  /** Final layer output (probabilities when the model ends with softmax). Reused buffer — copy to keep. */
  output: Float32Array
  /** Output of the layer marked `embedding` (null if none). Reused buffer — copy to keep. */
  embedding: Float32Array | null
}

type Op = (input: Float32Array) => Float32Array

const prod = (s: number[]) => s.reduce((a, b) => a * b, 1)

function readTensor(spec: TensorSpec, buf: ArrayBuffer, name: string): Float32Array {
  const count = prod(spec.shape)
  const dtype = spec.dtype ?? 'float32'
  if (dtype === 'float32') {
    if (spec.offset < 0 || spec.offset + count * 4 > buf.byteLength) throw new Error(`model: tensor ${name} out of range`)
    // DataView: explicit little endian, no alignment requirement
    const dv = new DataView(buf, spec.offset, count * 4)
    const out = new Float32Array(count)
    for (let i = 0; i < count; i++) out[i] = dv.getFloat32(i * 4, true)
    return out
  }
  if (dtype === 'int8') {
    if (spec.offset + count > buf.byteLength) throw new Error(`model: tensor ${name} out of range`)
    const q = new Int8Array(buf, spec.offset, count)
    const out = new Float32Array(count)
    const per = count / spec.shape[0]
    for (let i = 0; i < count; i++) {
      const s = spec.scales ? spec.scales[Math.floor(i / per)] : (spec.scale ?? 1)
      out[i] = q[i] * s
    }
    return out
  }
  throw new Error(`model: unsupported dtype ${String(dtype)} in ${name}`)
}

function relu(a: Float32Array): void {
  for (let i = 0; i < a.length; i++) if (a[i] < 0) a[i] = 0
}

function conv2dOp(inShape: number[], l: LayerSpec, W: Float32Array, B: Float32Array | null): { op: Op; out: number[] } {
  const [IC, IH, IW] = inShape
  const k = l.kernel ?? 3
  const [KH, KW] = Array.isArray(k) ? k : [k, k]
  const OC = l.weight!.shape[0]
  if (l.weight!.shape[1] !== IC) throw new Error(`model: ${l.name} expects ${l.weight!.shape[1]} input channels, got ${IC}`)
  if ((l.stride ?? 1) !== 1) throw new Error(`model: ${l.name} stride != 1 is not supported`)
  const P = l.padding ?? 0
  const OH = IH + 2 * P - KH + 1
  const OW = IW + 2 * P - KW + 1
  const out = new Float32Array(OC * OH * OW)
  const doRelu = l.activation === 'relu'
  const plane = OH * OW
  const K = IC * KH * KW
  // im2col (patch-major: every output pixel's receptive field is contiguous) + dot products with the
  // accumulators in registers, 4 output channels at a time. Weight layout [OC][IC][KH][KW] == [OC][K].
  const cols = new Float32Array(plane * K)
  // precomputed gather map: for patch element k of pixel p, the input index (or -1 for zero padding)
  const gather = new Int32Array(plane * K)
  for (let y = 0; y < OH; y++) {
    for (let x = 0; x < OW; x++) {
      const pb = (y * OW + x) * K
      let k = 0
      for (let ic = 0; ic < IC; ic++) {
        for (let ky = 0; ky < KH; ky++) {
          const iy = y + ky - P
          for (let kx = 0; kx < KW; kx++) {
            const ix = x + kx - P
            gather[pb + k++] = iy >= 0 && iy < IH && ix >= 0 && ix < IW ? (ic * IH + iy) * IW + ix : -1
          }
        }
      }
    }
  }
  const op: Op = (inp) => {
    for (let i = 0; i < gather.length; i++) {
      const g = gather[i]
      cols[i] = g >= 0 ? inp[g] : 0
    }
    let oc = 0
    for (; oc + 7 < OC; oc += 8) {
      const w0 = oc * K, w1 = w0 + K, w2 = w1 + K, w3 = w2 + K, w4 = w3 + K, w5 = w4 + K, w6 = w5 + K, w7 = w6 + K
      for (let p = 0; p < plane; p++) {
        const cb = p * K
        let a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0, a6 = 0, a7 = 0
        for (let k = 0; k < K; k++) {
          const c = cols[cb + k]
          a0 += W[w0 + k] * c
          a1 += W[w1 + k] * c
          a2 += W[w2 + k] * c
          a3 += W[w3 + k] * c
          a4 += W[w4 + k] * c
          a5 += W[w5 + k] * c
          a6 += W[w6 + k] * c
          a7 += W[w7 + k] * c
        }
        const o = oc * plane + p
        out[o] = a0 + (B ? B[oc] : 0)
        out[o + plane] = a1 + (B ? B[oc + 1] : 0)
        out[o + 2 * plane] = a2 + (B ? B[oc + 2] : 0)
        out[o + 3 * plane] = a3 + (B ? B[oc + 3] : 0)
        out[o + 4 * plane] = a4 + (B ? B[oc + 4] : 0)
        out[o + 5 * plane] = a5 + (B ? B[oc + 5] : 0)
        out[o + 6 * plane] = a6 + (B ? B[oc + 6] : 0)
        out[o + 7 * plane] = a7 + (B ? B[oc + 7] : 0)
      }
    }
    for (; oc + 3 < OC; oc += 4) {
      const w0 = oc * K, w1 = w0 + K, w2 = w1 + K, w3 = w2 + K
      const b0 = B ? B[oc] : 0, b1 = B ? B[oc + 1] : 0, b2 = B ? B[oc + 2] : 0, b3 = B ? B[oc + 3] : 0
      for (let p = 0; p < plane; p++) {
        const cb = p * K
        let a0 = b0, a1 = b1, a2 = b2, a3 = b3
        for (let k = 0; k < K; k++) {
          const c = cols[cb + k]
          a0 += W[w0 + k] * c
          a1 += W[w1 + k] * c
          a2 += W[w2 + k] * c
          a3 += W[w3 + k] * c
        }
        out[oc * plane + p] = a0
        out[(oc + 1) * plane + p] = a1
        out[(oc + 2) * plane + p] = a2
        out[(oc + 3) * plane + p] = a3
      }
    }
    for (; oc < OC; oc++) {
      const w0 = oc * K
      for (let p = 0; p < plane; p++) {
        const cb = p * K
        let a0 = B ? B[oc] : 0
        for (let k = 0; k < K; k++) a0 += W[w0 + k] * cols[cb + k]
        out[oc * plane + p] = a0
      }
    }
    if (doRelu) relu(out)
    return out
  }
  return { op, out: [OC, OH, OW] }
}

function maxpoolOp(inShape: number[], l: LayerSpec): { op: Op; out: number[] } {
  const [C, H, Wd] = inShape
  const s = l.size ?? 2
  const st = l.stride ?? s
  const OH = Math.floor((H - s) / st) + 1
  const OW = Math.floor((Wd - s) / st) + 1
  const out = new Float32Array(C * OH * OW)
  const op: Op = (inp) => {
    let o = 0
    for (let c = 0; c < C; c++) {
      const cb = c * H * Wd
      for (let y = 0; y < OH; y++) {
        for (let x = 0; x < OW; x++) {
          let m = -Infinity
          for (let dy = 0; dy < s; dy++) {
            const row = cb + (y * st + dy) * Wd + x * st
            for (let dx = 0; dx < s; dx++) {
              const v = inp[row + dx]
              if (v > m) m = v
            }
          }
          out[o++] = m
        }
      }
    }
    return out
  }
  return { op, out: [C, OH, OW] }
}

function denseOp(inShape: number[], l: LayerSpec, W: Float32Array, B: Float32Array | null): { op: Op; out: number[] } {
  const IN = prod(inShape)
  const [OUT, WIN] = l.weight!.shape
  if (WIN !== IN) throw new Error(`model: ${l.name} expects ${WIN} inputs, got ${IN}`)
  const out = new Float32Array(OUT)
  const doRelu = l.activation === 'relu'
  const op: Op = (inp) => {
    for (let o = 0; o < OUT; o++) {
      let acc = B ? B[o] : 0
      const wb = o * IN
      for (let i = 0; i < IN; i++) acc += W[wb + i] * inp[i]
      out[o] = doRelu && acc < 0 ? 0 : acc
    }
    return out
  }
  return { op, out: [OUT] }
}

function softmaxOp(inShape: number[]): { op: Op; out: number[] } {
  const n = prod(inShape)
  const out = new Float32Array(n)
  const tmp = new Float64Array(n)
  const op: Op = (inp) => {
    let m = -Infinity
    for (let i = 0; i < n; i++) if (inp[i] > m) m = inp[i]
    let sum = 0
    for (let i = 0; i < n; i++) {
      tmp[i] = Math.exp(inp[i] - m)
      sum += tmp[i]
    }
    for (let i = 0; i < n; i++) out[i] = tmp[i] / sum
    return out
  }
  return { op, out: inShape }
}

export class Cnn {
  readonly spec: ModelSpec
  readonly inputSize: number
  readonly outputSize: number
  readonly embeddingSize: number
  private ops: Op[] = []
  private embedIndex = -1
  private input: Float32Array

  constructor(spec: ModelSpec, weights: ArrayBuffer) {
    if (spec.format !== MODEL_FORMAT) throw new Error(`model: unknown format ${spec.format}`)
    if (!(spec.version >= 1 && spec.version <= MAX_FORMAT_VERSION)) throw new Error(`model: unsupported version ${spec.version}`)
    if (spec.weights.byteLength != null && spec.weights.byteLength !== weights.byteLength) {
      throw new Error(`model: weights size ${weights.byteLength} != declared ${spec.weights.byteLength}`)
    }
    this.spec = spec
    let shape = spec.input.shape.slice()
    this.inputSize = prod(shape)
    this.input = new Float32Array(this.inputSize)
    let embSize = 0
    spec.layers.forEach((l, idx) => {
      const name = l.name ?? `${l.type}#${idx}`
      if (l.inShape && prod(l.inShape) !== prod(shape)) throw new Error(`model: ${name} input shape mismatch`)
      let built: { op: Op; out: number[] }
      switch (l.type) {
        case 'conv2d': {
          const W = readTensor(l.weight!, weights, name + '.weight')
          const B = l.bias ? readTensor(l.bias, weights, name + '.bias') : null
          built = conv2dOp(shape, { ...l, name }, W, B)
          break
        }
        case 'dense': {
          const W = readTensor(l.weight!, weights, name + '.weight')
          const B = l.bias ? readTensor(l.bias, weights, name + '.bias') : null
          built = denseOp(shape, { ...l, name }, W, B)
          break
        }
        case 'maxpool2d':
          built = maxpoolOp(shape, l)
          break
        case 'flatten':
          built = { op: (x) => x, out: [prod(shape)] }
          break
        case 'dropout':
          built = { op: (x) => x, out: shape }
          break
        case 'relu': {
          const n = prod(shape)
          const out = new Float32Array(n)
          built = { op: (x) => { for (let i = 0; i < n; i++) out[i] = x[i] > 0 ? x[i] : 0; return out }, out: shape }
          break
        }
        case 'softmax':
          built = softmaxOp(shape)
          break
        default:
          throw new Error(`model: unsupported layer type ${(l as LayerSpec).type}`)
      }
      if (l.outShape && prod(l.outShape) !== prod(built.out)) throw new Error(`model: ${name} output shape mismatch`)
      this.ops.push(built.op)
      shape = built.out
      if (l.embedding) {
        this.embedIndex = idx
        embSize = prod(shape)
      }
    })
    this.outputSize = prod(shape)
    this.embeddingSize = embSize
  }

  get modelId(): string {
    return this.spec.modelId
  }

  /** Runs the network on a CHW input (28×28 for the digits model). */
  run(input: ArrayLike<number>): CnnOutput {
    if (input.length !== this.inputSize) throw new Error(`model: expected ${this.inputSize} inputs, got ${input.length}`)
    this.input.set(input)
    let x = this.input
    let emb: Float32Array | null = null
    for (let i = 0; i < this.ops.length; i++) {
      x = this.ops[i](x)
      if (i === this.embedIndex) emb = x
    }
    return { output: x, embedding: emb }
  }
}

/** Fetches model.json + its weights file. Retries the weights once bypassing caches if sizes disagree
    (a stale cached .bin next to a fresh .json after a model update). */
export async function fetchCnn(jsonUrl: string, fetchImpl: typeof fetch = fetch): Promise<Cnn> {
  const res = await fetchImpl(jsonUrl)
  if (!res.ok) throw new Error(`model: HTTP ${res.status} for ${jsonUrl}`)
  const spec = (await res.json()) as ModelSpec
  const binUrl = new URL(spec.weights.file, new URL(jsonUrl, typeof location !== 'undefined' ? location.href : 'http://localhost/')).toString()
  const getBin = async (init?: RequestInit) => {
    const r = await fetchImpl(binUrl, init)
    if (!r.ok) throw new Error(`model: HTTP ${r.status} for ${binUrl}`)
    return r.arrayBuffer()
  }
  let bin = await getBin()
  if (spec.weights.byteLength != null && bin.byteLength !== spec.weights.byteLength) bin = await getBin({ cache: 'reload' })
  return new Cnn(spec, bin)
}
