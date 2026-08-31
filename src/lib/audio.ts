import type { AmbientSound, PlayableSound } from '../types'

/** Bundled, freely-licensed field recordings (see public/sounds/SOUNDS.md). */
const SAMPLES: Record<'rain' | 'waves' | 'stream' | 'campfire', string> = {
  rain: '/sounds/rain.m4a',
  waves: '/sounds/waves.m4a',
  stream: '/sounds/stream.m4a',
  campfire: '/sounds/campfire.m4a',
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private ambientNodes: AudioScheduledSourceNode[] = []
  private ambientGain: GainNode | null = null
  private brownBaseGain = 0.06
  private loopEl: HTMLAudioElement | null = null
  private volume = 0.7

  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level))
    if (this.loopEl) this.loopEl.volume = this.volume
    if (this.ambientGain) this.ambientGain.gain.value = this.brownBaseGain * this.volume
  }

  private ensureContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const webkitWindow = window as Window & { webkitAudioContext?: typeof AudioContext }
        const Ctor = window.AudioContext ?? webkitWindow.webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return this.ctx
    } catch {
      return null
    }
  }

  /** Soft two-note chime for session transitions. */
  chime(): void {
    const ctx = this.ensureContext()
    if (!ctx) return
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)

    const notes: Array<{ freq: number; at: number; dur: number }> = [
      { freq: 659.25, at: 0, dur: 0.35 }, // E5
      { freq: 987.77, at: 0.18, dur: 0.6 }, // B5
    ]
    for (const { freq, at, dur } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + at)
      gain.gain.exponentialRampToValueAtTime(0.9, now + at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur)
      osc.connect(gain)
      gain.connect(master)
      osc.start(now + at)
      osc.stop(now + at + dur + 0.05)
    }
  }

  /** Switches the ambient soundscape. `none` stops everything. */
  setAmbient(sound: AmbientSound, sounds: PlayableSound[]): void {
    this.stopAmbient()
    if (sound === 'none') return

    if (sound.startsWith('custom:')) {
      const id = sound.slice(7)
      const record = sounds.find((s) => s.id === id)
      if (!record) return
      this.playLooped(record.url)
      return
    }

    if (sound in SAMPLES) {
      this.playLooped(SAMPLES[sound as keyof typeof SAMPLES])
      return
    }

    if (sound === 'noise') {
      this.playBrownNoise()
    }
  }

  /** Loop a URL (bundled sample or user data URL) through one audio element. */
  private playLooped(src: string): void {    try {
      const el = this.ensureLoopElement()
      if (!el) return
      if (!el.src.endsWith(src)) {
        el.src = src
      }
      el.loop = true
      el.volume = this.volume
      void el.play().catch(() => {})
    } catch {
      // Unplayable source — stay silent.
    }
  }

  private ensureLoopElement(): HTMLAudioElement | null {
    if (!this.loopEl) {
      this.loopEl = new Audio()
      this.loopEl.preload = 'auto'
    }
    return this.loopEl
  }

  /** Stereo brown noise with a slow breathing swell — steady, low, unobtrusive. */
  private playBrownNoise(): void {
    const ctx = this.ensureContext()
    if (!ctx) return

    const master = ctx.createGain()
    master.gain.value = this.brownBaseGain * this.volume
    master.connect(ctx.destination)
    this.ambientGain = master

    const seconds = 6
    const brownLayer = (): AudioBuffer => {
      const len = Math.floor(ctx.sampleRate * seconds)
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let last = 0
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1
        last = (last + 0.02 * white) / 1.02
        data[i] = last * 3.5
      }
      return buffer
    }
    const layer = (pan: number): AudioBufferSourceNode => {
      const src = ctx.createBufferSource()
      src.buffer = brownLayer()
      src.loop = true
      const panner = ctx.createStereoPanner()
      panner.pan.value = pan
      src.connect(panner)
      panner.connect(master)
      src.start()
      this.ambientNodes.push(src)
      return src
    }
    layer(-0.35)
    layer(0.35)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.012
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)
    lfo.start()
    this.ambientNodes.push(lfo)
  }

  stopAmbient(): void {
    for (const node of this.ambientNodes) {
      try {
        node.stop()
      } catch {
        // Already stopped.
      }
    }
    this.ambientNodes = []
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect()
      } catch {
        // Already disconnected.
      }
      this.ambientGain = null
    }
    if (this.loopEl) {
      this.loopEl.pause()
      this.loopEl.src = ''
      this.loopEl = null
    }
  }

  dispose(): void {
    this.stopAmbient()
    void this.ctx?.close().catch(() => {})
    this.ctx = null
  }
}

export const audio = new AudioEngine()
