import {
  DEFAULT_SOUND_PREFERENCES,
  type AmbientSound,
  type BaseSoundTexture,
  type BinauralMode,
  type CustomSound,
  type PlayableSound,
  type SoundPreferences,
} from '../types'
import { DEFAULT_TONE_WARMTH } from './storage'

/* ========================================================================== */
/* Mathematical Procedural Synthesis Functions                                */
/* ========================================================================== */

/**
 * Generates stereo Pink Noise using Paul Kellet's 6-pole IIR filter.
 * Converts uniform white noise to a 1/f (-3 dB/octave) spectrum.
 * Output scaled by 0.11, strictly bounded within [-2.0, 2.0].
 */
export function generatePinkNoiseBuffer(ctx: AudioContext, seconds = 10): AudioBuffer {
  const samples = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0
    let b1 = 0
    let b2 = 0
    let b3 = 0
    let b4 = 0
    let b5 = 0
    let b6 = 0
    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

/**
 * Generates stereo Leaky Brown Noise using a 1-pole discrete leaky integrator:
 * y[n] = (y[n-1] + 0.02 * w[n]) / 1.02, out[n] = 3.5 * y[n]
 * Output strictly bounded within [-4.5, 4.5] with 1/f^2 (-6 dB/octave) spectrum.
 */
export function generateBrownNoiseBuffer(ctx: AudioContext, seconds = 10): AudioBuffer {
  const samples = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let y = 0
    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1
      y = (y + 0.02 * white) / 1.02
      data[i] = 3.5 * y
    }
  }
  return buffer
}

/**
 * Generates stereo Procedural Soft Rain:
 * Pink noise base passed through a 2-pole lowpass filter (fc = 1100 Hz, Q = 0.7)
 * combined with Poisson-distributed droplet impulses bandpass filtered (fc = 4200 Hz, Q = 8.0).
 */
export function generateRainBuffer(ctx: AudioContext, seconds = 10): AudioBuffer {
  const samples = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate)
  const sr = ctx.sampleRate

  // Biquad lowpass coefficients (fc = 1100 Hz, Q = 0.7)
  const fcLp = 1100
  const qLp = 0.7
  const w0Lp = (2 * Math.PI * fcLp) / sr
  const alphaLp = Math.sin(w0Lp) / (2 * qLp)
  const cosW0Lp = Math.cos(w0Lp)
  const b0Lp = (1 - cosW0Lp) / 2
  const b1Lp = 1 - cosW0Lp
  const b2Lp = (1 - cosW0Lp) / 2
  const a0Lp = 1 + alphaLp
  const a1Lp = -2 * cosW0Lp
  const a2Lp = 1 - alphaLp

  // Biquad bandpass coefficients (fc = 4200 Hz, Q = 8.0)
  const fcBp = 4200
  const qBp = 8.0
  const w0Bp = (2 * Math.PI * fcBp) / sr
  const alphaBp = Math.sin(w0Bp) / (2 * qBp)
  const cosW0Bp = Math.cos(w0Bp)
  const b0Bp = alphaBp
  const b1Bp = 0
  const b2Bp = -alphaBp
  const a0Bp = 1 + alphaBp
  const a1Bp = -2 * cosW0Bp
  const a2Bp = 1 - alphaBp

  const lambdaDropletsPerSec = 35
  const dropletProb = lambdaDropletsPerSec / sr

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)

    // Generate pink noise base
    let b0 = 0
    let b1 = 0
    let b2 = 0
    let b3 = 0
    let b4 = 0
    let b5 = 0
    let b6 = 0

    // Filter states for rain bed
    let xLp1 = 0
    let xLp2 = 0
    let yLp1 = 0
    let yLp2 = 0

    // Filter states for droplet impulses
    let xBp1 = 0
    let xBp2 = 0
    let yBp1 = 0
    let yBp2 = 0

    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      const pinkSample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926

      // Lowpass filter rain bed
      const yLp =
        (b0Lp * pinkSample + b1Lp * xLp1 + b2Lp * xLp2 - a1Lp * yLp1 - a2Lp * yLp2) / a0Lp
      xLp2 = xLp1
      xLp1 = pinkSample
      yLp2 = yLp1
      yLp1 = yLp

      // Poisson droplet impulse
      let dropletImpulse = 0
      if (Math.random() < dropletProb) {
        dropletImpulse = (Math.random() * 0.7 + 0.3) * (Math.random() > 0.5 ? 1 : -1)
      }

      // Bandpass filter droplet impulse
      const yBp =
        (b0Bp * dropletImpulse + b1Bp * xBp1 + b2Bp * xBp2 - a1Bp * yBp1 - a2Bp * yBp2) / a0Bp
      xBp2 = xBp1
      xBp1 = dropletImpulse
      yBp2 = yBp1
      yBp1 = yBp

      // Blend steady rain bed + crisp droplets
      data[i] = yLp * 0.65 + yBp * 0.35
    }
  }
  return buffer
}

/**
 * Generates stereo Procedural Ocean Waves:
 * Pink/brown noise passed through an asymmetric tidal modulation sweep:
 * 10.0s total cycle: 3.5s flood surge (250 Hz -> 1200 Hz) and 6.5s ebb foam recession (1200 Hz -> 250 Hz).
 */
export function generateWavesBuffer(ctx: AudioContext, seconds = 10): AudioBuffer {
  const samples = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate)
  const sr = ctx.sampleRate
  const cyclePeriod = 10.0
  const floodTime = 3.5

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let brown = 0
    let lpVal = 0

    for (let i = 0; i < samples; i++) {
      const t = ((i / sr) % cyclePeriod)

      let cutoff: number
      let tidalGain: number

      if (t < floodTime) {
        // Surge / flood phase (0 -> 3.5s)
        const p = t / floodTime
        // Smooth S-curve swell
        const curve = Math.sin((p * Math.PI) / 2)
        cutoff = 250 + (1200 - 250) * curve
        tidalGain = 0.3 + 0.7 * curve
      } else {
        // Ebb / foam recession phase (3.5s -> 10.0s)
        const p = (t - floodTime) / (cyclePeriod - floodTime)
        const curve = Math.cos((p * Math.PI) / 2)
        cutoff = 250 + (1200 - 250) * curve
        tidalGain = 0.3 + 0.7 * curve
      }

      // Generate brown/pink blend noise
      const white = Math.random() * 2 - 1
      brown = (brown + 0.02 * white) / 1.02

      // Simple dynamic single-pole lowpass filter for tidal sweep
      const rc = 1 / (2 * Math.PI * cutoff)
      const dt = 1 / sr
      const alpha = dt / (rc + dt)
      lpVal = lpVal + alpha * (brown * 3.5 - lpVal)

      data[i] = lpVal * tidalGain * 0.4
    }
  }
  return buffer
}

/* ========================================================================== */
/* Tibetan Singing Bowl Modal Synthesis & Binaural Config Specs                */
/* ========================================================================== */

export interface SingingBowlPartial {
  name: string
  ratio: number
  freq: number
  beatingDetune: number
  gain: number
  decay: number
}

export function getSingingBowlPartials(f0 = 216.0): SingingBowlPartial[] {
  return [
    { name: 'f1 (Fundamental)', ratio: 1.0, freq: f0 * 1.0, beatingDetune: 0.4, gain: 1.0, decay: 6.0 },
    { name: 'f2 (Prime)', ratio: 1.414, freq: f0 * 1.414, beatingDetune: 0.5, gain: 0.65, decay: 4.5 },
    { name: 'f3 (Tierce)', ratio: 2.0, freq: f0 * 2.0, beatingDetune: 0.0, gain: 0.4, decay: 3.2 },
    { name: 'f4 (Septimal)', ratio: 2.76, freq: f0 * 2.76, beatingDetune: 0.0, gain: 0.25, decay: 2.0 },
    { name: 'f5 (High Metal)', ratio: 5.404, freq: f0 * 5.404, beatingDetune: 0.0, gain: 0.12, decay: 0.8 },
  ]
}

export interface BinauralConfig {
  leftFreq: number
  rightFreq: number
  deltaFreq: number
}

export function getBinauralConfig(mode: BinauralMode): BinauralConfig | null {
  if (mode === 'alpha') {
    return { leftFreq: 216, rightFreq: 226, deltaFreq: 10 }
  }
  if (mode === 'theta') {
    return { leftFreq: 180, rightFreq: 186, deltaFreq: 6 }
  }
  return null
}

/* ========================================================================== */
/* AudioEngine Class Implementation                                           */
/* ========================================================================== */

interface ActiveChannel {
  source: AudioScheduledSourceNode
  gainNode: GainNode
  panner?: StereoPannerNode
  lfo?: OscillatorNode
  lfoGain?: GainNode
  stopTime?: number
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private toneWarmthFilter: BiquadFilterNode | null = null

  // Base texture channel
  private currentTextureChannel: ActiveChannel | null = null
  private fadingTextureChannels: ActiveChannel[] = []

  // Binaural beats channel
  private binauralLeftOsc: OscillatorNode | null = null
  private binauralRightOsc: OscillatorNode | null = null
  private binauralGainNode: GainNode | null = null

  // Custom audio playback element fallback
  private loopEl: HTMLAudioElement | null = null

  // Engine preferences state
  private preferences: SoundPreferences = { ...DEFAULT_SOUND_PREFERENCES }
  private volume: number = DEFAULT_SOUND_PREFERENCES.volume
  private toneWarmthCutoff: number = DEFAULT_TONE_WARMTH
  private isSessionActive: boolean = false
  private gestureListenerAttached = false

  constructor() {
    this.attachGestureResume()
  }

  /**
   * Automatically resume AudioContext on user interaction to handle browser autoplay policies.
   */
  private attachGestureResume(): void {
    if (typeof window === 'undefined' || this.gestureListenerAttached) return
    const resumeHandler = (): void => {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {})
      }
    }
    window.addEventListener('pointerdown', resumeHandler, { passive: true })
    window.addEventListener('keydown', resumeHandler, { passive: true })
    this.gestureListenerAttached = true
  }

  public init(): void {
    this.ensureContext()
  }

  public ensureContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const webkitWindow = window as Window & { webkitAudioContext?: typeof AudioContext }
        const Ctor = window.AudioContext ?? webkitWindow.webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
      }

      if (!this.masterGain && this.ctx) {
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
        this.masterGain.connect(this.ctx.destination)
      }

      if (!this.toneWarmthFilter && this.ctx && this.masterGain) {
        this.toneWarmthFilter = this.ctx.createBiquadFilter()
        this.toneWarmthFilter.type = 'lowpass'
        this.toneWarmthFilter.frequency.setValueAtTime(this.toneWarmthCutoff, this.ctx.currentTime)
        this.toneWarmthFilter.Q.setValueAtTime(0.707, this.ctx.currentTime)
        this.toneWarmthFilter.connect(this.masterGain)
      }

      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {})
      }
      return this.ctx
    } catch {
      return null
    }
  }

  public getPreferences(): SoundPreferences {
    return { ...this.preferences }
  }

  public setVolume(level: number): void {
    const clamped = Math.max(0, Math.min(1, level))
    this.volume = clamped
    this.preferences.volume = clamped

    if (this.loopEl) {
      this.loopEl.volume = clamped
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime
      if (this.isSessionActive) {
        this.masterGain.gain.setTargetAtTime(clamped, now, 0.05)
      } else {
        this.masterGain.gain.setValueAtTime(clamped, now)
      }
    }
  }

  public setToneWarmth(cutoffHz: number): void {
    const clamped = Math.max(200, Math.min(1200, cutoffHz))
    this.toneWarmthCutoff = clamped
    this.preferences.toneWarmthCutoff = clamped

    if (this.toneWarmthFilter && this.ctx) {
      this.toneWarmthFilter.frequency.setTargetAtTime(clamped, this.ctx.currentTime, 0.05)
    }
  }

  /**
   * Switches the ambient soundscape texture.
   * Performs a smooth 2.0s crossfade between old and new textures.
   */
  public setAmbient(sound: BaseSoundTexture | AmbientSound, customSounds?: CustomSound[] | PlayableSound[]): void {
    const activeTexture: BaseSoundTexture = sound === 'noise' ? 'brown' : (sound as BaseSoundTexture)
    this.preferences.baseTexture = activeTexture
    const ctx = this.ensureContext()

    // 1. Crossfade out current texture channel
    if (this.currentTextureChannel) {
      const oldChannel = this.currentTextureChannel
      this.currentTextureChannel = null
      this.fadeOutAndCleanChannel(oldChannel, 2.0)
    }

    // 2. Stop HTMLAudioElement if running
    if (this.loopEl) {
      this.loopEl.pause()
      this.loopEl.src = ''
      this.loopEl = null
    }

    if (activeTexture === 'none' || !ctx) {
      return
    }

    // 3. Custom sound upload playback
    if (activeTexture.startsWith('custom:')) {
      const id = activeTexture.slice(7)
      const record = customSounds?.find((s) => s.id === id)
      if (record) {
        const url =
          'url' in record && typeof record.url === 'string' && record.url
            ? record.url
            : typeof record.dataUrl === 'string'
              ? record.dataUrl
              : ''
        if (url) this.playLoopedCustom(url)
      }
      return
    }

    // 4. Procedural Web Audio synthesis textures
    let buffer: AudioBuffer | null = null
    let spatialLfo = false

    if (activeTexture === 'pink') {
      buffer = generatePinkNoiseBuffer(ctx)
    } else if (activeTexture === 'brown') {
      buffer = generateBrownNoiseBuffer(ctx)
      spatialLfo = true
    } else if (activeTexture === 'rain') {
      buffer = generateRainBuffer(ctx)
    } else if (activeTexture === 'waves') {
      buffer = generateWavesBuffer(ctx)
    }

    if (!buffer) return

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const textureGain = ctx.createGain()
    const now = ctx.currentTime
    // 2.0s crossfade fade-in ramp (with 0.0001 floor)
    textureGain.gain.cancelScheduledValues(now)
    textureGain.gain.setValueAtTime(0.0001, now)
    textureGain.gain.exponentialRampToValueAtTime(1.0, now + 2.0)

    let panner: StereoPannerNode | undefined
    let lfo: OscillatorNode | undefined
    let lfoGain: GainNode | undefined

    if (spatialLfo && typeof ctx.createStereoPanner === 'function') {
      panner = ctx.createStereoPanner()
      panner.pan.setValueAtTime(0, now)

      lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.08, now)

      lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(0.35, now)

      lfo.connect(lfoGain)
      lfoGain.connect(panner.pan)
      lfo.start(now)

      source.connect(panner)
      panner.connect(textureGain)
    } else {
      source.connect(textureGain)
    }

    if (this.toneWarmthFilter) {
      textureGain.connect(this.toneWarmthFilter)
    } else if (this.masterGain) {
      textureGain.connect(this.masterGain)
    }

    source.start(now)
    this.currentTextureChannel = {
      source,
      gainNode: textureGain,
      panner,
      lfo,
      lfoGain,
    }
  }

  /**
   * Sets the binaural beats entrainment mode (off, alpha, theta).
   */
  public setBinaural(mode: BinauralMode): void {
    this.preferences.binauralMode = mode
    this.stopBinaural()

    if (mode === 'off') return
    const cfg = getBinauralConfig(mode)
    if (!cfg) return

    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const binauralGain = ctx.createGain()
    // Calibrated subtle hum (~0.10 relative gain)
    binauralGain.gain.setValueAtTime(0.1, now)
    binauralGain.connect(this.masterGain)
    this.binauralGainNode = binauralGain

    // Left Carrier (panned -1.0)
    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.setValueAtTime(cfg.leftFreq, now)

    if (typeof ctx.createStereoPanner === 'function') {
      const leftPanner = ctx.createStereoPanner()
      leftPanner.pan.setValueAtTime(-1.0, now)
      leftOsc.connect(leftPanner)
      leftPanner.connect(binauralGain)
    } else {
      leftOsc.connect(binauralGain)
    }

    // Right Carrier (panned +1.0)
    const rightOsc = ctx.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.setValueAtTime(cfg.rightFreq, now)

    if (typeof ctx.createStereoPanner === 'function') {
      const rightPanner = ctx.createStereoPanner()
      rightPanner.pan.setValueAtTime(1.0, now)
      rightOsc.connect(rightPanner)
      rightPanner.connect(binauralGain)
    } else {
      rightOsc.connect(binauralGain)
    }

    leftOsc.start(now)
    rightOsc.start(now)

    this.binauralLeftOsc = leftOsc
    this.binauralRightOsc = rightOsc
  }

  private stopBinaural(): void {
    if (this.binauralLeftOsc) {
      try {
        this.binauralLeftOsc.stop()
        this.binauralLeftOsc.disconnect()
      } catch {
        // Ignored
      }
      this.binauralLeftOsc = null
    }

    if (this.binauralRightOsc) {
      try {
        this.binauralRightOsc.stop()
        this.binauralRightOsc.disconnect()
      } catch {
        // Ignored
      }
      this.binauralRightOsc = null
    }

    if (this.binauralGainNode) {
      try {
        this.binauralGainNode.disconnect()
      } catch {
        // Ignored
      }
      this.binauralGainNode = null
    }
  }

  /**
   * Applies full sound preferences bundle at once.
   */
  public applyPreferences(prefs: SoundPreferences, customSounds?: CustomSound[] | PlayableSound[]): void {
    this.setToneWarmth(prefs.toneWarmthCutoff)
    this.setVolume(prefs.volume)
    this.setAmbient(prefs.baseTexture, customSounds)
    this.setBinaural(prefs.binauralMode)
  }

  /**
   * Session Start: Smooth 3.0s exponential gain ramp from 0.0001 up to volume.
   */
  public startSession(): void {
    this.isSessionActive = true
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(0.0001, now)
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.volume), now + 3.0)
  }

  /**
   * Session Pause: Smooth 3.0s exponential gain ramp down to 0.0001.
   */
  public pauseSession(): void {
    this.isSessionActive = false
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const currentVal = Math.max(0.0001, this.masterGain.gain.value)
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(currentVal, now)
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0)
  }

  public stopSession(): void {
    this.pauseSession()
  }

  /**
   * Tibetan Singing Bowl Modal Completion Chime.
   * Synthesizes 5 inharmonic partials + 25ms mallet bandpass contact burst.
   */
  public playChime(): void {
    const ctx = this.ensureContext()
    if (!ctx) return

    const now = ctx.currentTime
    const chimeMaster = ctx.createGain()
    chimeMaster.gain.setValueAtTime(0.28, now)
    chimeMaster.connect(ctx.destination)

    const partials = getSingingBowlPartials(216.0)

    for (const p of partials) {
      // Create dual detuned oscillators for acoustic beating shimmer on f1 and f2
      const detunes = p.beatingDetune > 0 ? [-p.beatingDetune, p.beatingDetune] : [0]
      const gainScale = 1.0 / detunes.length

      for (const det of detunes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(p.freq + det, now)

        const startGain = Math.max(0.0001, p.gain * gainScale)
        gain.gain.setValueAtTime(startGain, now)
        // Exponential decay envelope to 0.0001 over tau
        gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay)

        osc.connect(gain)
        gain.connect(chimeMaster)

        osc.start(now)
        osc.stop(now + p.decay + 0.05)

        // Node GC cleanup
        setTimeout(() => {
          try {
            osc.disconnect()
            gain.disconnect()
          } catch {
            // Ignored
          }
        }, (p.decay + 0.1) * 1000)
      }
    }

    // Mallet transient burst: 25ms white noise through bandpass (2.4 kHz, Q=4)
    try {
      const malletDuration = 0.025
      const malletSamples = Math.floor(ctx.sampleRate * malletDuration)
      const malletBuf = ctx.createBuffer(1, malletSamples, ctx.sampleRate)
      const data = malletBuf.getChannelData(0)
      for (let i = 0; i < malletSamples; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const malletSrc = ctx.createBufferSource()
      malletSrc.buffer = malletBuf

      const malletFilter = ctx.createBiquadFilter()
      malletFilter.type = 'bandpass'
      malletFilter.frequency.setValueAtTime(2400, now)
      malletFilter.Q.setValueAtTime(4.0, now)

      const malletGain = ctx.createGain()
      malletGain.gain.setValueAtTime(0.8, now)
      malletGain.gain.exponentialRampToValueAtTime(0.0001, now + malletDuration)

      malletSrc.connect(malletFilter)
      malletFilter.connect(malletGain)
      malletGain.connect(chimeMaster)

      malletSrc.start(now)
      malletSrc.stop(now + malletDuration + 0.01)

      setTimeout(() => {
        try {
          malletSrc.disconnect()
          malletFilter.disconnect()
          malletGain.disconnect()
          chimeMaster.disconnect()
        } catch {
          // Ignored
        }
      }, 7000)
    } catch {
      // Mallet transient fallback
    }
  }

  /**
   * Alias for playChime() for backwards compatibility with timer.ts.
   */
  public chime(): void {
    this.playChime()
  }

  private fadeOutAndCleanChannel(channel: ActiveChannel, fadeSeconds: number): void {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const gain = channel.gainNode
    const currentGain = Math.max(0.0001, gain.gain.value)

    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(currentGain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds)

    this.fadingTextureChannels.push(channel)

    setTimeout(() => {
      try {
        channel.source.stop()
        channel.source.disconnect()
        channel.lfo?.stop()
        channel.lfo?.disconnect()
        channel.lfoGain?.disconnect()
        channel.panner?.disconnect()
        channel.gainNode.disconnect()
      } catch {
        // Ignored
      }
      this.fadingTextureChannels = this.fadingTextureChannels.filter((c) => c !== channel)
    }, (fadeSeconds + 0.05) * 1000)
  }

  private playLoopedCustom(src: string): void {
    try {
      if (!this.loopEl) {
        this.loopEl = new Audio()
        this.loopEl.preload = 'auto'
      }
      if (!this.loopEl.src.endsWith(src)) {
        this.loopEl.src = src
      }
      this.loopEl.loop = true
      this.loopEl.volume = this.volume
      void this.loopEl.play().catch(() => {})
    } catch {
      // Stay silent if unplayable
    }
  }

  public stopAmbient(): void {
    this.setAmbient('none')
    this.stopBinaural()
  }

  public dispose(): void {
    this.stopAmbient()
    this.stopBinaural()
    if (this.masterGain) {
      try {
        this.masterGain.disconnect()
      } catch {
        // Ignored
      }
      this.masterGain = null
    }
    if (this.toneWarmthFilter) {
      try {
        this.toneWarmthFilter.disconnect()
      } catch {
        // Ignored
      }
      this.toneWarmthFilter = null
    }
    void this.ctx?.close().catch(() => {})
    this.ctx = null
  }
}

export const audio: AudioEngine = new AudioEngine()
