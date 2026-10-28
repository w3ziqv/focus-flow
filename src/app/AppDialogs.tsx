import { lazy, memo, Suspense } from 'react'
import { useI18n } from '../lib/i18n'
import { DialogLoading } from '../ui/LoadingState'
import type { GoalSettings, InterfacePrefs, Settings, Theme } from '../types'
import type { useAudioControls } from '../features/audio/useAudioControls'
import type { useDialogStack } from './useDialogStack'

const AppSettingsModal = lazy(() => import('../features/settings/AppSettingsModal').then(m => ({ default: m.AppSettingsModal })))
const ShortcutsModal = lazy(() => import('../features/settings/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })))
const TimerSettingsModal = lazy(() => import('../features/timer/TimerSettingsModal').then(m => ({ default: m.TimerSettingsModal })))
const SoundSettingsDialog = lazy(() => import('../features/audio/SoundSettingsDialog').then(m => ({ default: m.SoundSettingsDialog })))
const CloudSyncModal = lazy(() => import('../features/sync/CloudSyncModal').then(m => ({ default: m.CloudSyncModal })))

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
  const { t } = useI18n()
  const { stack, close, audio } = props
  return <>{stack.map(dialog => {
    if (dialog === 'app') return <Suspense key={dialog} fallback={<DialogLoading title={t('settings.app')} onClose={close} />}>
      <AppSettingsModal open theme={props.theme} onTheme={props.onTheme} interfacePrefs={props.interfacePrefs}
        onInterfaceChange={props.onInterfaceChange} onOpenShortcuts={props.openShortcuts} onOpenCloudSync={props.openCloud}
        onImportSuccess={props.onImportSuccess} onClose={close} />
    </Suspense>
    if (dialog === 'cloud') return <Suspense key={dialog} fallback={<DialogLoading title={t('sync.title')} onClose={close} />}>
      <CloudSyncModal open onClose={close} onSyncComplete={props.onSyncComplete} />
    </Suspense>
    if (dialog === 'shortcuts') return <Suspense key={dialog} fallback={<DialogLoading title={t('shortcuts.title')} onClose={close} />}>
      <ShortcutsModal open shortcuts={props.interfacePrefs.shortcuts} onSaveShortcuts={shortcuts => props.onInterfaceChange({ shortcuts })} onClose={close} />
    </Suspense>
    if (dialog === 'timer') return <Suspense key={dialog} fallback={<DialogLoading title={t('settings.timer')} onClose={close} />}>
      <TimerSettingsModal open settings={props.settings} goals={props.goals} onSave={props.onSaveTimer} onClose={close} />
    </Suspense>
    return <Suspense key={dialog} fallback={<DialogLoading title={t('sound.settings')} onClose={close} />}>
      <SoundSettingsDialog open current={audio.prefs.baseTexture} binaural={audio.prefs.binauralMode} toneWarmth={audio.prefs.toneWarmthCutoff}
        volume={audio.prefs.volume} sounds={audio.sounds} message={audio.message} onChange={audio.setAmbient} onBinauralChange={audio.setBinaural}
        onToneWarmthChange={audio.setWarmth} onVolumeChange={audio.setVolume} onAddFile={audio.addFile} onRemove={audio.remove} onClose={close} />
    </Suspense>
  })}</>
})
