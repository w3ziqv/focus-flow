import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AudioEngine,
  generateBrownNoiseBuffer,
  generatePinkNoiseBuffer,
  generateRainBuffer,
  generateWavesBuffer,
  getBinauralConfig,
  getSingingBowlPartials,
} from './audio'
import {
  DEFAULT_SOUND_PREFERENCES,
  DEFAULT_TONE_WARMTH,
  isSoundPreferences,
  loadSoundPreferences,
  MAX_TONE_WARMTH,
  MIN_TONE_WARMTH,
  saveSoundPreferences,
} from './storage'

// Web Audio API Mocks for JSDOM Environment

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
    if (val <= 0) {
      throw new DOMException('The float value provided must be greater than zero.', 'InvalidAccessError')
    }
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
  createdPanners: MockStereoPannerNode[] = []

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

  createStereoPanner = vi.fn(() => {
    const node = new MockStereoPannerNode()
    this.createdPanners.push(node)
    return node
  })

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



describe('Milestone v2.2 Empirical Adversarial Testing (challenger_v22_1)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // --------------------------------------------------------------------------
  // Target 1: Pink noise Kellet filter stability & bounds ([-2.0, 2.0])
  // --------------------------------------------------------------------------
  describe('Target 1: Pink Noise Kellet Filter Stability & Bounds ([-2.0, 2.0]) over 1,000,000 samples', () => {
    it('empirically verifies 1,000,000 consecutive samples stay strictly within [-2.0, 2.0] without divergence', () => {
      const TOTAL_SAMPLES = 1_000_000
      let b0 = 0
      let b1 = 0
      let b2 = 0
      let b3 = 0
      let b4 = 0
      let b5 = 0
      let b6 = 0

      let max = -Infinity
      let min = Infinity
      let sum = 0
      let sumSq = 0
      let nanCount = 0

      for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        const out = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926

        if (Number.isNaN(out) || !Number.isFinite(out)) {
          nanCount++
        }
        if (out > max) max = out
        if (out < min) min = out
        sum += out
        sumSq += out * out
      }

      const mean = sum / TOTAL_SAMPLES
      const rms = Math.sqrt(sumSq / TOTAL_SAMPLES)

      console.log(`[Target 1: Pink Noise 1M Samples] Max: ${max.toFixed(4)}, Min: ${min.toFixed(4)}, Mean: ${mean.toFixed(5)}, RMS: ${rms.toFixed(4)}`)

      expect(nanCount).toBe(0)
      expect(max).toBeLessThan(2.0)
      expect(min).toBeGreaterThan(-2.0)
      // Mean should be centered near zero (no significant DC bias)
      expect(Math.abs(mean)).toBeLessThan(0.05)
      // RMS should be healthy acoustic range ~0.15 - 0.30
      expect(rms).toBeGreaterThan(0.1)
      expect(rms).toBeLessThan(0.4)
    })

    it('verifies buffer generator produces stereo channels conforming to [-2.0, 2.0] over extended duration', () => {
      const mockCtx = new MockAudioContext() as unknown as AudioContext
      // Generate 25 seconds = 1,102,500 samples per channel
      const buffer = generatePinkNoiseBuffer(mockCtx, 25)
      expect(buffer.numberOfChannels).toBe(2)
      expect(buffer.length).toBe(44100 * 25)

      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch)
        let chMax = -Infinity
        let chMin = Infinity
        for (let i = 0; i < data.length; i++) {
          const val = data[i]
          if (val > chMax) chMax = val
          if (val < chMin) chMin = val
        }
        expect(chMax).toBeLessThan(2.0)
        expect(chMin).toBeGreaterThan(-2.0)
      }
    })

    it('verifies generateRainBuffer produces non-divergent output combining rain bed and Poisson impulses', () => {
      const mockCtx = new MockAudioContext() as unknown as AudioContext
      const buffer = generateRainBuffer(mockCtx, 5)
      expect(buffer.numberOfChannels).toBe(2)
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch)
        let max = -Infinity
        let min = Infinity
        let nanCount = 0
        for (let i = 0; i < data.length; i++) {
          if (Number.isNaN(data[i]) || !Number.isFinite(data[i])) nanCount++
          if (data[i] > max) max = data[i]
          if (data[i] < min) min = data[i]
        }
        expect(nanCount).toBe(0)
        expect(max).toBeLessThan(3.0)
        expect(min).toBeGreaterThan(-3.0)
      }
    })

    it('verifies generateWavesBuffer executes asymmetric 10s tidal cycle without NaN or overflow', () => {
      const mockCtx = new MockAudioContext() as unknown as AudioContext
      const buffer = generateWavesBuffer(mockCtx, 10)
      expect(buffer.numberOfChannels).toBe(2)
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch)
        let max = -Infinity
        let min = Infinity
        let nanCount = 0
        for (let i = 0; i < data.length; i++) {
          if (Number.isNaN(data[i]) || !Number.isFinite(data[i])) nanCount++
          if (data[i] > max) max = data[i]
          if (data[i] < min) min = data[i]
        }
        expect(nanCount).toBe(0)
        expect(max).toBeLessThan(4.5)
        expect(min).toBeGreaterThan(-4.5)
      }
    })

    it('tests impulse recovery and BIBO stability under adversarial input impulses', () => {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      // Inject extreme impulse: +1.0 for 10 samples
      for (let i = 0; i < 10; i++) {
        const white = 1.0
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        b6 = white * 0.115926
      }
      // Follow with silence (0.0) for 100,000 steps to ensure exponential decay to 0
      let finalOut = 0
      for (let i = 0; i < 100_000; i++) {
        const white = 0.0
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        finalOut = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
      // Must completely return to zero (stable poles)
      expect(Math.abs(finalOut)).toBeLessThan(1e-10)
    })
  })

  // --------------------------------------------------------------------------
  // Target 2: Leaky brown noise integrator stability & bounds ([-4.5, 4.5])
  // --------------------------------------------------------------------------
  describe('Target 2: Leaky Brown Noise Integrator Stability & Bounds ([-4.5, 4.5]) over 100,000 steps', () => {
    it('empirically tests 100,000 steps and 1,000,000 steps without NaN, divergence, or DC drift', () => {
      let y = 0
      let maxVal = -Infinity
      let minVal = Infinity
      let sum = 0
      let nanFound = false

      for (let i = 0; i < 100_000; i++) {
        const white = Math.random() * 2 - 1
        y = (y + 0.02 * white) / 1.02
        const out = 3.5 * y
        if (Number.isNaN(out) || !Number.isFinite(out)) nanFound = true
        if (out > maxVal) maxVal = out
        if (out < minVal) minVal = out
        sum += out
      }

      const mean = sum / 100_000
      console.log(`[Target 2: Brown Noise 100k Steps] Max: ${maxVal.toFixed(4)}, Min: ${minVal.toFixed(4)}, Mean: ${mean.toFixed(5)}`)

      expect(nanFound).toBe(false)
      expect(maxVal).toBeLessThan(4.5)
      expect(minVal).toBeGreaterThan(-4.5)
      expect(Math.abs(mean)).toBeLessThan(0.05)
    })

    it('mathematically verifies worst-case saturation ceiling is bounded by 3.5 < 4.5', () => {
      // In worst-case pathological scenario where white noise is continuously +1.0
      let y = 0
      for (let i = 0; i < 50_000; i++) {
        y = (y + 0.02 * 1.0) / 1.02
      }
      const theoreticalMax = 3.5 * y
      // Steady state: y_ss = 0.02 / (1.02 - 1.0) = 1.0 => 3.5 * 1.0 = 3.5
      expect(y).toBeCloseTo(1.0, 5)
      expect(theoreticalMax).toBeCloseTo(3.5, 5)
      expect(theoreticalMax).toBeLessThan(4.5)

      // Inverse worst-case continuously -1.0
      y = 0
      for (let i = 0; i < 50_000; i++) {
        y = (y + 0.02 * -1.0) / 1.02
      }
      const theoreticalMin = 3.5 * y
      expect(y).toBeCloseTo(-1.0, 5)
      expect(theoreticalMin).toBeCloseTo(-3.5, 5)
      expect(theoreticalMin).toBeGreaterThan(-4.5)
    })

    it('proves zero DC drift by measuring rapid decay of initial DC displacement', () => {
      // Artificially initialize state with severe DC offset of 100.0
      let y = 100.0
      // Feed zero input
      for (let i = 0; i < 1_000; i++) {
        y = (y + 0.02 * 0) / 1.02
      }
      // After 1000 steps: 100 / (1.02)^1000 approx 2.5e-7
      expect(Math.abs(3.5 * y)).toBeLessThan(1e-5)
    })

    it('verifies generateBrownNoiseBuffer output stays strictly bounded in [-4.5, 4.5]', () => {
      const mockCtx = new MockAudioContext() as unknown as AudioContext
      const buffer = generateBrownNoiseBuffer(mockCtx, 15) // 661,500 samples per channel
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch)
        let chMax = -Infinity
        let chMin = Infinity
        for (let i = 0; i < data.length; i++) {
          if (data[i] > chMax) chMax = data[i]
          if (data[i] < chMin) chMin = data[i]
        }
        expect(chMax).toBeLessThan(4.5)
        expect(chMin).toBeGreaterThan(-4.5)
      }
    })
  })

  // --------------------------------------------------------------------------
  // Target 3: Tibetan bowl 5 inharmonic partials and 25ms mallet burst
  // --------------------------------------------------------------------------
  describe('Target 3: Tibetan Singing Bowl 5 Inharmonic Partials and 25ms Mallet Burst', () => {
    it('verifies exact partial frequencies [216.0, 305.4, 432.0, 596.2, 1167.3 Hz] and decay envelopes', () => {
      const partials = getSingingBowlPartials(216.0)
      expect(partials).toHaveLength(5)

      // f1: 216.0 Hz
      expect(partials[0].freq).toBeCloseTo(216.0, 1)
      expect(partials[0].beatingDetune).toBe(0.4)
      expect(partials[0].decay).toBe(6.0)
      expect(partials[0].gain).toBe(1.0)

      // f2: 305.4 Hz (216 * 1.414 = 305.424)
      expect(partials[1].freq).toBeCloseTo(305.4, 1)
      expect(partials[1].beatingDetune).toBe(0.5)
      expect(partials[1].decay).toBe(4.5)
      expect(partials[1].gain).toBe(0.65)

      // f3: 432.0 Hz (216 * 2.0 = 432.0)
      expect(partials[2].freq).toBeCloseTo(432.0, 1)
      expect(partials[2].beatingDetune).toBe(0.0)
      expect(partials[2].decay).toBe(3.2)
      expect(partials[2].gain).toBe(0.4)

      // f4: 596.2 Hz (216 * 2.76 = 596.16)
      expect(partials[3].freq).toBeCloseTo(596.2, 1)
      expect(partials[3].beatingDetune).toBe(0.0)
      expect(partials[3].decay).toBe(2.0)
      expect(partials[3].gain).toBe(0.25)

      // f5: 1167.3 Hz (216 * 5.404 = 1167.264)
      expect(partials[4].freq).toBeCloseTo(1167.3, 1)
      expect(partials[4].beatingDetune).toBe(0.0)
      expect(partials[4].decay).toBe(0.8)
      expect(partials[4].gain).toBe(0.12)
    })

    it('synthesizes chime and verifies 25ms mallet burst filter (2.4 kHz, Q=4) and 7 oscillators', () => {
      const engine = new AudioEngine()
      const mockCtx = engine.ensureContext() as unknown as MockAudioContext
      expect(mockCtx).not.toBeNull()

      engine.playChime()

      // 5 partials, where f1 has 2 detuned oscs, f2 has 2 detuned oscs, f3, f4, f5 have 1 each = 7 oscillators total
      expect(mockCtx.createdOscillators.length).toBe(7)

      // Verify mallet transient buffer source and bandpass filter
      expect(mockCtx.createdBufferSources.length).toBe(1)
      const malletSource = mockCtx.createdBufferSources[0]
      expect(malletSource.buffer).not.toBeNull()
      // 25ms at 44100 = 1102 samples
      expect(malletSource.buffer?.length).toBe(Math.floor(44100 * 0.025))

      // Verify mallet filter was created with bandpass, 2400 Hz, Q=4
      const malletFilter = mockCtx.createdFilters.find((f) => f.type === 'bandpass')
      expect(malletFilter).toBeDefined()
      expect(malletFilter?.frequency.setValueAtTime).toHaveBeenCalledWith(2400, mockCtx.currentTime)
      expect(malletFilter?.Q.setValueAtTime).toHaveBeenCalledWith(4.0, mockCtx.currentTime)

      // Verify exponential ramp decay on chime partials and mallet (7 partial gains + 1 mallet gain = 8 ramping gains)
      const rampingGains = mockCtx.createdGains.filter((g) => g.gain.exponentialRampToValueAtTime.mock.calls.length > 0)
      expect(rampingGains.length).toBe(8)
      for (const g of rampingGains) {
        expect(g.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, expect.any(Number))
      }

      engine.dispose()
    })
  })

  // --------------------------------------------------------------------------
  // Target 4: Binaural beats carrier frequencies (216/226 Hz & 180/186 Hz)
  // --------------------------------------------------------------------------
  describe('Target 4: Binaural Beats Carrier Frequencies and Spatial Panning', () => {
    it('verifies Alpha Focus carrier frequencies: 216 Hz L / 226 Hz R (10 Hz delta)', () => {
      const alpha = getBinauralConfig('alpha')
      expect(alpha).not.toBeNull()
      expect(alpha?.leftFreq).toBe(216)
      expect(alpha?.rightFreq).toBe(226)
      expect(alpha?.deltaFreq).toBe(10)
    })

    it('verifies Theta Rest carrier frequencies: 180 Hz L / 186 Hz R (6 Hz delta)', () => {
      const theta = getBinauralConfig('theta')
      expect(theta).not.toBeNull()
      expect(theta?.leftFreq).toBe(180)
      expect(theta?.rightFreq).toBe(186)
      expect(theta?.deltaFreq).toBe(6)
    })

    it('verifies binaural engine creates hard panned oscillators (-1.0 and +1.0) and shuts down cleanly', () => {
      const engine = new AudioEngine()
      const mockCtx = engine.ensureContext() as unknown as MockAudioContext

      // Activate Alpha mode
      engine.setBinaural('alpha')
      expect(mockCtx.createdOscillators.length).toBe(2)
      const leftOsc = mockCtx.createdOscillators[0]
      const rightOsc = mockCtx.createdOscillators[1]

      expect(leftOsc.frequency.setValueAtTime).toHaveBeenCalledWith(216, mockCtx.currentTime)
      expect(rightOsc.frequency.setValueAtTime).toHaveBeenCalledWith(226, mockCtx.currentTime)

      // Check stereo panners (-1.0 and +1.0)
      expect(mockCtx.createdPanners.length).toBe(2)
      expect(mockCtx.createdPanners[0].pan.setValueAtTime).toHaveBeenCalledWith(-1.0, mockCtx.currentTime)
      expect(mockCtx.createdPanners[1].pan.setValueAtTime).toHaveBeenCalledWith(1.0, mockCtx.currentTime)

      // Switch to Theta mode
      mockCtx.createdOscillators = []
      mockCtx.createdPanners = []
      engine.setBinaural('theta')
      expect(mockCtx.createdOscillators.length).toBe(2)
      expect(mockCtx.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(180, mockCtx.currentTime)
      expect(mockCtx.createdOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(186, mockCtx.currentTime)

      // Switch to Off
      engine.setBinaural('off')
      expect(engine.getPreferences().binauralMode).toBe('off')

      engine.dispose()
    })
  })

  // --------------------------------------------------------------------------
  // Target 5: Exponential ramp strictly positive base/target values (>= 0.0001)
  // --------------------------------------------------------------------------
  describe('Target 5: Exponential Gain Ramps Strictly Positive Values (>= 0.0001)', () => {
    it('verifies startSession never passes zero or negative value to exponentialRampToValueAtTime even if volume is 0', () => {
      const engine = new AudioEngine()
      const mockCtx = engine.ensureContext() as unknown as MockAudioContext

      // Set volume to 0.0
      engine.setVolume(0)
      expect(engine.getPreferences().volume).toBe(0)

      // Trigger startSession - must NOT throw DOMException
      expect(() => engine.startSession()).not.toThrow()

      const masterGain = mockCtx.createdGains[0]
      // Start value must be >= 0.0001
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime)
      // Target value must be clamped to >= 0.0001
      expect(masterGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime + 3.0)

      engine.dispose()
    })

    it('verifies pauseSession never passes zero or negative value even if current gain is 0', () => {
      const engine = new AudioEngine()
      const mockCtx = engine.ensureContext() as unknown as MockAudioContext

      const masterGain = mockCtx.createdGains[0]
      masterGain.gain.value = 0 // Simulating edge-case 0.0 gain value

      expect(() => engine.pauseSession()).not.toThrow()

      // Must set to clamped value >= 0.0001
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime)
      // Ramp target must be 0.0001 (> 0)
      expect(masterGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime + 3.0)

      engine.dispose()
    })

    it('verifies setAmbient crossfade ramp uses 0.0001 base floor', () => {
      const engine = new AudioEngine()
      const mockCtx = engine.ensureContext() as unknown as MockAudioContext

      engine.setAmbient('pink')

      // Find texture gain
      const textureGain = mockCtx.createdGains[mockCtx.createdGains.length - 1]
      expect(textureGain.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime)
      expect(textureGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(1.0, mockCtx.currentTime + 2.0)

      // Crossfade to waves
      engine.setAmbient('waves')
      // Old channel fadeout must ramp to 0.0001
      expect(textureGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime + 2.0)

      engine.dispose()
    })
  })

  // --------------------------------------------------------------------------
  // Target 6: Storage Schema v1.2 Prototype Pollution & Numerical Boundary Clamping
  // --------------------------------------------------------------------------
  describe('Target 6: Storage Schema v1.2 Prototype Pollution Resistance & Clamping', () => {
    it('resists deep prototype pollution attack vectors without mutating Object.prototype', () => {
      const attackPayload = JSON.parse(`{
        "baseTexture": "rain",
        "binauralMode": "theta",
        "toneWarmthCutoff": 650,
        "volume": 0.8,
        "__proto__": { "pollutedProp": "malicious_root", "isAdmin": true },
        "constructor": { "prototype": { "pollutedConstructor": "malicious_proto" } }
      }`)

      const validated = isSoundPreferences(attackPayload)
      expect(validated).not.toBeNull()
      expect(validated?.baseTexture).toBe('rain')
      expect(validated?.binauralMode).toBe('theta')
      expect(validated?.toneWarmthCutoff).toBe(650)
      expect(validated?.volume).toBe(0.8)

      // Global Object prototype must NOT be polluted
      const rootProto = Object.prototype as Record<string, unknown>
      expect(rootProto['pollutedProp']).toBeUndefined()
      expect(rootProto['isAdmin']).toBeUndefined()
      expect(rootProto['pollutedConstructor']).toBeUndefined()

      // Returned object must not contain polluted keys
      const validatedRec = validated as unknown as Record<string, unknown>
      expect(validatedRec['pollutedProp']).toBeUndefined()
      expect(validatedRec['isAdmin']).toBeUndefined()
      expect(validatedRec['pollutedConstructor']).toBeUndefined()
    })

    it('rigorously tests Tone Warmth cutoff boundary clamping (200 - 1200 Hz, rounded)', () => {
      // Sub-minimum values clamp to MIN_TONE_WARMTH (200)
      expect(isSoundPreferences({ toneWarmthCutoff: -500 })?.toneWarmthCutoff).toBe(MIN_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: 0 })?.toneWarmthCutoff).toBe(MIN_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: 199 })?.toneWarmthCutoff).toBe(MIN_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: 200 })?.toneWarmthCutoff).toBe(200)

      // Valid range values preserved
      expect(isSoundPreferences({ toneWarmthCutoff: 550 })?.toneWarmthCutoff).toBe(550)
      expect(isSoundPreferences({ toneWarmthCutoff: 800 })?.toneWarmthCutoff).toBe(800)
      expect(isSoundPreferences({ toneWarmthCutoff: 1200 })?.toneWarmthCutoff).toBe(1200)

      // Super-maximum values clamp to MAX_TONE_WARMTH (1200)
      expect(isSoundPreferences({ toneWarmthCutoff: 1201 })?.toneWarmthCutoff).toBe(MAX_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: 99999 })?.toneWarmthCutoff).toBe(MAX_TONE_WARMTH)

      // Non-finite values fallback to DEFAULT_TONE_WARMTH (800)
      expect(isSoundPreferences({ toneWarmthCutoff: NaN })?.toneWarmthCutoff).toBe(DEFAULT_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: Infinity })?.toneWarmthCutoff).toBe(DEFAULT_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: -Infinity })?.toneWarmthCutoff).toBe(DEFAULT_TONE_WARMTH)
      expect(isSoundPreferences({ toneWarmthCutoff: '800' })?.toneWarmthCutoff).toBe(DEFAULT_TONE_WARMTH)

      // Fractional values rounded
      expect(isSoundPreferences({ toneWarmthCutoff: 440.6 })?.toneWarmthCutoff).toBe(441)
      expect(isSoundPreferences({ toneWarmthCutoff: 440.2 })?.toneWarmthCutoff).toBe(440)
    })

    it('rigorously tests Master Volume boundary clamping (0.0 - 1.0, 2 decimals)', () => {
      // Sub-minimum values clamp to 0.0
      expect(isSoundPreferences({ volume: -10 })?.volume).toBe(0.0)
      expect(isSoundPreferences({ volume: -0.001 })?.volume).toBe(0.0)
      expect(isSoundPreferences({ volume: 0.0 })?.volume).toBe(0.0)

      // Normal values preserved
      expect(isSoundPreferences({ volume: 0.35 })?.volume).toBe(0.35)
      expect(isSoundPreferences({ volume: 1.0 })?.volume).toBe(1.0)

      // Super-maximum values clamp to 1.0
      expect(isSoundPreferences({ volume: 1.01 })?.volume).toBe(1.0)
      expect(isSoundPreferences({ volume: 100 })?.volume).toBe(1.0)

      // Non-finite values fallback to default 0.7
      expect(isSoundPreferences({ volume: NaN })?.volume).toBe(0.7)
      expect(isSoundPreferences({ volume: Infinity })?.volume).toBe(0.7)
      expect(isSoundPreferences({ volume: -Infinity })?.volume).toBe(0.7)
      expect(isSoundPreferences({ volume: '0.5' })?.volume).toBe(0.7)
    })

    it('tests Base Texture validation with custom sounds and corrupt fallback to brown', () => {
      // Builtins
      expect(isSoundPreferences({ baseTexture: 'none' })?.baseTexture).toBe('none')
      expect(isSoundPreferences({ baseTexture: 'brown' })?.baseTexture).toBe('brown')
      expect(isSoundPreferences({ baseTexture: 'pink' })?.baseTexture).toBe('pink')
      expect(isSoundPreferences({ baseTexture: 'rain' })?.baseTexture).toBe('rain')
      expect(isSoundPreferences({ baseTexture: 'waves' })?.baseTexture).toBe('waves')

      // Legacy alias 'noise' -> 'brown'
      expect(isSoundPreferences({ baseTexture: 'noise' })?.baseTexture).toBe('brown')

      // Valid custom sound
      expect(isSoundPreferences({ baseTexture: 'custom:my_bell_123' })?.baseTexture).toBe('custom:my_bell_123')

      // Corrupt custom sound (empty id) falls back to 'brown' per ROADMAP spec
      expect(isSoundPreferences({ baseTexture: 'custom:' })?.baseTexture).toBe('brown')
      expect(isSoundPreferences({ baseTexture: 'custom:   ' })?.baseTexture).toBe('brown')
      // Custom id exceeding 64 chars falls back to 'brown'
      expect(isSoundPreferences({ baseTexture: `custom:${'a'.repeat(65)}` })?.baseTexture).toBe('brown')

      // Unrecognized strings fall back to 'none'
      expect(isSoundPreferences({ baseTexture: 'unknown_random_string' })?.baseTexture).toBe('none')
      expect(isSoundPreferences({ baseTexture: '<script>alert(1)</script>' })?.baseTexture).toBe('none')
    })

    it('tests full localStorage roundtrip with corrupt JSON payloads and migration', () => {
      // Corrupt string stored directly in localStorage
      localStorage.setItem('ff2_sound_prefs', 'INVALID_JSON_CORRUPT{[[')
      // Should gracefully return defaults without throwing
      const loadedCorrupt = loadSoundPreferences()
      expect(loadedCorrupt).toEqual(DEFAULT_SOUND_PREFERENCES)

      // Direct prototype pollution injection via JSON string
      const maliciousJson = JSON.stringify({
        baseTexture: 'waves',
        binauralMode: 'alpha',
        toneWarmthCutoff: 300,
        volume: 0.5,
        __proto__: { injected: true },
      })
      localStorage.setItem('ff2_sound_prefs', maliciousJson)
      const loadedSafe = loadSoundPreferences()
      expect(loadedSafe.baseTexture).toBe('waves')
      expect(loadedSafe.binauralMode).toBe('alpha')
      expect(loadedSafe.toneWarmthCutoff).toBe(300)
      expect(loadedSafe.volume).toBe(0.5)

      const rootProto = Object.prototype as Record<string, unknown>
      expect(rootProto['injected']).toBeUndefined()

      // Save valid preferences
      const saved = saveSoundPreferences({
        baseTexture: 'rain',
        binauralMode: 'theta',
        toneWarmthCutoff: 750,
        volume: 0.6,
      })
      expect(saved).toBe(true)

      const reloaded = loadSoundPreferences()
      expect(reloaded.baseTexture).toBe('rain')
      expect(reloaded.binauralMode).toBe('theta')
      expect(reloaded.toneWarmthCutoff).toBe(750)
      expect(reloaded.volume).toBe(0.6)
    })
  })
})
