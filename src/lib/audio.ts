import type { AmbientSound, CustomSound } from '../types'

/**
 * All audio in one place: the session chime and ambient soundscapes.
 * The Web Audio graph for rain/noise is ported from the original Focus Flow.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private ambientNodes: AudioScheduledSourceNode[] = []
  private ambientGain: GainNode | null = null
  private customEl: HTMLAudioElement | null = null

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
  setAmbient(sound: AmbientSound, customSounds: CustomSound[]): void {
    this.stopAmbient()
    if (sound === 'none') return

    if (sound.startsWith('custom:')) {
      const id = sound.slice(7)
      const record = customSounds.find((s) => s.id === id)
      if (!record) return
      try {
        const el = new Audio(record.dataUrl)
        el.loop = true
        void el.play().catch(() => {})
        this.customEl = el
      } catch {
        // Corrupt data URL — stay silent.
      }
      return
    }

    const ctx = this.ensureContext()
    if (!ctx) return

    const master = ctx.createGain()
    master.gain.value = 1
    master.connect(ctx.destination)
    this.ambientGain = master

    const noiseBuffer = (): AudioBuffer => {
      const len = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      return buffer
    }
    const loop = (buffer: AudioBuffer): AudioBufferSourceNode => {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.start()
      this.ambientNodes.push(src)
      return src
    }

    if (sound === 'rain') {
      // Low rumble + mid hiss + high patter, with a slow LFO breathing on the mid band.
      const low = loop(noiseBuffer())
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 600
      const lg = ctx.createGain()
      lg.gain.value = 0.08
      low.connect(lp); lp.connect(lg); lg.connect(master)

      const mid = loop(noiseBuffer())
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2200
      bp.Q.value = 0.8
      const mg = ctx.createGain()
      mg.gain.value = 0.06
      mid.connect(bp); bp.connect(mg); mg.connect(master)

      const high = loop(noiseBuffer())
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 5000
      const hg = ctx.createGain()
      hg.gain.value = 0.03
      high.connect(hp); hp.connect(hg); hg.connect(master)

      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.15
      const lfoMid = ctx.createGain()
      lfoMid.gain.value = 0.015
      lfo.connect(lfoMid); lfoMid.connect(mg.gain)
      const lfoHigh = ctx.createGain()
      lfoHigh.gain.value = 0.01
      lfo.connect(lfoHigh); lfoHigh.connect(hg.gain)
      lfo.start()
      this.ambientNodes.push(lfo)
    }

    if (sound === 'noise') {
      const src = loop(noiseBuffer())
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 6000
      const g = ctx.createGain()
      g.gain.value = 0.035
      src.connect(lp); lp.connect(g); g.connect(master)
    }
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
    if (this.customEl) {
      this.customEl.pause()
      this.customEl.src = ''
      this.customEl = null
    }
  }

  dispose(): void {
    this.stopAmbient()
    void this.ctx?.close().catch(() => {})
    this.ctx = null
  }
}

export const audio = new AudioEngine()
