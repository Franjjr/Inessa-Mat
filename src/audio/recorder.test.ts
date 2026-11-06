import { afterEach, describe, expect, it, vi } from 'vitest'
import { encodeWav, resampleTo16k, toPcm16 } from './recorder'

const text = (b: DataView, from: number, len: number) => String.fromCharCode(...Array.from({ length: len }, (_, i) => b.getUint8(from + i)))

describe('encodeWav', () => {
  it('writes a 16-bit mono PCM WAV at 16 kHz with the right header', async () => {
    const pcm = new Int16Array([0, 1000, -1000, 32767])
    const blob = encodeWav(pcm, 16000)
    expect(blob.type).toBe('audio/wav')
    const b = new DataView(await blob.arrayBuffer())
    expect(text(b, 0, 4)).toBe('RIFF')
    expect(b.getUint32(4, true)).toBe(36 + pcm.byteLength)
    expect(text(b, 8, 4)).toBe('WAVE')
    expect(text(b, 12, 4)).toBe('fmt ')
    expect(b.getUint16(20, true)).toBe(1) // PCM
    expect(b.getUint16(22, true)).toBe(1) // mono
    expect(b.getUint32(24, true)).toBe(16000)
    expect(b.getUint32(28, true)).toBe(32000) // byte rate
    expect(b.getUint16(32, true)).toBe(2) // block align
    expect(b.getUint16(34, true)).toBe(16) // bits
    expect(text(b, 36, 4)).toBe('data')
    expect(b.getUint32(40, true)).toBe(pcm.byteLength)
    expect(b.getInt16(44 + 2, true)).toBe(1000)
  })
})

describe('toPcm16 and resampleTo16k', () => {
  it('clamps to the 16-bit range', () => {
    expect(Array.from(toPcm16(new Float32Array([0, 1, -1, 2, -2])))).toEqual([0, 32767, -32768, 32767, -32768])
  })

  it('turns 48 kHz into 16 kHz (a third of the samples) and keeps a steady level', () => {
    const input = new Float32Array(4800).fill(0.5)
    const out = resampleTo16k(input, 48000)
    expect(out.length).toBe(1600)
    expect(out[0]).toBeCloseTo(0.5, 5)
    expect(out[1599]).toBeCloseTo(0.5, 5)
  })

  it('keeps a clip already at 16 kHz as it is', () => {
    const input = new Float32Array([0.1, 0.2, 0.3])
    const out = resampleTo16k(input, 16000)
    expect(out.length).toBe(3)
    expect(out[1]).toBeCloseTo(0.2, 5)
  })
})

describe('startTake', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('rejects when the microphone is denied, so the caller can skip without penalty', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => { throw new DOMException('denied', 'NotAllowedError') }) } })
    const { startTake } = await import('./recorder')
    await expect(startTake(10)).rejects.toMatchObject({ name: 'NotAllowedError' })
  })
})

describe('startTake: the clip, the limit and the release of the microphone', () => {
  /** A fake browser audio graph: the test feeds the processor by hand, as the browser would. */
  function fakeAudio() {
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    const processor: { onaudioprocess: ((e: unknown) => void) | null; connect: () => void; disconnect: ReturnType<typeof vi.fn> } = {
      onaudioprocess: null, connect() {}, disconnect: vi.fn(),
    }
    const ctx = {
      sampleRate: 48000,
      createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
      createScriptProcessor: () => processor,
      destination: {},
      resume: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    }
    const feed = (seconds: number) => processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array(48000 * seconds).fill(0.25) } })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => stream) } })
    vi.stubGlobal('AudioContext', class { constructor() { return ctx as unknown as object } })
    return { track, ctx, processor, feed }
  }

  afterEach(() => vi.unstubAllGlobals())

  it('stops at the 10 s limit by itself, releases the microphone, and gives a WAV of at most 400 KB', async () => {
    const { track, ctx, feed } = fakeAudio()
    const { startTake } = await import('./recorder')
    const take = await startTake(10)
    feed(6)
    expect(track.stop).not.toHaveBeenCalled()
    feed(6) // 12 s offered: the take keeps only the first 10 s
    const blob = await take.done
    expect(track.stop).toHaveBeenCalled()
    expect(ctx.close).toHaveBeenCalled()
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 16000 * 10 * 2)
    expect(blob.size).toBeLessThanOrEqual(400 * 1024)
  })

  it('the press again ends the take early, releasing the microphone once', async () => {
    const { track, ctx, feed } = fakeAudio()
    const { startTake } = await import('./recorder')
    const take = await startTake(10)
    feed(1)
    take.stop()
    take.stop()
    const blob = await take.done
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(ctx.close).toHaveBeenCalledTimes(1)
    expect(blob.size).toBe(44 + 16000 * 1 * 2)
  })
})

describe('startTake: a failure while setting up the audio releases the microphone', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('stops the microphone tracks when the audio context cannot be created', async () => {
    const track = { stop: vi.fn() }
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) } })
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('no audio here') } })
    const { startTake } = await import('./recorder')
    await expect(startTake(10)).rejects.toThrow('no audio here')
    expect(track.stop).toHaveBeenCalledTimes(1)
  })
})
