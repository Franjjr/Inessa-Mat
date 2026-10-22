/* Personal handwriting samples: conversion to the stored InkSample shape and selection of the set that is
   pushed to the recogniser (all calibration + corrected samples, plus the most recent confirmed ones). */
import type { DigitRecognition, InkSample } from '@/types'
import { MAX_CONFIRMED_PER_DIGIT } from './constants'

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

/** Keeps the personal set small and fresh so kNN blending stays fast and adapts as handwriting matures. */
export function selectPersonalSamples(samples: readonly InkSample[], maxConfirmedPerDigit = MAX_CONFIRMED_PER_DIGIT): PersonalSampleLite[] {
  const valid = samples.filter(
    (s) => s.digit >= 0 && s.digit <= 9 && ((Array.isArray(s.embedding) && s.embedding.length > 0) || !!s.image28),
  )
  const confirmed = valid
    .filter((s) => s.source === 'confirmed')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  const perDigit = new Map<number, number>()
  const keptConfirmed = confirmed.filter((s) => {
    const n = perDigit.get(s.digit) ?? 0
    if (n >= maxConfirmedPerDigit) return false
    perDigit.set(s.digit, n + 1)
    return true
  })
  return [...valid.filter((s) => s.source !== 'confirmed'), ...keptConfirmed].map((s) =>
    s.image28 ? { digit: s.digit, embedding: s.embedding ?? [], image28: s.image28 } : { digit: s.digit, embedding: s.embedding },
  )
}
