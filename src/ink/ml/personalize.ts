/* Personalisation: cosine kNN over CNN embeddings of the child's own samples, blended into the CNN
   distribution per class.

   For each class c with personal samples:
     s_c  = mean of the top-2 cosine similarities between the query and the class's samples (top-1 if only one)
            -> a single odd sample cannot dominate a class that has other samples
     q    = softmax over {classes with samples} ∪ {"none of them"} of s / T, where "none" scores `threshold`
            -> a query unlike every personal sample leaves the CNN untouched
     W_c  = cap · (1 − exp(−n_c / tau))   (grows with the number of samples of that class, capped at `cap`)
   p(c) = cnn(c) · (1 − Σ_k W_k q_k) + W_c q_c       (still sums to 1; the CNN keeps ≥ 1 − cap of the mass)

   With cap 0.6 and tau 1.5 a single (possibly mislabelled) sample has weight ≈ 0.29 and cannot overturn a
   confident CNN; 3+ consistent samples of an unusual style (W ≥ 0.52) can. */

export interface PersonalizationConfig {
  /** Maximum weight of the kNN evidence for a class (CNN always keeps ≥ 1 − cap). */
  cap: number
  /** Sample-count scale of W_c = cap · (1 − exp(−n/tau)). */
  tau: number
  /** Softmax temperature over cosine similarities. */
  temperature: number
  /** Cosine similarity at which a personal match is as likely as "none of my samples". */
  threshold: number
  /** Newest samples kept per class. */
  maxPerClass: number
}

/* Calibrated on simulated writers (ml/calibrate_personal.py): same writer + same digit cosine ≥ 0.97 (1st
   percentile); different digits ≤ 0.43 (99th); a mirrored "3" vs the same writer's "8" ≈ 0.75–0.85. */
export const DEFAULT_PERSONALIZATION: PersonalizationConfig = {
  cap: 0.6,
  tau: 1.5,
  temperature: 0.02,
  threshold: 0.9,
  maxPerClass: 30,
}

export interface IndexedSample { digit: number; embedding: ArrayLike<number> }

export interface BlendResult {
  probs: Float64Array
  /** Total mass moved by personalisation (Σ W_k q_k), 0..cap. */
  personalWeight: number
  /** Best similarity per class (NaN when the class has no samples). */
  similarity: number[]
}

function normalized(v: ArrayLike<number>): Float32Array | null {
  let n = 0
  for (let i = 0; i < v.length; i++) n += v[i] * v[i]
  if (!(n > 1e-12) || !Number.isFinite(n)) return null
  const inv = 1 / Math.sqrt(n)
  const out = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) out[i] = v[i] * inv
  return out
}

export class PersonalIndex {
  readonly config: PersonalizationConfig
  private byClass: Float32Array[][] = []
  private dim = 0
  private readonly classes: number

  constructor(classes = 10, config: Partial<PersonalizationConfig> = {}) {
    this.classes = classes
    this.config = { ...DEFAULT_PERSONALIZATION, ...config }
    this.clear()
  }

  clear(): void {
    this.byClass = Array.from({ length: this.classes }, () => [])
  }

  /** Replaces the sample set. Samples with a wrong dimension, invalid digit or zero vector are ignored.
      Order matters: later samples are considered newer (only the newest `maxPerClass` are kept). */
  set(samples: ReadonlyArray<IndexedSample>, dim: number): void {
    this.clear()
    this.dim = dim
    for (const s of samples) {
      if (!Number.isInteger(s.digit) || s.digit < 0 || s.digit >= this.classes) continue
      if (!s.embedding || s.embedding.length !== dim) continue
      const v = normalized(s.embedding)
      if (!v) continue
      const list = this.byClass[s.digit]
      list.push(v)
      if (list.length > this.config.maxPerClass) list.shift()
    }
  }

  get size(): number {
    return this.byClass.reduce((a, l) => a + l.length, 0)
  }

  counts(): number[] {
    return this.byClass.map((l) => l.length)
  }

  /** Blends `cnn` (length ≥ classes; extra entries such as a reject class are kept and scaled) with kNN. */
  blend(cnn: ArrayLike<number>, embedding: ArrayLike<number>): BlendResult {
    const out = new Float64Array(cnn.length)
    for (let i = 0; i < cnn.length; i++) out[i] = cnn[i]
    const similarity = new Array<number>(this.classes).fill(NaN)
    if (this.size === 0 || embedding.length !== this.dim) return { probs: out, personalWeight: 0, similarity }
    const q = normalized(embedding)
    if (!q) return { probs: out, personalWeight: 0, similarity }
    const { temperature: T, threshold, cap, tau } = this.config
    const score = new Array<number>(this.classes).fill(NaN)
    for (let c = 0; c < this.classes; c++) {
      const list = this.byClass[c]
      if (!list.length) continue
      let b1 = -Infinity, b2 = -Infinity
      for (const v of list) {
        let d = 0
        for (let i = 0; i < v.length; i++) d += v[i] * q[i]
        if (d > b1) { b2 = b1; b1 = d } else if (d > b2) b2 = d
      }
      similarity[c] = b1
      score[c] = list.length >= 2 ? (b1 + b2) / 2 : b1
    }
    // softmax over sampled classes + "none"
    let m = threshold
    for (const s of score) if (!Number.isNaN(s) && s > m) m = s
    let z = Math.exp((threshold - m) / T)
    const e = score.map((s) => (Number.isNaN(s) ? 0 : Math.exp((s - m) / T)))
    for (const v of e) z += v
    let moved = 0
    const add = new Float64Array(this.classes)
    for (let c = 0; c < this.classes; c++) {
      if (!e[c]) continue
      const n = this.byClass[c].length
      const w = cap * (1 - Math.exp(-n / tau))
      add[c] = w * (e[c] / z)
      moved += add[c]
    }
    for (let i = 0; i < out.length; i++) out[i] *= 1 - moved
    for (let c = 0; c < this.classes; c++) out[c] += add[c]
    return { probs: out, personalWeight: moved, similarity }
  }
}
