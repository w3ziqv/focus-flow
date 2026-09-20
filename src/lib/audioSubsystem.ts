import type { BaseSoundTexture, BinauralMode, CustomSound, PlayableSound, SoundPreferences } from '../types'
import { audio, AudioEngine } from './audio'
import {
  deleteSound,
  getSoundBlob,
  isAudioUpload,
  migrateLegacySounds,
  probeAudio,
  putSound,
} from './soundStore'
import {
  loadCustomSounds,
  loadSoundPreferences,
  saveCustomSounds,
  saveSoundPreferences,
} from './storage'

export interface AddSoundResult {
  ok: boolean
  errorKey?: 'sound.notAudio' | 'sound.tooLarge' | 'sound.storageFull'
  sound?: CustomSound
}

/**
 * Deep Audio Subsystem Facade.
 *
 * Encapsulates IndexedDB blob resolution, object URL lifecycle, Web Audio synthesis transitions,
 * custom upload validation, and preference persistence behind a unified, high-leverage interface.
 */
export class AudioSubsystem {
  private static instance: AudioSubsystem | null = null

  private engine: AudioEngine
  private preferences: SoundPreferences
  private customSounds: CustomSound[]
  private soundUrls: Map<string, string> = new Map()
  private listeners: Set<() => void> = new Set()
  private initialized: boolean = false

  public constructor(engine: AudioEngine = audio) {
    this.engine = engine
    this.preferences = loadSoundPreferences()
    this.customSounds = loadCustomSounds()
  }

  public static getInstance(): AudioSubsystem {
    if (!AudioSubsystem.instance) {
      AudioSubsystem.instance = new AudioSubsystem()
    }
    return AudioSubsystem.instance
  }

  /**
   * Initializes custom sound blob resolution from IndexedDB and migrates legacy formats.
   */
  public async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    if (typeof window === 'undefined') return

    try {
      await migrateLegacySounds()
      const metas = loadCustomSounds()
      this.customSounds = metas

      for (const sound of metas) {
        if (sound.dataUrl) continue
        try {
          const blob = await getSoundBlob(sound.id)
          if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            const url = URL.createObjectURL(blob)
            this.soundUrls.set(sound.id, url)
          }
        } catch {
          // Unreadable blob
        }
      }

      this.syncPlayableToEngine()
      this.notify()
    } catch {
      // Storage unavailable
    }
  }

  public getPreferences(): SoundPreferences {
    return { ...this.preferences }
  }

  public getCustomSounds(): CustomSound[] {
    return [...this.customSounds]
  }

  public getPlayableSounds(): PlayableSound[] {
    return this.customSounds.map((s) => ({
      ...s,
      url: this.soundUrls.get(s.id) ?? s.dataUrl ?? '',
    }))
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume))
    this.preferences.volume = clamped
    saveSoundPreferences(this.preferences)
    this.engine.setVolume(clamped)
    this.notify()
  }

  public setToneWarmth(cutoffHz: number): void {
    const clamped = Math.max(200, Math.min(1200, cutoffHz))
    this.preferences.toneWarmthCutoff = clamped
    saveSoundPreferences(this.preferences)
    this.engine.setToneWarmth(clamped)
    this.notify()
  }

  public setBaseTexture(texture: BaseSoundTexture): void {
    this.preferences.baseTexture = texture
    saveSoundPreferences(this.preferences)
    this.engine.setAmbient(texture, this.getPlayableSounds())
    this.notify()
  }

  public setBinaural(mode: BinauralMode): void {
    this.preferences.binauralMode = mode
    saveSoundPreferences(this.preferences)
    this.engine.setBinaural(mode)
    this.notify()
  }

  public startSession(): void {
    this.syncPlayableToEngine()
    this.engine.startSession()
  }

  public pauseSession(): void {
    this.engine.pauseSession()
  }

  public playChime(): void {
    this.engine.playChime()
  }

  /**
   * Adds and persists a custom audio upload:
   * 1. Validates MIME type and size.
   * 2. Probes browser audio decoding compatibility.
   * 3. Stores audio blob in IndexedDB.
   * 4. Creates ephemeral object URL for playback.
   * 5. Updates metadata in persistent storage.
   */
  public async addCustomSound(file: File, defaultName: string = 'Custom Sound'): Promise<AddSoundResult> {
    if (!isAudioUpload(file)) {
      return { ok: false, errorKey: 'sound.notAudio' }
    }
    if (file.size > 200 * 1024 * 1024) {
      return { ok: false, errorKey: 'sound.tooLarge' }
    }

    const playable = await probeAudio(file)
    if (!playable) {
      return { ok: false, errorKey: 'sound.notAudio' }
    }

    const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    const rawName = file.name.replace(/\.[^.]+$/, '').trim()
    const name = (rawName || defaultName).slice(0, 40)

    try {
      await putSound(id, name, file)
    } catch {
      return { ok: false, errorKey: 'sound.storageFull' }
    }

    const newRecord: CustomSound = { id, name }
    const nextMetas = [...this.customSounds, newRecord]

    const saved = saveCustomSounds(nextMetas)
    if (!saved) {
      void deleteSound(id)
      return { ok: false, errorKey: 'sound.storageFull' }
    }

    this.customSounds = nextMetas
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      this.soundUrls.set(id, URL.createObjectURL(file))
    }

    this.syncPlayableToEngine()
    this.notify()

    return { ok: true, sound: newRecord }
  }

  /**
   * Deletes a custom audio file and revokes its object URL.
   */
  public async removeCustomSound(id: string): Promise<void> {
    const existingUrl = this.soundUrls.get(id)
    if (existingUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(existingUrl)
    }
    this.soundUrls.delete(id)

    const nextMetas = this.customSounds.filter((s) => s.id !== id)
    this.customSounds = nextMetas
    saveCustomSounds(nextMetas)

    try {
      await deleteSound(id)
    } catch {
      // Ignored
    }

    if (this.preferences.baseTexture === `custom:${id}`) {
      this.setBaseTexture('none')
    } else {
      this.syncPlayableToEngine()
      this.notify()
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch {
        // Safe dispatch
      }
    }
  }

  private syncPlayableToEngine(): void {
    this.engine.applyPreferences(this.preferences, this.getPlayableSounds())
  }

  public dispose(): void {
    for (const url of this.soundUrls.values()) {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url)
      }
    }
    this.soundUrls.clear()
    this.listeners.clear()
    this.engine.dispose()
  }
}

export const audioSubsystem: AudioSubsystem = AudioSubsystem.getInstance()
