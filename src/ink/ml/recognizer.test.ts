import { describe, expect, it, vi } from 'vitest'
import type { InkStroke } from '@/types'
import { encodeImage28 } from './preprocess'
import { createRecognizer, loadDigitModel, type PersonalSample } from './recognizer'
import { benchMs, loadModelFromDisk, MODEL_DIR, readBytes, readFixture, type FixtureCase } from './testUtils'

const model = loadModelFromDisk()
const { cases } = readFixture<{ cases: FixtureCase[] }>('cases.json')

interface Writer {
  zone: { width: number; height: number }
  oddDigit: number
  calibration: Record<string, InkStroke[][]>
  extraOdd: InkStroke[][]
  testOdd: InkStroke[][]
  testNormal: Record<string, InkStroke[][]>
  testEight: InkStroke[][]
  testSeven: InkStroke[][]
}
const writer = readFixture<Writer>('writer.json')

describe('recognizer', () => {
  it('is not ready before load and answers null instead of throwing', () => {
    const rec = createRecognizer({ model: Promise.resolve(model) })
    expect(rec.ready).toBe(false)
    const r = rec.recognize(cases[0].strokes, cases[0].zone)
    expect(r.digit).toBeNull()
    expect(r.reason).toBe('not-ready')
    expect(r.image28).toHaveLength(784)
  })

  it('loads once from model.json + model.bin and shares the model between instances', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const file = String(url).endsWith('.json') ? 'model.json' : 'model.bin'
      return new Response(readBytes(MODEL_DIR + file), { status: 200 })
    }) as unknown as typeof fetch
    const url = 'http://localhost/models/digits/model.json'
    const a = createRecognizer({ modelUrl: url, fetchImpl })
    const b = createRecognizer({ modelUrl: url, fetchImpl })
    await Promise.all([a.load(), b.load()])
    await a.load()
    expect(a.ready && b.ready).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(a.modelId).toBe(model.modelId)
    expect(await loadDigitModel(url)).toBeDefined()
  })

  it('retries after a failed load', async () => {
    let calls = 0
    const fetchImpl = (async () => {
      calls++
      return new Response('nope', { status: 503 })
    }) as unknown as typeof fetch
    const rec = createRecognizer({ modelUrl: 'http://localhost/missing/model.json', fetchImpl })
    await expect(rec.load()).rejects.toThrow(/503/)
    await expect(rec.load()).rejects.toThrow(/503/)
    expect(calls).toBe(2)
    expect(rec.ready).toBe(false)
  })

  it('recognises fixture strokes of every digit', async () => {
    const rec = createRecognizer({ model })
    await rec.load()
    for (const c of cases.filter((c) => c.name.startsWith('digit-'))) {
      const r = rec.recognize(c.strokes, c.zone)
      expect(r.digit, c.name).toBe(c.expected)
      expect(r.confidence).toBeGreaterThan(0.5)
      expect(r.probs).toHaveLength(10)
      expect(r.probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      expect(r.alternatives[0].digit).toBe(c.expected)
      expect(r.alternatives).toHaveLength(3)
      for (let i = 1; i < r.alternatives.length; i++) expect(r.alternatives[i].p).toBeLessThanOrEqual(r.alternatives[i - 1].p)
      expect(r.embedding).toHaveLength(64)
      expect(r.image28).toHaveLength(784)
    }
  })

  it('recognises a thin "1" and the same "1" at very different sizes', async () => {
    const rec = createRecognizer({ model })
    for (const n of ['thin-one', 'one-small', 'one-large']) {
      const c = cases.find((x) => x.name === n)!
      expect(rec.recognize(c.strokes, c.zone).digit, n).toBe(1)
    }
  })

  it('ignores a tap on the cell made before writing', () => {
    const rec = createRecognizer({ model })
    for (const n of ['tap-then-7']) {
      const c = cases.find((x) => x.name === n)!
      expect(rec.recognize(c.strokes, c.zone).digit, n).toBe(7)
    }
  })

  it('returns null for empty ink, tiny marks, scribbles and symbols', async () => {
    const rec = createRecognizer({ model })
    expect(rec.recognize([], { width: 100, height: 100 })).toMatchObject({ digit: null, reason: 'empty', alternatives: [] })
    for (const n of ['dot', 'tiny-stroke']) {
      const c = cases.find((x) => x.name === n)!
      expect(rec.recognize(c.strokes, c.zone)).toMatchObject({ digit: null, reason: 'tiny' })
    }
    for (const n of ['scribble-0', 'scribble-1', 'cross', 'dash', 'dots-only']) {
      const c = cases.find((x) => x.name === n)!
      const r = rec.recognize(c.strokes, c.zone)
      expect(r.digit, n).toBeNull()
      expect(r.confidence).toBe(0)
    }
  })

  it('reports timing and stays fast end-to-end', () => {
    const rec = createRecognizer({ model })
    const c = cases[3]
    const ms = benchMs(() => rec.recognize(c.strokes, c.zone))
    console.info(`[ml] recognize() end-to-end: ${ms.toFixed(3)} ms/digit`)
    expect(ms).toBeLessThan(8)
  })
})

describe('personalisation', () => {
  const rec = createRecognizer({ model })
  const z = writer.zone
  const rate = (inks: InkStroke[][], digit: number) => inks.filter((s) => rec.recognize(s, z).digit === digit).length / inks.length
  const samplesOf = (inks: InkStroke[][], digit: number): PersonalSample[] =>
    inks.map((s) => {
      const r = rec.recognize(s, z)
      return { digit, embedding: r.embedding, modelId: rec.modelId ?? undefined }
    })
  const calibration = () => Object.entries(writer.calibration).flatMap(([d, inks]) => samplesOf(inks, Number(d)))

  it('the CNN alone misreads this child\'s odd "3" (mirrored, like an epsilon)', () => {
    rec.setPersonalSamples([])
    expect(rate(writer.testOdd, 3)).toBeLessThanOrEqual(0.3)
  })

  it('a few of the child\'s own samples fix the odd style without breaking other digits', () => {
    rec.setPersonalSamples([...calibration(), ...samplesOf(writer.extraOdd, 3)])
    expect(rec.personalCounts()[3]).toBe(1 + writer.extraOdd.length)
    expect(rate(writer.testOdd, 3)).toBeGreaterThanOrEqual(0.8)
    expect(rate(writer.testEight, 8)).toBeGreaterThanOrEqual(0.9)
    for (const [d, inks] of Object.entries(writer.testNormal)) expect(rate(inks, Number(d)), `digit ${d}`).toBeGreaterThanOrEqual(0.75)
  })

  it('one wrong sample does not change how normal digits are read', () => {
    const wrong = samplesOf(writer.testSeven.slice(0, 1), 1) // a "7" mistakenly stored as "1"
    rec.setPersonalSamples([...calibration(), ...wrong])
    expect(rate(writer.testSeven.slice(1), 7)).toBeGreaterThanOrEqual(0.9)
    rec.setPersonalSamples(wrong) // even with no other samples at all
    expect(rate(writer.testSeven.slice(1), 7)).toBeGreaterThanOrEqual(0.9)
  })

  it('recomputes embeddings from stored image28 and ignores incompatible samples', () => {
    const imgSamples: PersonalSample[] = [...writer.calibration['3'], ...writer.extraOdd].map((s) => ({
      digit: 3,
      embedding: [],
      image28: encodeImage28(rec.recognize(s, z).image28),
    }))
    const stale: PersonalSample[] = [
      { digit: 3, embedding: Array(64).fill(1), modelId: 'digits-old' }, // other model, no image -> ignored
      { digit: 4, embedding: [1, 2, 3] }, // wrong size -> ignored
      { digit: 12, embedding: Array(64).fill(1) }, // invalid digit -> ignored
    ]
    rec.setPersonalSamples([...imgSamples, ...stale])
    expect(rec.personalCounts()).toEqual([0, 0, 0, 4, 0, 0, 0, 0, 0, 0])
    expect(rate(writer.testOdd, 3)).toBeGreaterThanOrEqual(0.8)
  })

  it('samples set before load() are applied once the model arrives', async () => {
    const lazy = createRecognizer({ model: Promise.resolve(model) })
    const imgs = [...writer.calibration['3'], ...writer.extraOdd].map((s) => ({ digit: 3, embedding: [], image28: rec.recognize(s, z).image28 }))
    lazy.setPersonalSamples(imgs)
    await lazy.load()
    expect(lazy.personalCounts()[3]).toBe(4)
    const r = lazy.recognize(writer.testOdd[0], z)
    expect(r.personalWeight).toBeGreaterThan(0.3)
  })
})
