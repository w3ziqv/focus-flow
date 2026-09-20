import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioSubsystem } from './audioSubsystem'
import { AudioEngine } from './audio'

describe('AudioSubsystem (Ambient Audio Facade)', () => {
  let mockEngine: AudioEngine
  let subsystem: AudioSubsystem

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()

    mockEngine = new AudioEngine()
    vi.spyOn(mockEngine, 'setVolume').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'setToneWarmth').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'setAmbient').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'setBinaural').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'startSession').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'pauseSession').mockImplementation(() => {})
    vi.spyOn(mockEngine, 'playChime').mockImplementation(() => {})

    subsystem = new AudioSubsystem(mockEngine)
  })

  it('updates volume, persists to storage, and notifies listeners', () => {
    let notified = false
    subsystem.subscribe(() => {
      notified = true
    })

    subsystem.setVolume(0.85)
    expect(subsystem.getPreferences().volume).toBe(0.85)
    expect(mockEngine.setVolume).toHaveBeenCalledWith(0.85)
    expect(notified).toBe(true)
  })

  it('updates tone warmth cutoff and sets on engine', () => {
    subsystem.setToneWarmth(500)
    expect(subsystem.getPreferences().toneWarmthCutoff).toBe(500)
    expect(mockEngine.setToneWarmth).toHaveBeenCalledWith(500)
  })

  it('delegates ambient texture changes', () => {
    subsystem.setBaseTexture('rain')
    expect(subsystem.getPreferences().baseTexture).toBe('rain')
    expect(mockEngine.setAmbient).toHaveBeenCalledWith('rain', expect.any(Array))
  })

  it('delegates binaural mode changes', () => {
    subsystem.setBinaural('alpha')
    expect(subsystem.getPreferences().binauralMode).toBe('alpha')
    expect(mockEngine.setBinaural).toHaveBeenCalledWith('alpha')
  })

  it('delegates session start, pause, and chime calls', () => {
    subsystem.startSession()
    expect(mockEngine.startSession).toHaveBeenCalled()

    subsystem.pauseSession()
    expect(mockEngine.pauseSession).toHaveBeenCalled()

    subsystem.playChime()
    expect(mockEngine.playChime).toHaveBeenCalled()
  })

  it('rejects invalid non-audio file uploads with error key', async () => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const result = await subsystem.addCustomSound(textFile)
    expect(result.ok).toBe(false)
    expect(result.errorKey).toBe('sound.notAudio')
  })
})
