import { memo, useEffect, useState } from 'react'
import type { GoalSettings, InterfacePrefs, Settings, Theme } from '../types'
import type { useAudioControls } from '../features/audio/useAudioControls'
import type { useDialogStack } from './useDialogStack'

const dialogLoaders = {
  app: () => import('../features/settings/AppSettingsModal').then(m => m.AppSettingsModal),
  data: () => import('../features/settings/AppSettingsModal').then(m => m.AppSettingsModal),
  shortcuts: () => import('../features/settings/ShortcutsModal').then(m => m.ShortcutsModal),
  timer: () => import('../features/timer/TimerSettingsModal').then(m => m.TimerSettingsModal),
  sound: () => import('../features/audio/SoundSettingsDialog').then(m => m.SoundSettingsDialog),
  cloud: () => import('../features/sync/CloudSyncModal').then(m => m.CloudSyncModal),
}
type LoadedDialogs = { [K in keyof typeof dialogLoaders]?: Awaited<ReturnType<typeof dialogLoaders[K]>> }

interface Props {
  stack: ReturnType<typeof useDialogStack>['stack']
  close: () => void
  openShortcuts: () => void
  openCloud: () => void
  theme: Theme
  onTheme: (theme: Theme) => void
  interfacePrefs: InterfacePrefs
  onInterfaceChange: (patch: Partial<InterfacePrefs>) => void
  onImportSuccess: () => void
  settings: Settings
  goals: GoalSettings
  onSaveTimer: (settings: Settings, goals?: GoalSettings) => void
  onSyncComplete: (message: string) => void
  audio: ReturnType<typeof useAudioControls>
}

/** Receives settings and commands, never the ticking engine object. */
export const AppDialogs: React.NamedExoticComponent<Props> = memo(function AppDialogs(props: Props): React.JSX.Element {
  const { stack, close, audio } = props
  const [loaded, setLoaded] = useState<LoadedDialogs>({})
  const [error, setError] = useState<unknown>(null)
  useEffect(() => {
    let cancelled = false
    for (const dialog of stack) {
      if (loaded[dialog]) continue
      void dialogLoaders[dialog]().then(component => {
        if (!cancelled) setLoaded(current => ({ ...current, [dialog]: component }))
      }).catch(reason => { if (!cancelled) setError(reason) })
    }
    return () => { cancelled = true }
  }, [stack, loaded])
  useEffect(() => {
    if (!stack.length || loaded[stack.at(-1)!]) return
    const cancelPending = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    document.addEventListener('keydown', cancelPending, true)
    return () => document.removeEventListener('keydown', cancelPending, true)
  }, [stack, loaded, close])
  if (error) throw error
  return <>{stack.map(dialog => {
    const AppSettingsModal = dialog === 'app' || dialog === 'data' ? loaded[dialog] : undefined
    const CloudSyncModal = loaded.cloud
    const ShortcutsModal = loaded.shortcuts
    const TimerSettingsModal = loaded.timer
    const SoundSettingsDialog = loaded.sound
    if (!loaded[dialog]) return null
    if ((dialog === 'app' || dialog === 'data') && AppSettingsModal) return <AppSettingsModal key={dialog} open theme={props.theme} onTheme={props.onTheme} interfacePrefs={props.interfacePrefs}
        onInterfaceChange={props.onInterfaceChange} onOpenShortcuts={props.openShortcuts} onOpenCloudSync={props.openCloud}
        onImportSuccess={props.onImportSuccess} onClose={close} initialSection={dialog === 'data' ? 'data' : 'main'} />
    if (dialog === 'cloud' && CloudSyncModal) return <CloudSyncModal key={dialog} open onClose={close} onSyncComplete={props.onSyncComplete} />
    if (dialog === 'shortcuts' && ShortcutsModal) return <ShortcutsModal key={dialog} open shortcuts={props.interfacePrefs.shortcuts} onSaveShortcuts={shortcuts => props.onInterfaceChange({ shortcuts })} onClose={close} />
    if (dialog === 'timer' && TimerSettingsModal) return <TimerSettingsModal key={dialog} open settings={props.settings} goals={props.goals} onSave={props.onSaveTimer} onClose={close} />
    if (!SoundSettingsDialog) return null
    return <SoundSettingsDialog key={dialog} open current={audio.prefs.baseTexture} binaural={audio.prefs.binauralMode} toneWarmth={audio.prefs.toneWarmthCutoff}
        volume={audio.prefs.volume} sounds={audio.sounds} message={audio.message} onChange={audio.setAmbient} onBinauralChange={audio.setBinaural}
        onToneWarmthChange={audio.setWarmth} onVolumeChange={audio.setVolume} onAddFile={audio.addFile} onRemove={audio.remove} onClose={close} />
  })}</>
})
