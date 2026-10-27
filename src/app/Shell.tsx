import { AppDialogs } from './AppDialogs'
import { useDialogStack } from './useDialogStack'
import { useAudioControls } from '../features/audio/useAudioControls'
import { useTimerFeedback } from '../features/timer/useTimerFeedback'
import { getCloudSyncAdapter } from '../lib/sync/adapter'
import { useDesktopBridge } from '../lib/desktop/bridge'
import { flushPersistence } from '../lib/desktop/runtime'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { GoalSettings, InterfacePrefs, Settings, Theme } from '../types'
import { useI18n } from '../lib/i18n'
import { useTimerEngine } from '../lib/timer'
import { useShortcuts } from '../lib/useShortcuts'
import { useWakeLock } from '../lib/useWakeLock'
import { audioSubsystem } from '../lib/audioSubsystem'
import { accentStyle } from '../lib/accent'
import {
  loadInterface,
  loadOnboardingDone,
  loadTheme,
  saveInterface,
  saveTheme,
  systemTheme,
} from '../lib/storage'
import { captureInstallPrompt } from '../lib/installPrompt'
import { NavPill } from '../app/NavPill'
import { SyncStatusIndicator } from '../features/sync/SyncStatusIndicator'
import { A11yLiveAnnouncer } from '../app/A11yLiveAnnouncer'
import { ViewLoading } from '../ui/LoadingState'
import { FocusOverlay } from '../features/timer/FocusOverlay'
import { InstallPrompt } from '../app/InstallPrompt'
import { Onboarding } from '../app/Onboarding'
import { PillButton } from '../ui/PillButton'
import { Dial } from '../features/timer/Dial'
import { TimerView } from '../views/TimerView'
import { applyTheme } from '../lib/theme'

const GuidesView = lazy(() => import('../views/GuidesView'))
const StatsView = lazy(() => import('../views/StatsView'))

type View = 'timer' | 'stats' | 'tips'

export function Shell(): React.JSX.Element {
  useEffect(() => getCloudSyncAdapter().startBackground(), [])
  const engine = useTimerEngine()
  const { t, lang } = useI18n()
  const [view, setView] = useState<View>('timer')
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme())
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null)
  const [interfacePrefs, setInterfacePrefs] = useState(loadInterface)
  const [focusOpen, setFocusOpen] = useState(false)
  const audioControls = useAudioControls()
  const dialogs = useDialogStack()
  const [onboardingDone, setOnboardingDone] = useState(loadOnboardingDone)
  const { error: desktopError, nativeError, dismiss: dismissNativeError } = useDesktopBridge(engine, theme, lang, t, dialogs.desktopPreferences)

  useEffect(() => {
    captureInstallPrompt()
  }, [])

  useEffect(() => {
    const changed = (event: Event) => {
      if ((event as CustomEvent<string>).detail === 'ff2_interface') setInterfacePrefs(loadInterface())
    }
    window.addEventListener('focus-flow:storage', changed)
    return () => window.removeEventListener('focus-flow:storage', changed)
  }, [])

  // PWA app-shortcut target (/?start=focus): launch straight into a session.
  const { start: startSession } = engine
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('start') !== 'focus') return
    window.history.replaceState(null, '', window.location.pathname)
    startSession()
  }, [startSession])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (engine.running) {
      audioSubsystem.startSession()
    } else {
      audioSubsystem.pauseSession()
    }
  }, [engine.running])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', interfacePrefs.reduceMotion)
  }, [interfacePrefs.reduceMotion])

  useWakeLock(engine.running)

  useEffect(() => {
    if (view === 'tips') window.scrollTo({ top: 0 })
  }, [view])

  const setThemeAndPersist = useCallback((next: Theme) => {
    setTheme(next)
    saveTheme(next)
  }, [])

  const changeView = useCallback((next: View) => {
    setView(next)
  }, [])

  const startFromStats = useCallback(() => {
    setView('timer')
    startSession()
  }, [startSession])

  useTimerFeedback(engine, interfacePrefs)

  useShortcuts(
    {
      toggle: engine.toggle,
      reset: engine.reset,
      focusMode: () => setFocusOpen(true),
      openShortcuts: dialogs.openShortcuts,
      escape: () => {
        // Dialogs and the guide screen own their Escape behavior.
      },
    },
    interfacePrefs.shortcuts,
  )

  const changeInterface = useCallback((patch: Partial<InterfacePrefs>) => {
    const next = { ...loadInterface(), ...patch }
    saveInterface(next)
    setInterfacePrefs(next)
  }, [])
  const { refreshStats, updateSettings, updateGoals } = engine
  const reloadAudio = audioControls.reload
  const afterImport = useCallback(() => {
    setTheme(loadTheme() ?? systemTheme())
    setInterfacePrefs(loadInterface())
    void reloadAudio()
    refreshStats()
  }, [refreshStats, reloadAudio])
  const closeDialog = dialogs.close
  const saveTimerSettings = useCallback((settings: Settings, goals?: GoalSettings) => {
    updateSettings(settings)
    if (goals) updateGoals(goals)
    closeDialog()
  }, [updateSettings, updateGoals, closeDialog])
  const toastTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  const afterSync = useCallback((message: string) => {
    setSyncToastMessage(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setSyncToastMessage(null), 3500)
    refreshStats()
  }, [refreshStats])

  const todayKey = new Date().toDateString()
  const todayMinutes = engine.stats.history[todayKey] ?? 0

  const dial = (
    <Dial
      mode={engine.mode}
      remainingMs={engine.remainingMs}
      totalMs={engine.totalMs}
      running={engine.running}
      round={engine.round}
      rounds={engine.settings.rounds}
      onToggle={engine.toggle}
      goalEnabled={engine.goals.enabled}
      todayMinutes={todayMinutes}
      dailyTargetMinutes={engine.goals.dailyTargetMinutes}
      goalCelebration={engine.goalCelebration}
    />
  )

  return (
    <div style={accentStyle(engine.mode === 'focus' ? 'focus' : 'break')} className="min-h-[100dvh]">
      {desktopError && <div role="alert" className="fixed top-4 left-4 z-50 max-w-sm rounded-2xl border border-line bg-card p-4 text-body-sm text-ink">
        <p>{t('desktop.error')}</p><p className="break-words text-caption">{desktopError}</p>
        <button className="min-h-11 rounded-full px-4 hover:bg-sunken" onClick={nativeError ? dismissNativeError : () => { void flushPersistence().catch(() => {}) }}>{t(nativeError ? 'desktop.dismiss' : 'desktop.retry')}</button>
      </div>}
      {engine.wakeNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex max-w-md items-center justify-between gap-4 rounded-2xl border border-line bg-card/95 px-4 py-3 text-caption text-ink shadow-elevated backdrop-blur-sm"
        >
          <p className="text-[13px] leading-snug">{engine.wakeNotice}</p>
          <button
            type="button"
            onClick={engine.dismissWakeNotice}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t('wakeDismiss')}
          >
            {t('wakeDismiss')}
          </button>
        </div>
      )}

      <NavPill view={view} onView={changeView} onOpenSettings={dialogs.openApp} />

      <main>
        {view === 'timer' ? (
          <TimerView
            engine={engine}
            ambient={audioControls.prefs.baseTexture}
            binaural={audioControls.prefs.binauralMode}
            onOpenSettings={dialogs.openTimer}
            onOpenSoundSettings={dialogs.openSound}
            onEnterFocus={() => setFocusOpen(true)}
            showGreeting={interfacePrefs.showGreeting}
          />
        ) : view === 'stats' ? (
          <Suspense fallback={<ViewLoading />}>
            <StatsView
              onStartSession={startFromStats}
              key={engine.lastEvent?.at ?? 'stats'}
              stats={engine.stats}
              lang={lang}
              onStatsChange={engine.setStats}
            />
          </Suspense>
        ) : <Suspense fallback={<ViewLoading />}><GuidesView /></Suspense>}

      </main>

      <footer
        className={`footer-safe-bottom pb-28 text-center text-caption text-ink-3 md:pb-10 ${
          view === 'timer' ? 'hidden sm:block' : ''
        }`}
      >
        <div className="mb-2 flex items-center justify-center">
          <SyncStatusIndicator onClick={dialogs.openCloud} />
        </div>
        <div>{t('footer', { year: 2026 })}</div>
      </footer>

      <Onboarding open={!onboardingDone} onDone={() => setOnboardingDone(true)} />

      <AppDialogs stack={dialogs.stack} close={dialogs.close} openShortcuts={dialogs.openShortcuts} openCloud={dialogs.openCloud}
        theme={theme} onTheme={setThemeAndPersist} interfacePrefs={interfacePrefs} onInterfaceChange={changeInterface}
        onImportSuccess={afterImport} settings={engine.settings} goals={engine.goals} onSaveTimer={saveTimerSettings}
        onSyncComplete={afterSync} audio={audioControls} />
      <A11yLiveAnnouncer message={null} />
      {syncToastMessage && <div role="status" className="fixed bottom-6 right-6 z-50 rounded-panel border border-line bg-card px-4 py-3 text-body-sm text-ink">{syncToastMessage}</div>}

      <InstallPrompt
        focusCompleted={engine.lastEvent?.kind === 'focus'}
        onboardingOpen={!onboardingDone}
      />

      <FocusOverlay open={focusOpen} onClose={() => setFocusOpen(false)}>
        {dial}
        <div className="flex items-center gap-3">
          <PillButton variant="primary" className="min-w-[132px]" onClick={engine.toggle}>
            {engine.running ? t('timer.pause') : t('timer.start')}
          </PillButton>
          <PillButton variant="secondary" onClick={engine.reset}>
            {t('timer.reset')}
          </PillButton>
        </div>
      </FocusOverlay>
    </div>
  )
}
