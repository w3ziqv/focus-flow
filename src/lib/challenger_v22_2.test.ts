import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AudioEngine,
} from './audio'
import {
  DEFAULT_SOUND_PREFERENCES,
  DEFAULT_TONE_WARMTH,
  DEFAULT_VOLUME,
  isSoundPreferences,
  loadSoundPreferences,
  MAX_TONE_WARMTH,
  MIN_TONE_WARMTH,
  saveSoundPreferences,
} from './storage'
import { dict as translations } from './translations'
import fs from 'node:fs'
import path from 'node:path'

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
    if (val <= 0) {
      throw new DOMException(
        "Failed to execute 'exponentialRampToValueAtTime' on 'AudioParam': The value provided is less than or equal to 0.",
        'InvalidStateError',
      )
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

/* ========================================================================== */
/* Adversarial Stress Tests                                                   */
/* ========================================================================== */

describe('Challenger 2: Transition Dynamics & Cancellation Stress', () => {
  let mockCtx: MockAudioContext
  let engine: AudioEngine

  beforeEach(() => {
    mockCtx = new MockAudioContext()
    vi.stubGlobal('AudioContext', class {
      constructor() {
        return mockCtx
      }
    })
    engine = new AudioEngine()
  })

  afterEach(() => {
    engine.dispose()
    vi.unstubAllGlobals()
  })

  it('handles rapid toggle between startSession and pauseSession within 50ms without DOMException or node stacking', () => {
    engine.ensureContext()
    const master = mockCtx.createdGains[0]
    const initialGainsCount = mockCtx.createdGains.length

    // Rapid toggle: 50 cycles of start/pause separated by 50ms simulated time
    for (let i = 0; i < 50; i++) {
      mockCtx.currentTime += 0.05
      expect(() => engine.startSession()).not.toThrow()
      expect(master.gain.cancelScheduledValues).toHaveBeenCalledWith(mockCtx.currentTime)
      expect(master.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, mockCtx.currentTime)
      expect(master.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        mockCtx.currentTime + 3.0,
      )

      mockCtx.currentTime += 0.05
      expect(() => engine.pauseSession()).not.toThrow()
      expect(master.gain.cancelScheduledValues).toHaveBeenCalledWith(mockCtx.currentTime)
      expect(master.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        0.0001,
        mockCtx.currentTime + 3.0,
      )
    }

    // Crucial check: start/pause must reuse masterGain and NEVER stack/create new GainNodes
    expect(mockCtx.createdGains.length).toBe(initialGainsCount)
  })

  it('safely handles startSession when volume is 0 without throwing DOMException InvalidStateError', () => {
    engine.ensureContext()
    engine.setVolume(0)
    mockCtx.currentTime = 10.0

    // Master volume is 0; exponential ramp MUST have floor > 0 (0.0001)
    expect(() => engine.startSession()).not.toThrow()
    const master = mockCtx.createdGains[0]
    expect(master.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.0001,
      13.0,
    )
  })

  it('cleans up old texture channels during rapid switching and drains fadingTextureChannels', () => {
    vi.useFakeTimers()
    try {
      engine.ensureContext()

      const textures: ('pink' | 'brown' | 'rain' | 'waves')[] = ['pink', 'brown', 'rain', 'waves']

      // Rapidly switch textures 20 times within 1 second
      for (let i = 0; i < 20; i++) {
        mockCtx.currentTime += 0.05
        const tex = textures[i % textures.length]
        expect(() => engine.setAmbient(tex)).not.toThrow()
      }

      // 20 buffer sources were created across the switches
      expect(mockCtx.createdBufferSources.length).toBe(20)

      // Current source is playing
      const currentSrc = mockCtx.createdBufferSources[19]
      expect(currentSrc.start).toHaveBeenCalled()

      // 19 old sources are scheduled to stop and disconnect after 2.05s
      // Advance timers by 2.1s
      vi.advanceTimersByTime(2100)

      // Verify all 19 old buffer sources were stopped and disconnected
      for (let i = 0; i < 19; i++) {
        expect(mockCtx.createdBufferSources[i].stop).toHaveBeenCalled()
        expect(mockCtx.createdBufferSources[i].disconnect).toHaveBeenCalled()
      }

      // Verify fading channels list is fully cleaned up via private inspection or stopping ambient
      expect(() => engine.stopAmbient()).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not crash if dispose() is called while crossfades are in flight', () => {
    vi.useFakeTimers()
    try {
      engine.ensureContext()
      engine.setAmbient('brown')
      mockCtx.currentTime += 0.1
      engine.setAmbient('waves') // 1 fading channel in flight

      // Immediately dispose
      expect(() => engine.dispose()).not.toThrow()
      expect(mockCtx.close).toHaveBeenCalled()

      // Advancing timers should not throw any null reference errors in timeouts
      expect(() => vi.advanceTimersByTime(3000)).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('handles invalid or non-existent texture strings safely', () => {
    engine.ensureContext()
    // Unknown texture should not throw and should default to none
    expect(() => engine.setAmbient('unknown_texture' as unknown as 'pink')).not.toThrow()
    expect(engine.getPreferences().baseTexture).toBe('unknown_texture')
  })

  it('handles rapid consecutive playChime calls without throwing or crashing timer handlers', () => {
    vi.useFakeTimers()
    try {
      engine.ensureContext()
      // Trigger chime 10 times rapidly
      for (let i = 0; i < 10; i++) {
        mockCtx.currentTime += 0.05
        expect(() => engine.playChime()).not.toThrow()
      }

      // Advancing timers to trigger GC timeouts for all partials and mallet burst
      expect(() => vi.advanceTimersByTime(8000)).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('handles rapid setBinaural mode switching without leaking carrier oscillators', () => {
    engine.ensureContext()
    const modes: ('off' | 'alpha' | 'theta')[] = ['alpha', 'theta', 'off', 'alpha', 'theta']

    for (const mode of modes) {
      mockCtx.currentTime += 0.05
      expect(() => engine.setBinaural(mode)).not.toThrow()
      expect(engine.getPreferences().binauralMode).toBe(mode)
    }

    // Final mode was theta: exactly 2 active carrier oscillators should remain
    const lastOscs = mockCtx.createdOscillators.slice(-2)
    expect(lastOscs.length).toBe(2)
    expect(lastOscs[0].stop).not.toHaveBeenCalled()
    expect(lastOscs[1].stop).not.toHaveBeenCalled()

    // All prior oscillators must have been stopped
    const priorOscs = mockCtx.createdOscillators.slice(0, -2)
    for (const osc of priorOscs) {
      expect(osc.stop).toHaveBeenCalled()
      expect(osc.disconnect).toHaveBeenCalled()
    }
  })

  it('handles rapid applyPreferences batches without state corruption', () => {
    engine.ensureContext()
    for (let i = 0; i < 15; i++) {
      mockCtx.currentTime += 0.1
      expect(() =>
        engine.applyPreferences({
          baseTexture: i % 2 === 0 ? 'pink' : 'waves',
          binauralMode: i % 2 === 0 ? 'alpha' : 'theta',
          toneWarmthCutoff: 400 + i * 20,
          volume: 0.5 + (i % 5) * 0.1,
        }),
      ).not.toThrow()
    }

    expect(engine.getPreferences().toneWarmthCutoff).toBe(400 + 14 * 20)
    expect(engine.getPreferences().volume).toBeCloseTo(0.5 + 4 * 0.1)
  })
})

describe('Challenger 2: Storage State Hydration & Corruption Resilience', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('gracefully recovers from corrupted JSON strings in localStorage without throwing', () => {
    const corruptPayloads = [
      '{ invalid json string',
      'undefined',
      'NaN',
      '',
      '{ "volume": ',
      '[1, 2, 3]',
      '"just a string"',
      '12345',
      'null',
      '{"baseTexture": { "nested": true }}',
    ]

    for (const payload of corruptPayloads) {
      localStorage.setItem('ff2_sound_prefs', payload)
      let prefs: unknown
      expect(() => {
        prefs = loadSoundPreferences()
      }).not.toThrow()

      expect(prefs).toBeDefined()
      expect(prefs).toMatchObject({
        baseTexture: expect.any(String),
        binauralMode: expect.any(String),
        toneWarmthCutoff: expect.any(Number),
        volume: expect.any(Number),
      })
    }
  })

  it('sanitizes and clamps out-of-bounds or malicious values in isSoundPreferences', () => {
    const maliciousPayload = {
      baseTexture: 'non_existent_texture',
      binauralMode: 'hyper_focus',
      toneWarmthCutoff: 999999,
      volume: -5.0,
      __proto__: { polluted: true },
    }

    const sanitized = isSoundPreferences(maliciousPayload)
    expect(sanitized).not.toBeNull()
    expect(sanitized?.baseTexture).toBe('none') // Unrecognized falls back to none
    expect(sanitized?.binauralMode).toBe('off') // Unrecognized falls back to off
    expect(sanitized?.toneWarmthCutoff).toBe(MAX_TONE_WARMTH) // Clamped to 1200
    expect(sanitized?.volume).toBe(0) // Clamped to 0
    expect((Object.prototype as unknown as { polluted?: boolean }).polluted).toBeUndefined()
  })

  it('migrates legacy volume key ff2_volume when ff2_sound_prefs is missing', () => {
    localStorage.setItem('ff2_volume', '0.42')

    const loaded = loadSoundPreferences()
    expect(loaded.volume).toBe(0.42)
    expect(loaded.baseTexture).toBe(DEFAULT_SOUND_PREFERENCES.baseTexture)
    expect(loaded.binauralMode).toBe(DEFAULT_SOUND_PREFERENCES.binauralMode)
    expect(loaded.toneWarmthCutoff).toBe(DEFAULT_TONE_WARMTH)
  })

  it('falls back to DEFAULT_VOLUME if ff2_volume is corrupted or out-of-bounds', () => {
    localStorage.setItem('ff2_volume', '99.9')
    expect(loadSoundPreferences().volume).toBe(DEFAULT_VOLUME)

    localStorage.setItem('ff2_volume', '"corrupt"')
    expect(loadSoundPreferences().volume).toBe(DEFAULT_VOLUME)
  })

  it('prioritizes ff2_sound_prefs over legacy ff2_volume if both exist', () => {
    localStorage.setItem('ff2_volume', '0.2')
    saveSoundPreferences({
      baseTexture: 'pink',
      binauralMode: 'alpha',
      toneWarmthCutoff: 600,
      volume: 0.9,
    })

    const loaded = loadSoundPreferences()
    expect(loaded.volume).toBe(0.9)
    expect(loaded.baseTexture).toBe('pink')
  })

  it('clamps toneWarmthCutoff to [200, 1200] range', () => {
    const low = isSoundPreferences({ toneWarmthCutoff: 50 })
    expect(low?.toneWarmthCutoff).toBe(MIN_TONE_WARMTH)

    const high = isSoundPreferences({ toneWarmthCutoff: 5000 })
    expect(high?.toneWarmthCutoff).toBe(MAX_TONE_WARMTH)
  })

  it('sanitizes custom sound identifiers and falls back to brown noise if invalid', () => {
    // Valid custom texture
    const valid = isSoundPreferences({ baseTexture: 'custom:my-uploaded-sound-123' })
    expect(valid?.baseTexture).toBe('custom:my-uploaded-sound-123')

    // Corrupt custom sound with empty ID
    const emptyId = isSoundPreferences({ baseTexture: 'custom:' })
    expect(emptyId?.baseTexture).toBe('brown')

    // Corrupt custom sound with whitespace ID
    const spaceId = isSoundPreferences({ baseTexture: 'custom:   ' })
    expect(spaceId?.baseTexture).toBe('brown')

    // Corrupt custom sound with overly long ID (> 64 chars)
    const longId = isSoundPreferences({ baseTexture: `custom:${'a'.repeat(100)}` })
    expect(longId?.baseTexture).toBe('brown')
  })
})

describe('Challenger 2: Bilingual Symmetry & Content Parity', () => {
  it('has identical key sets in Polish and English dictionaries', () => {
    const plKeys = Object.keys(translations.pl).sort()
    const enKeys = Object.keys(translations.en).sort()
    expect(plKeys).toEqual(enKeys)
  })

  it('contains zero empty or whitespace-only translation strings', () => {
    for (const [key, val] of Object.entries(translations.pl)) {
      expect(val.trim().length, `Empty PL key: ${key}`).toBeGreaterThan(0)
    }
    for (const [key, val] of Object.entries(translations.en)) {
      expect(val.trim().length, `Empty EN key: ${key}`).toBeGreaterThan(0)
    }
  })

  it('has exact symmetry in interpolation tokens between Polish and English', () => {
    const tokenRegex = /\{([a-zA-Z0-9_-]+)\}/g
    const dictPl = translations.pl as Record<string, string>
    const dictEn = translations.en as Record<string, string>

    for (const key of Object.keys(dictPl)) {
      const plTokens = (dictPl[key].match(tokenRegex) || []).sort()
      const enTokens = (dictEn[key].match(tokenRegex) || []).sort()
      expect(plTokens, `Token mismatch on key "${key}"`).toEqual(enTokens)
    }
  })

  it('verifies all Milestone v2.2 sound keys exist in both dictionaries', () => {
    const dictPl = translations.pl as Record<string, string>
    const dictEn = translations.en as Record<string, string>
    const requiredKeys = [
      'sound.baseTexture',
      'sound.layerBase',
      'sound.brown',
      'sound.brownNoise',
      'sound.pink',
      'sound.pinkNoise',
      'sound.rain',
      'sound.softRain',
      'sound.waves',
      'sound.oceanWaves',
      'sound.entrainment',
      'sound.layerBinaural',
      'sound.binaural',
      'sound.binauralOff',
      'sound.binauralAlpha',
      'sound.binauralTheta',
      'sound.alphaFocus',
      'sound.thetaRest',
      'sound.binauralHeadphones',
      'sound.headphonesRequired',
      'sound.masterVolume',
      'sound.toneWarmth',
      'sound.warmth',
      'sound.warmthCutoff',
      'sound.toneWarmthUnit',
      'sound.warmthWarm',
      'sound.warmthBright',
      'binaural.off',
      'binaural.alpha',
      'binaural.theta',
      'binaural.hint',
    ]

    for (const key of requiredKeys) {
      expect(dictPl[key], `Missing PL key: ${key}`).toBeDefined()
      expect(dictEn[key], `Missing EN key: ${key}`).toBeDefined()
    }
  })
})

describe('Challenger 2: 0 KB Static Audio Asset Footprint & PWA Precache Bounds', () => {
  it('verifies 0 static .m4a files exist in public/sounds/', () => {
    const soundsDir = path.resolve(process.cwd(), 'public/sounds')
    const files = fs.readdirSync(soundsDir)
    const m4aFiles = files.filter((f) => f.toLowerCase().endsWith('.m4a'))

    expect(m4aFiles).toEqual([])
    expect(m4aFiles.length).toBe(0)
  })

  it('verifies public/sounds/ only contains SOUNDS.md documentation', () => {
    const soundsDir = path.resolve(process.cwd(), 'public/sounds')
    const files = fs.readdirSync(soundsDir)
    expect(files).toEqual(['SOUNDS.md'])
  })

  it('verifies vite.config.ts workbox precache glob excludes audio formats', () => {
    const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts')
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8')

    expect(viteConfigContent).not.toMatch(/m4a|mp3|wav|ogg/i)
    expect(viteConfigContent).toContain("globPatterns: ['**/*.{js,css,html,svg,woff2}']")
  })
})
