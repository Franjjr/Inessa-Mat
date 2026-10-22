import { describe, expect, it } from 'vitest'
import { Cnn, type ModelSpec } from './cnn'
import { benchMs, decodeSparseImage, loadModelFromDisk, maxAbsDiff, readFixture, type FixtureCase } from './testUtils'

const fixture = readFixture<{ modelId: string; cases: FixtureCase[] }>('cases.json')

describe('cnn', () => {
  const model = loadModelFromDisk()

  it('loads the exported model (<= 1 MB, 28×28 input, 64-d embedding)', () => {
    expect(model.inputSize).toBe(784)
    expect(model.outputSize).toBe(model.spec.labels.length)
    expect(model.embeddingSize).toBe(64)
    expect(model.spec.weights.byteLength).toBeLessThanOrEqual(1024 * 1024)
  })

  it('fixtures were exported for this model (else re-run ml/make_fixtures.py)', () => {
    expect(fixture.modelId).toBe(model.modelId)
  })

  it('matches the Python reference outputs (JS vs NumPy parity)', () => {
    let maxP = 0
    let maxE = 0
    for (const c of fixture.cases) {
      if (!c.reference.image) continue
      const { output, embedding } = model.run(decodeSparseImage(c.reference.image))
      maxP = Math.max(maxP, maxAbsDiff(output, c.reference.output!))
      const ref = c.reference.embedding!
      const scale = Math.max(1, ...ref.map(Math.abs))
      maxE = Math.max(maxE, maxAbsDiff(embedding!, ref) / scale)
    }
    expect(maxP).toBeLessThan(1e-4)
    expect(maxE).toBeLessThan(1e-4)
  })

  it('outputs a probability distribution', () => {
    const img = new Float32Array(784)
    for (let i = 5; i < 23; i++) img[i * 28 + 14] = 1
    const { output } = model.run(img)
    expect(output.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
  })

  it('rejects malformed models with a clear error', () => {
    const spec = model.spec
    const buf = new ArrayBuffer(spec.weights.byteLength ?? 0)
    expect(() => new Cnn({ ...spec, format: 'other' } as ModelSpec, buf)).toThrow(/format/)
    expect(() => new Cnn({ ...spec, version: 99 }, buf)).toThrow(/version/)
    expect(() => new Cnn(spec, new ArrayBuffer(16))).toThrow(/size/)
  })

  it('dequantises int8 tensors (per-channel scales)', () => {
    const spec: ModelSpec = {
      format: 'numeria-seq-cnn', version: 1, modelId: 'tiny', input: { shape: [4] }, labels: ['a', 'b'],
      weights: { file: 'x.bin', byteLength: 16 },
      layers: [
        { type: 'dense', inShape: [4], outShape: [2], activation: 'none',
          weight: { offset: 0, shape: [2, 4], dtype: 'int8', scales: [0.5, 0.25] }, bias: { offset: 8, shape: [2], dtype: 'float32' } },
      ],
    }
    const buf = new ArrayBuffer(16)
    new Int8Array(buf, 0, 8).set([2, 0, 0, 0, 0, 4, 0, 0])
    new DataView(buf).setFloat32(8, 1, true)
    new DataView(buf).setFloat32(12, -1, true)
    const out = new Cnn(spec, buf).run([1, 1, 0, 0]).output
    expect(Array.from(out)).toEqual([2, 0])
  })

  it('runs fast (< 5 ms per digit in node)', () => {
    const img = decodeSparseImage(fixture.cases[0].reference.image!)
    const ms = benchMs(() => model.run(img))
    console.info(`[ml] CNN inference: ${ms.toFixed(3)} ms/digit`)
    expect(ms).toBeLessThan(5)
  })
})
