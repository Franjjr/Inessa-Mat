/* Test-only Web Audio mock. Strict like real browsers: invalid automation (exponential ramp to 0, non-finite values,
   negative times), starting a source twice or stopping before start all throw, so recipes that would crash on
   Safari/Chrome fail the tests. Records every node, connection and automation event for assertions. */

export interface ParamEvent {
  type: 'value' | 'set' | 'linear' | 'exp' | 'target' | 'cancel'
  value: number
  time: number
}

function finite(...xs: number[]): void {
  for (const x of xs) if (typeof x !== 'number' || !Number.isFinite(x)) throw new TypeError(`Non-finite value: ${x}`)
}

export class MockParam {
  readonly name: string
  readonly owner: MockNode
  readonly initial: number
  events: ParamEvent[] = []
  private v: number

  constructor(owner: MockNode, name: string, initial: number) {
    this.owner = owner
    this.name = name
    this.initial = initial
    this.v = initial
  }

  get value(): number {
    return this.v
  }

  set value(x: number) {
    finite(x)
    this.v = x
    this.events.push({ type: 'value', value: x, time: this.owner.ctx.currentTime })
  }

  setValueAtTime(x: number, t: number): this {
    finite(x, t)
    if (t < 0) throw new RangeError('negative time')
    this.events.push({ type: 'set', value: x, time: t })
    this.v = x
    return this
  }

  linearRampToValueAtTime(x: number, t: number): this {
    finite(x, t)
    if (t < 0) throw new RangeError('negative time')
    this.events.push({ type: 'linear', value: x, time: t })
    return this
  }

  exponentialRampToValueAtTime(x: number, t: number): this {
    finite(x, t)
    if (x <= 0) throw new RangeError('exponentialRampToValueAtTime: value must be > 0')
    if (t < 0) throw new RangeError('negative time')
    this.events.push({ type: 'exp', value: x, time: t })
    return this
  }

  setTargetAtTime(x: number, t: number, tc: number): this {
    finite(x, t, tc)
    if (t < 0 || tc < 0) throw new RangeError('negative time/timeConstant')
    this.events.push({ type: 'target', value: x, time: t })
    return this
  }

  cancelScheduledValues(t: number): this {
    finite(t)
    this.events.push({ type: 'cancel', value: Number.NaN, time: t })
    return this
  }

  /** Largest value this param is ever asked to reach (the default is ignored when overwritten right away). */
  max(): number {
    const base = this.events[0]?.type === 'value' ? -Infinity : this.initial
    return Math.max(base, ...this.events.filter((e) => e.type !== 'cancel').map((e) => e.value))
  }
}

export class MockNode {
  readonly ctx: MockAudioContext
  readonly kind: string
  outputs = new Set<unknown>()
  connects = 0
  disconnects = 0

  constructor(ctx: MockAudioContext, kind: string) {
    this.ctx = ctx
    this.kind = kind
    ctx.nodes.push(this)
  }

  connect<T>(dest: T): T {
    if (!dest) throw new TypeError('connect() needs a destination')
    if (this.ctx.state === 'closed') throw new Error('InvalidStateError: context closed')
    this.outputs.add(dest)
    this.connects += 1
    return dest
  }

  disconnect(): void {
    this.outputs.clear()
    this.disconnects += 1
  }

  params(): MockParam[] {
    return Object.values(this).filter((x): x is MockParam => x instanceof MockParam)
  }
}

export class MockGain extends MockNode {
  gain: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'gain')
    this.gain = new MockParam(this, 'gain', 1)
  }
}

export class MockBiquad extends MockNode {
  type: BiquadFilterType = 'lowpass'
  frequency: MockParam
  Q: MockParam
  gain: MockParam
  detune: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'biquad')
    this.frequency = new MockParam(this, 'frequency', 350)
    this.Q = new MockParam(this, 'Q', 1)
    this.gain = new MockParam(this, 'gain', 0)
    this.detune = new MockParam(this, 'detune', 0)
  }
}

export class MockPanner extends MockNode {
  pan: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'panner')
    this.pan = new MockParam(this, 'pan', 0)
  }
}

export class MockCompressor extends MockNode {
  threshold: MockParam
  knee: MockParam
  ratio: MockParam
  attack: MockParam
  release: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'compressor')
    this.threshold = new MockParam(this, 'threshold', -24)
    this.knee = new MockParam(this, 'knee', 30)
    this.ratio = new MockParam(this, 'ratio', 12)
    this.attack = new MockParam(this, 'attack', 0.003)
    this.release = new MockParam(this, 'release', 0.25)
  }
}

export class MockConvolver extends MockNode {
  buffer: MockBuffer | null = null
  constructor(ctx: MockAudioContext) {
    super(ctx, 'convolver')
  }
}

export class MockAnalyser extends MockNode {
  fftSize = 2048
  constructor(ctx: MockAudioContext) {
    super(ctx, 'analyser')
  }
  getFloatTimeDomainData(a: Float32Array): void {
    a.fill(0)
  }
  getByteTimeDomainData(a: Uint8Array): void {
    a.fill(128)
  }
}

export class MockSource extends MockNode {
  startTime: number | null = null
  stopTime: number | null = null
  ended = false
  onended: (() => void) | null = null

  start(when = 0): void {
    finite(when)
    if (this.startTime !== null) throw new Error('InvalidStateError: start() called twice')
    if (when < 0) throw new RangeError('negative start')
    this.startTime = when
  }

  stop(when = 0): void {
    finite(when)
    if (this.startTime === null) throw new Error('InvalidStateError: stop() before start()')
    if (when < 0) throw new RangeError('negative stop')
    this.stopTime = when
  }
}

export class MockOscillator extends MockSource {
  type: OscillatorType = 'sine'
  frequency: MockParam
  detune: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'oscillator')
    this.frequency = new MockParam(this, 'frequency', 440)
    this.detune = new MockParam(this, 'detune', 0)
  }
}

export class MockBufferSource extends MockSource {
  buffer: MockBuffer | null = null
  loop = false
  playbackRate: MockParam
  constructor(ctx: MockAudioContext) {
    super(ctx, 'buffer-source')
    this.playbackRate = new MockParam(this, 'playbackRate', 1)
  }
}

export class MockBuffer {
  readonly numberOfChannels: number
  readonly length: number
  readonly sampleRate: number
  private data: Float32Array[]
  constructor(channels: number, length: number, sampleRate: number) {
    if (channels < 1 || length < 1) throw new RangeError('bad buffer size')
    this.numberOfChannels = channels
    this.length = length
    this.sampleRate = sampleRate
    this.data = Array.from({ length: channels }, () => new Float32Array(length))
  }
  get duration(): number {
    return this.length / this.sampleRate
  }
  getChannelData(c: number): Float32Array {
    return this.data[c]
  }
}

export class MockAudioContext {
  static instances: MockAudioContext[] = []
  currentTime = 0
  sampleRate = 48000
  state: 'suspended' | 'running' | 'closed' = 'suspended'
  onstatechange: (() => void) | null = null
  nodes: MockNode[] = []
  destination: MockNode
  /** When false, resume() leaves the context suspended (simulates a call outside a valid gesture). */
  allowResume = true

  constructor() {
    this.destination = new MockNode(this, 'destination')
    MockAudioContext.instances.push(this)
  }

  private setState(s: 'suspended' | 'running' | 'closed'): void {
    if (this.state === s) return
    this.state = s
    this.onstatechange?.()
  }

  resume(): Promise<void> {
    if (this.state === 'closed') return Promise.reject(new Error('closed'))
    if (this.allowResume) this.setState('running')
    return Promise.resolve()
  }

  suspend(): Promise<void> {
    if (this.state !== 'closed') this.setState('suspended')
    return Promise.resolve()
  }

  close(): Promise<void> {
    this.setState('closed')
    return Promise.resolve()
  }

  createGain() { return new MockGain(this) }
  createBiquadFilter() { return new MockBiquad(this) }
  createStereoPanner() { return new MockPanner(this) }
  createDynamicsCompressor() { return new MockCompressor(this) }
  createConvolver() { return new MockConvolver(this) }
  createAnalyser() { return new MockAnalyser(this) }
  createOscillator() { return new MockOscillator(this) }
  createBufferSource() { return new MockBufferSource(this) }
  createBuffer(channels: number, length: number, sampleRate: number) { return new MockBuffer(channels, length, sampleRate) }

  sources(): MockSource[] {
    return this.nodes.filter((n): n is MockSource => n instanceof MockSource)
  }

  gains(): MockGain[] {
    return this.nodes.filter((n): n is MockGain => n instanceof MockGain)
  }

  /** Advance the audio clock and fire 'ended' for every source whose stop time has passed. */
  advance(seconds: number): void {
    this.currentTime += seconds
    for (const s of this.sources()) {
      if (!s.ended && s.stopTime !== null && s.stopTime <= this.currentTime) {
        s.ended = true
        s.onended?.()
      }
    }
  }
}

/** Install the mock as window.AudioContext (and webkitAudioContext). Returns an uninstall function. */
export function installMockAudio(): () => void {
  const w = window as unknown as Record<string, unknown>
  const g = globalThis as unknown as Record<string, unknown>
  const prev = { w: w.AudioContext, g: g.AudioContext }
  MockAudioContext.instances = []
  w.AudioContext = MockAudioContext
  g.AudioContext = MockAudioContext
  return () => {
    w.AudioContext = prev.w
    g.AudioContext = prev.g
  }
}

export function lastContext(): MockAudioContext {
  const c = MockAudioContext.instances[MockAudioContext.instances.length - 1]
  if (!c) throw new Error('no AudioContext was created')
  return c
}
