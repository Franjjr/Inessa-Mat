/* Inglés: the child's clip for the pronunciation score, as 16 kHz mono 16-bit PCM WAV, made in the browser. The clip is
   at most `maxSeconds` long (10 s by default): the recording stops by itself at the limit. The microphone is released
   after every take (all tracks stopped, the audio context closed); nothing is kept here, the caller sends the Blob once.
   The browser captures at its own rate (often 48 kHz) and the samples are resampled here, so every browser gets the
   16 kHz that Azure expects. */

export const WAV_RATE = 16000
export const TAKE_MAX_SECONDS = 10

/** Float samples (-1..1) to 16-bit PCM, clamped. */
export function toPcm16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    out[i] = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767)
  }
  return out
}

/** The samples at 16 kHz: each output sample is the average of the input samples it covers (a plain box filter, enough for speech). */
export function resampleTo16k(input: Float32Array, inRate: number, outRate = WAV_RATE): Float32Array {
  if (inRate === outRate) return input
  const ratio = inRate / outRate
  const length = Math.floor(input.length / ratio)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.max(start + 1, Math.min(input.length, Math.floor((i + 1) * ratio)))
    let sum = 0
    for (let j = start; j < end; j++) sum += input[j]
    out[i] = sum / (end - start)
  }
  return out
}

/** A 16-bit mono PCM WAV file (44-byte header) holding these samples at `sampleRate`. */
export function encodeWav(pcm: Int16Array, sampleRate = WAV_RATE): Blob {
  const dataBytes = pcm.byteLength
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)) }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  write(36, 'data')
  view.setUint32(40, dataBytes, true)
  new Int16Array(buffer, 44).set(pcm)
  return new Blob([buffer], { type: 'audio/wav' })
}

/** One take: `stop()` ends it early (the press again); `done` resolves with the clip, once. */
export interface Take {
  stop: () => void
  done: Promise<Blob>
}

/** Starts a take. Rejects when the microphone is denied or missing: the caller then skips the item without penalty. */
export async function startTake(maxSeconds = TAKE_MAX_SECONDS): Promise<Take> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  const source = ctx.createMediaStreamSource(stream)
  // ScriptProcessor is deprecated but works on every browser the tablets use; AudioWorklet would need a second file.
  const processor = ctx.createScriptProcessor(4096, 1, 1)
  const chunks: Float32Array[] = []
  let length = 0
  const limit = Math.floor(ctx.sampleRate * maxSeconds)

  let resolveDone!: (blob: Blob) => void
  const done = new Promise<Blob>((resolve) => { resolveDone = resolve })
  let finished = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const stop = () => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    processor.onaudioprocess = null
    processor.disconnect()
    source.disconnect()
    stream.getTracks().forEach((t) => t.stop())
    void ctx.close().catch(() => undefined)
    const joined = new Float32Array(length)
    let at = 0
    for (const c of chunks) { joined.set(c, at); at += c.length }
    resolveDone(encodeWav(toPcm16(resampleTo16k(joined, ctx.sampleRate))))
  }

  processor.onaudioprocess = (e) => {
    if (finished || length >= limit) return
    // The last piece is cut to the limit: a clip never runs past maxSeconds.
    const incoming = e.inputBuffer.getChannelData(0)
    const piece = incoming.slice(0, Math.min(incoming.length, limit - length))
    chunks.push(piece)
    length += piece.length
    if (length >= limit) stop()
  }
  source.connect(processor)
  processor.connect(ctx.destination)
  void ctx.resume?.().catch(() => undefined)
  timer = setTimeout(stop, maxSeconds * 1000)
  return { stop, done }
}
