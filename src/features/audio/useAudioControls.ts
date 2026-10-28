import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audioSubsystem } from '../../lib/audioSubsystem'
import { useI18n } from '../../lib/i18n'
import { isRemoteWrite } from '../../lib/sync/outbox'
import type { AmbientSound, BaseSoundTexture, BinauralMode, CustomSound, SoundPreferences } from '../../types'

export interface AudioControls {
  sounds: CustomSound[]
  prefs: SoundPreferences
  message: string | null
  reload: () => Promise<void>
  addFile: (file: File) => Promise<void>
  remove: (id: string) => void
  setAmbient: (sound: AmbientSound) => void
  setBinaural: (mode: BinauralMode) => void
  setWarmth: (warmth: number) => void
  setVolume: (volume: number) => void
}

/** React snapshots of the audio subsystem; the subsystem owns playback and files. */
export function useAudioControls(): AudioControls {
  const { t } = useI18n()
  const [sounds, setSounds] = useState(() => audioSubsystem.getCustomSounds())
  const [prefs, setPrefs] = useState(() => audioSubsystem.getPreferences())
  const [message, setMessage] = useState<string | null>(null)
  const messageTimer = useRef<number | undefined>(undefined)
  const reload = useCallback(async () => {
    await audioSubsystem.init()
    setSounds(audioSubsystem.getCustomSounds())
    setPrefs(audioSubsystem.getPreferences())
  }, [])
  useEffect(() => {
    void audioSubsystem.init()
    const unsubscribe = audioSubsystem.subscribe(() => {
      setPrefs(audioSubsystem.getPreferences())
      setSounds(audioSubsystem.getCustomSounds())
    })
    const changed = (event: Event) => {
      if (isRemoteWrite() && (event as CustomEvent<string>).detail === 'ff2_sound_prefs') audioSubsystem.reloadPreferences()
    }
    window.addEventListener('focus-flow:storage', changed)
    return () => { unsubscribe(); window.removeEventListener('focus-flow:storage', changed); window.clearTimeout(messageTimer.current) }
  }, [])
  const flash = useCallback((key: Parameters<typeof t>[0], name?: string) => {
    window.clearTimeout(messageTimer.current)
    setMessage(t(key, name !== undefined ? { name } : undefined))
    messageTimer.current = window.setTimeout(() => setMessage(null), 4000)
  }, [t])
  const addFile = useCallback(async (file: File) => {
    const result = await audioSubsystem.addCustomSound(file, t('sound.unnamed'))
    if (!result.ok) { if (result.errorKey) flash(result.errorKey); return }
    flash('sound.added', result.sound?.name ?? '')
  }, [flash, t])
  const remove = useCallback((id: string) => { void audioSubsystem.removeCustomSound(id) }, [])
  const setAmbient = useCallback((sound: AmbientSound) => audioSubsystem.setBaseTexture(sound as BaseSoundTexture), [])
  const setBinaural = useCallback((mode: BinauralMode) => audioSubsystem.setBinaural(mode), [])
  const setWarmth = useCallback((warmth: number) => audioSubsystem.setToneWarmth(warmth), [])
  const setVolume = useCallback((volume: number) => audioSubsystem.setVolume(volume), [])
  return useMemo(() => ({ sounds, prefs, message, reload, addFile, remove, setAmbient, setBinaural, setWarmth, setVolume }), [sounds, prefs, message, reload, addFile, remove, setAmbient, setBinaural, setWarmth, setVolume])
}
