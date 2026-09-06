import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  audio,
  AudioEngine,
  generateBrownNoiseBuffer,
  generatePinkNoiseBuffer,
  generateRainBuffer,
  generateWavesBuffer,
} from './audio'

/* ========================================================================== */
/* Web Audio API Mocks for JSDOM Environment                                  */
/* ========================================================================== */

class MockAudioParam {
  value: number
  constructor(initial = 0) {
    this.value = initial
  }
  setValueAtTime = vi.fn((val: number) => {
    this.value = val
    return this
  })
  linearRampToValueAtTime = vi.fn((val: number) => {
    this.value = val
    return this
  })
  exponentialRampToValueAtTime = vi.fn((val: number) => {
    this.value = val
    return this
  })
  setTargetAtTime = vi.fn((val: number) => {
    this.value = val
    return this
  })
  cancelScheduledValues = vi.fn(() => this)
}

class MockAudioNode {
  connect = vi.fn((target: unknown) => target)
  disconnect = vi.fn()
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam(1)
}

class MockOscillatorNode extends MockAudioNode {
  frequency = new MockAudioParam(440)
  type: OscillatorType = 'sine'
  start = vi.fn()
  stop = vi.fn()
}

class MockBiquadFilterNode extends MockAudioNode {
  frequency = new MockAudioParam(800)
  Q = new MockAudioParam(1)
  type: BiquadFilterType = 'lowpass'
}

class MockStereoPannerNode extends MockAudioNode {
  pan = new MockAudioParam(0)
}

class MockAudioBuffer {
  numberOfChannels: number
  length: number
  sampleRate: number
  private channels: Float32Array[]

  constructor(channels: number, length: number, sampleRate: number) {
    this.numberOfChannels = channels
    this.length = length
    this.sampleRate = sampleRate
    this.channels = Array.from({ length: channels }, () => new Float32Array(length))
  }

  getChannelData(ch: number): Float32Array {
    return this.channels[ch]
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer: MockAudioBuffer | null = null
  loop = false
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state: AudioContextState = 'running'
  sampleRate = 44100
  currentTime = 0
  destination = new MockAudioNode()

  createdOscillators: MockOscillatorNode[] = []
  createdGains: MockGainNode[] = []
  createdFilters: MockBiquadFilterNode[] = []
  createdBufferSources: MockAudioBufferSourceNode[] = []

  createGain = vi.fn(() => {
    const node = new MockGainNode()
    this.createdGains.push(node)
    return node
  })

  createOscillator = vi.fn(() => {
    const node = new MockOscillatorNode()
    this.createdOscillators.push(node)
    return node
  })

  createBiquadFilter = vi.fn(() => {
    const node = new MockBiquadFilterNode()
    this.createdFilters.push(node)
    return node
  })

  createStereoPanner = vi.fn(() => new MockStereoPannerNode())

  createBufferSource = vi.fn(() => {
    const node = new MockAudioBufferSourceNode()
    this.createdBufferSources.push(node)
    return node
  })

  createBuffer = vi.fn(
    (channels: number, length: number, rate: number) => new MockAudioBuffer(channels, length, rate),
  )

  resume = vi.fn().mockResolvedValue(undefined)
  suspend = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
}

/* ========================================================================== */
/* Test Suites                                                                */
/* ========================================================================== */

describe('Web Audio Procedural Buffer Generation', () => {
  let mockCtx: AudioContext

  beforeEach(() => {
    mockCtx = new MockAudioContext() as unknown as AudioContext
  })

  it('generates stereo pink noise buffer within Kellet amplitude bounds [-2.0, 2.0]', () => {
    const buffer = generatePinkNoiseBuffer(mockCtx, 1)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.length).toBe(44100)

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      let max = -Infinity
      let min = Infinity
      for (let i = 0; i < data.length; i++) {
        if (data[i] > max) max = data[i]
        if (data[i] < min) min = data[i]
      }
      expect(max).toBeLessThan(2.0)
      expect(min).toBeGreaterThan(-2.0)
    }
  })

  it('generates stereo brown noise buffer within leaky integrator bounds [-4.5, 4.5]', () => {
    const buffer = generateBrownNoiseBuffer(mockCtx, 1)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.length).toBe(44100)

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      let max = -Infinity
      let min = Infinity
      for (let i = 0; i < data.length; i++) {
        if (data[i] > max) max = data[i]
        if (data[i] < min) min = data[i]
      }
      expect(max).toBeLessThan(4.5)
      expect(min).toBeGreaterThan(-4.5)
    }
  })

  it('generates stereo procedural soft rain buffer combining lowpass bed and Poisson droplet impulses', () => {
    const buffer = generateRainBuffer(mockCtx, 1)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.length).toBe(44100)

    const ch0 = buffer.getChannelData(0)
    let nonZero = 0
    for (let i = 0; i < ch0.length; i++) {
      if (Math.abs(ch0[i]) > 0.0001) nonZero++
    }
    expect(nonZero).toBeGreaterThan(1000)
  })

  it('generates stereo ocean waves buffer with tidal surge and ebb modulation', () => {
    const buffer = generateWavesBuffer(mockCtx, 1)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.length).toBe(44100)

    const ch0 = buffer.getChannelData(0)
    let nonZero = 0
    for (let i = 0; i < ch0.length; i++) {
      if (Math.abs(ch0[i]) > 0.0001) nonZero++
    }
    expect(nonZero).toBeGreaterThan(1000)
  })
})

describe('AudioEngine Web Audio Graph & Dynamics', () => {
  let mockCtx: MockAudioContext
  let engine: AudioEngine

  beforeEach(() => {
    mockCtx = new MockAudioContext()
    const win = window as unknown as { AudioContext?: unknown }
    win.AudioContext = class {
      constructor() {
        return mockCtx
      }
    }
    engine = new AudioEngine()
  })

  afterEach(() => {
    engine.dispose()
    const win = window as unknown as { AudioContext?: unknown }
    delete win.AudioContext
  })

  it('initializes graph with Tone Warmth lowpass filter and Master Gain', () => {
    const ctx = engine.ensureContext()
    expect(ctx).toBeDefined()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(mockCtx.createBiquadFilter).toHaveBeenCalled()

    const filter = mockCtx.createdFilters[0]
    expect(filter.type).toBe('lowpass')
    expect(filter.frequency.value).toBe(800)
  })

  it('clamps and updates master volume in AudioEngine', () => {
    engine.ensureContext()
    engine.setVolume(0.85)
    expect(engine.getPreferences().volume).toBe(0.85)

    engine.setVolume(-0.2)
    expect(engine.getPreferences().volume).toBe(0)

    engine.setVolume(1.5)
    expect(engine.getPreferences().volume).toBe(1)
  })

  it('clamps and updates Tone Warmth cutoff between 200 Hz and 1200 Hz', () => {
    engine.ensureContext()
    engine.setToneWarmth(500)
    expect(engine.getPreferences().toneWarmthCutoff).toBe(500)

    engine.setToneWarmth(50) // clamped to 200
    expect(engine.getPreferences().toneWarmthCutoff).toBe(200)

    engine.setToneWarmth(3000) // clamped to 1200
    expect(engine.getPreferences().toneWarmthCutoff).toBe(1200)
  })

  it('switches procedural ambient textures with crossfades', () => {
    engine.ensureContext()

    engine.setAmbient('brown')
    expect(mockCtx.createBufferSource).toHaveBeenCalled()
    const src1 = mockCtx.createdBufferSources[0]
    expect(src1.start).toHaveBeenCalled()
    expect(src1.loop).toBe(true)

    // Switch to pink noise triggers crossfade
    engine.setAmbient('pink')
    expect(mockCtx.createdBufferSources.length).toBe(2)
    const src2 = mockCtx.createdBufferSources[1]
    expect(src2.start).toHaveBeenCalled()

    // Switch to none stops ambient
    engine.setAmbient('none')
    expect(engine.getPreferences().baseTexture).toBe('none')
  })

  it('configures Binaural Beats entrainment for Alpha Focus (10 Hz detune)', () => {
    engine.ensureContext()
    engine.setBinaural('alpha')

    expect(engine.getPreferences().binauralMode).toBe('alpha')
    // 2 carrier oscillators created (Left 216 Hz, Right 226 Hz)
    const oscs = mockCtx.createdOscillators
    expect(oscs.length).toBeGreaterThanOrEqual(2)
    const freqs = oscs.map((o) => o.frequency.value)
    expect(freqs).toContain(216)
    expect(freqs).toContain(226)
  })

  it('configures Binaural Beats entrainment for Theta Rest (6 Hz detune)', () => {
    engine.ensureContext()
    engine.setBinaural('theta')

    expect(engine.getPreferences().binauralMode).toBe('theta')
    // 2 carrier oscillators created (Left 180 Hz, Right 186 Hz)
    const oscs = mockCtx.createdOscillators
    expect(oscs.length).toBeGreaterThanOrEqual(2)
    const freqs = oscs.map((o) => o.frequency.value)
    expect(freqs).toContain(180)
    expect(freqs).toContain(186)
  })

  it('stops and disconnects binaural oscillators on mode off', () => {
    engine.ensureContext()
    engine.setBinaural('alpha')
    const oscs = [...mockCtx.createdOscillators]

    engine.setBinaural('off')
    for (const osc of oscs) {
      expect(osc.stop).toHaveBeenCalled()
      expect(osc.disconnect).toHaveBeenCalled()
    }
  })

  it('schedules smooth 3.0s exponential gain ramps on session start and pause', () => {
    engine.ensureContext()
    const master = mockCtx.createdGains[0]

    engine.startSession()
    expect(master.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockCtx.currentTime + 3.0,
    )

    engine.pauseSession()
    expect(master.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.0001,
      mockCtx.currentTime + 3.0,
    )
  })

  it('synthesizes Tibetan Singing Bowl chime with 5 inharmonic partials and mallet transient', () => {
    engine.ensureContext()
    mockCtx.createdOscillators = []
    mockCtx.createdFilters = []

    engine.playChime()

    // 5 partials synthesized via sine oscillators
    const oscs = mockCtx.createdOscillators
    expect(oscs.length).toBeGreaterThanOrEqual(5)

    const freqs = oscs.map((o) => Math.round(o.frequency.value * 10) / 10)
    // Partial frequencies around 216, 305.4, 432, 596.2, 1167.3 Hz
    expect(freqs.some((f) => Math.abs(f - 216.0) <= 1.0)).toBe(true)
    expect(freqs.some((f) => Math.abs(f - 305.4) <= 1.0)).toBe(true)
    expect(freqs.some((f) => Math.abs(f - 432.0) <= 1.0)).toBe(true)
    expect(freqs.some((f) => Math.abs(f - 596.2) <= 1.0)).toBe(true)
    expect(freqs.some((f) => Math.abs(f - 1167.3) <= 1.0)).toBe(true)

    // Mallet bandpass filter created
    const malletFilter = mockCtx.createdFilters.find((f) => f.type === 'bandpass')
    expect(malletFilter).toBeDefined()
    expect(malletFilter?.frequency.value).toBe(2400)
    expect(malletFilter?.Q.value).toBe(4)
  })

  it('applies full preferences bundle at once', () => {
    engine.applyPreferences({
      baseTexture: 'waves',
      binauralMode: 'theta',
      toneWarmthCutoff: 650,
      volume: 0.6,
    })

    const prefs = engine.getPreferences()
    expect(prefs.baseTexture).toBe('waves')
    expect(prefs.binauralMode).toBe('theta')
    expect(prefs.toneWarmthCutoff).toBe(650)
    expect(prefs.volume).toBe(0.6)
  })

  it('disposes and disconnects all nodes cleanly', () => {
    engine.ensureContext()
    engine.setAmbient('brown')
    engine.setBinaural('alpha')

    engine.dispose()
    expect(mockCtx.close).toHaveBeenCalled()
  })
})

describe('Audio Singleton Instance', () => {
  it('exports singleton audio instance conforming to AudioEngine', () => {
    expect(audio).toBeInstanceOf(AudioEngine)
    expect(typeof audio.playChime).toBe('function')
    expect(typeof audio.chime).toBe('function')
    expect(typeof audio.setAmbient).toBe('function')
    expect(typeof audio.setBinaural).toBe('function')
    expect(typeof audio.setToneWarmth).toBe('function')
    expect(typeof audio.setVolume).toBe('function')
    expect(typeof audio.startSession).toBe('function')
    expect(typeof audio.pauseSession).toBe('function')
  })
})
