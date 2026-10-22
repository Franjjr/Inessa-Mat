import type { InkSample } from '@/types'
import { recognition } from './dev/scripted'

const addInkSample = vi.fn(async (_s: InkSample) => {})
vi.mock('@/data', () => ({ addInkSample: (s: InkSample) => addInkSample(s) }))

const { image28ToBase64, makeSample, selectPersonalSamples, selectSamples } = await import('./learning')
const { LearningStore } = await import('./context')

const withEmbedding = (digit: number, confidence = 0.9) => ({ ...recognition({ digit, confidence }), embedding: [digit, 1, 2] })

function sample(digit: number, source: InkSample['source'], createdAt: string): InkSample {
  return { id: `${digit}-${createdAt}`, childId: 'c', digit, embedding: [digit], source, createdAt }
}

describe('samples', () => {
  it('encodes the 28×28 image as base64 bytes', () => {
    const img = new Float32Array(784)
    img[0] = 1
    const b64 = image28ToBase64(img)!
    const bytes = atob(b64)
    expect(bytes.length).toBe(784)
    expect(bytes.charCodeAt(0)).toBe(255)
    expect(bytes.charCodeAt(1)).toBe(0)
  })

  it('builds an InkSample from a recognition', () => {
    const s = makeSample('child-1', 4, withEmbedding(4), 'calibration')
    expect(s).toMatchObject({ childId: 'child-1', digit: 4, source: 'calibration', embedding: [4, 1, 2] })
    expect(typeof s.id).toBe('string')
    expect(s.image28).toBeTruthy()
  })

  it('keeps calibration/corrected samples and only the newest confirmed ones per digit', () => {
    const list = [
      sample(3, 'calibration', '2026-01-01'),
      sample(3, 'corrected', '2026-01-02'),
      sample(3, 'confirmed', '2026-01-03'),
      sample(3, 'confirmed', '2026-01-05'),
      sample(3, 'confirmed', '2026-01-04'),
      { ...sample(5, 'confirmed', '2026-01-04'), embedding: [] },
    ]
    const out = selectPersonalSamples(list, { confirmed: 2 })
    expect(out).toHaveLength(4)
    expect(out.filter((s) => s.digit === 5)).toHaveLength(0)
  })

  it('returns oldest first (the recogniser treats later samples as newer) and caps every source per digit', () => {
    const list: InkSample[] = []
    for (let i = 0; i < 40; i++) list.push(sample(7, 'corrected', `2026-02-${String(i % 28 + 1).padStart(2, '0')}T${String(i).padStart(2, '0')}`))
    list.push(sample(7, 'calibration', '2026-01-01'), sample(7, 'calibration', '2026-01-01T01'))
    for (let i = 0; i < 30; i++) list.push(sample(7, 'confirmed', `2026-03-01T${String(i).padStart(2, '0')}`))
    const out = selectSamples(list)
    expect(out.filter((s) => s.source === 'calibration')).toHaveLength(2) // never pushed out by corrections
    expect(out.filter((s) => s.source === 'corrected')).toHaveLength(10)
    expect(out.filter((s) => s.source === 'confirmed')).toHaveLength(16)
    expect(out.length).toBeLessThanOrEqual(30) // = the recogniser's per-class index size
    const dates = out.map((s) => s.createdAt)
    expect(dates).toEqual([...dates].sort())
    expect(out.at(-1)!.createdAt).toBe('2026-03-01T29') // the newest is last
  })

  it('drops duplicates and samples that cannot be used', () => {
    const a = sample(2, 'confirmed', '2026-01-01')
    const out = selectSamples([a, a, { ...sample(11, 'confirmed', '2026-01-02') }, { ...sample(4, 'confirmed', '2026-01-03'), embedding: [] }])
    expect(out).toEqual([a])
  })
})

describe('LearningStore', () => {
  beforeEach(() => addInkSample.mockClear())

  it('confirm() stores the pending recognitions as confirmed samples and pushes them', () => {
    const store = new LearningStore()
    const setPersonalSamples = vi.fn()
    store.childId = 'child-1'
    store.recognizer = { ready: true, load: async () => {}, recognize: () => withEmbedding(0), setPersonalSamples }
    store.report('cell-a', 6, withEmbedding(6))
    store.report('cell-b', 7, withEmbedding(7))
    store.report('cell-b', 1, withEmbedding(1)) // the child rewrote cell b
    store.confirm()
    expect(addInkSample).toHaveBeenCalledTimes(2)
    expect(addInkSample.mock.calls.map((c) => [c[0].digit, c[0].source])).toEqual([[6, 'confirmed'], [1, 'confirmed']])
    expect(setPersonalSamples).toHaveBeenCalled()
    expect(setPersonalSamples.mock.calls.at(-1)![0]).toHaveLength(2)
  })

  it('discard() forgets pending recognitions; corrections are stored at once and counted', () => {
    const store = new LearningStore()
    store.childId = 'child-1'
    store.report('cell-a', 6, withEmbedding(6))
    store.corrected(1, withEmbedding(7))
    store.countFix()
    expect(store.recognitionFixes()).toBe(1)
    expect(addInkSample).toHaveBeenCalledTimes(1)
    expect(addInkSample.mock.calls[0][0]).toMatchObject({ digit: 1, source: 'corrected' })
    store.discard()
    expect(store.recognitionFixes()).toBe(0)
    store.confirm()
    expect(addInkSample).toHaveBeenCalledTimes(1)
  })

  it('keeps the in-memory set bounded however many samples are loaded', () => {
    const store = new LearningStore()
    const many = Array.from({ length: 500 }, (_, i) => sample(i % 10, 'confirmed', `2026-01-01T${String(i).padStart(4, '0')}`))
    store.setSamples(many)
    expect(store.samples.length).toBe(160)
  })

  it('calibration samples go to the child being calibrated, even before it is the active one', () => {
    const store = new LearningStore()
    const setPersonalSamples = vi.fn()
    store.configure(null, { ready: true, load: async () => {}, recognize: () => withEmbedding(0), setPersonalSamples })
    expect(store.calibration(4, withEmbedding(4), 'new-kid')).toBe(true)
    expect(addInkSample).toHaveBeenCalledWith(expect.objectContaining({ childId: 'new-kid', digit: 4, source: 'calibration' }))
    expect(setPersonalSamples.mock.calls.at(-1)![0]).toHaveLength(1) // no active child: it personalises right away
    // another child is active: stored for the calibrated child, but not mixed into the active child's set
    store.configure('other', store.recognizer)
    store.calibration(5, withEmbedding(5), 'new-kid')
    expect(addInkSample).toHaveBeenLastCalledWith(expect.objectContaining({ childId: 'new-kid', digit: 5 }))
    expect(store.samples).toHaveLength(0)
  })

  it('without a child, samples stay in memory only; recognitions without embedding are ignored', () => {
    const store = new LearningStore()
    store.report('x', 3, recognition({ digit: 3 }))
    store.confirm()
    expect(addInkSample).not.toHaveBeenCalled()
    expect(store.samples).toHaveLength(0)
  })
})
