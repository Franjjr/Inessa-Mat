/* Personal handwriting samples: conversion to the stored InkSample shape and selection of the set that is
   pushed to the recogniser (the newest calibration, corrected and confirmed samples of each digit). */
import type { DigitRecognition, InkSample } from '@/types'
import { MAX_SAMPLES_PER_DIGIT } from './constants'

/** Shape accepted by recognizer.setPersonalSamples (image28 lets the recogniser recompute embeddings after a model update). */
export interface PersonalSampleLite { digit: number; embedding: number[]; image28?: string }

/** 28×28 floats (0..1) → base64 of 784 bytes (0..255). */
export function image28ToBase64(img: Float32Array | null | undefined): string | undefined {
  if (!img || !img.length) return undefined
  const bytes = new Uint8Array(img.length)
  for (let i = 0; i < img.length; i++) bytes[i] = Math.max(0, Math.min(255, Math.round(img[i] * 255)))
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return typeof btoa === 'function' ? btoa(bin) : undefined
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch { /* insecure context */ }
  return 'ink-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function hasEmbedding(rec: Pick<DigitRecognition, 'embedding'> | null | undefined): boolean {
  return !!rec && Array.isArray(rec.embedding) && rec.embedding.length > 0
}

export function makeSample(childId: string, digit: number, rec: DigitRecognition, source: InkSample['source']): InkSample {
  return {
    id: uuid(),
    childId,
    digit,
    embedding: Array.from(rec.embedding),
    image28: image28ToBase64(rec.image28),
    source,
    createdAt: new Date().toISOString(),
  }
}

export type SampleCaps = { [K in InkSample['source']]: number }

const isUsable = (s: InkSample) =>
  Number.isInteger(s.digit) && s.digit >= 0 && s.digit <= 9 && ((Array.isArray(s.embedding) && s.embedding.length > 0) || !!s.image28)

/**
 * Keeps the personal set small and fresh so kNN blending stays fast and adapts as handwriting matures:
 * the newest few samples per digit and source (see MAX_SAMPLES_PER_DIGIT), oldest first. The recogniser treats
 * later samples as newer, so the order matters.
 */
export function selectSamples(samples: readonly InkSample[], caps: Partial<SampleCaps> = {}): InkSample[] {
  const limit: SampleCaps = { ...MAX_SAMPLES_PER_DIGIT, ...caps }
  const byAge = samples
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => isUsable(s))
    // newest first (stable for equal timestamps: later in the list = newer)
    .sort((a, b) => (a.s.createdAt < b.s.createdAt ? 1 : a.s.createdAt > b.s.createdAt ? -1 : b.i - a.i))
  const seen = new Set<string>()
  const counts = new Map<string, number>()
  const kept = byAge.filter(({ s }) => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    const key = `${s.source}:${s.digit}`
    const n = counts.get(key) ?? 0
    if (n >= (limit[s.source] ?? 0)) return false
    counts.set(key, n + 1)
    return true
  })
  return kept.reverse().map(({ s }) => s)
}

/** Shape pushed to recognizer.setPersonalSamples (oldest first). */
export function selectPersonalSamples(samples: readonly InkSample[], caps?: Partial<SampleCaps>): PersonalSampleLite[] {
  return selectSamples(samples, caps).map((s) =>
    s.image28 ? { digit: s.digit, embedding: s.embedding ?? [], image28: s.image28 } : { digit: s.digit, embedding: s.embedding },
  )
}
