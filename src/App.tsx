import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { AmbientSound, BaseSoundTexture, BinauralMode, CustomSound, SoundPreferences, Theme } from './types'
import { I18nProvider, useI18n } from './lib/i18n'
import { useTimerEngine } from './lib/timer'
import { useShortcuts } from './lib/useShortcuts'
import { useWakeLock } from './lib/useWakeLock'
import { audioSubsystem } from './lib/audioSubsystem'
import { dispatchNotification, triggerHapticFeedback } from './lib/notifications'
import { accentStyle } from './lib/accent'
import {
  loadInterface,
  loadOnboardingDone,
  loadTheme,
  saveInterface,
  saveTheme,
  systemTheme,
} from './lib/storage'
import { last7Days, sumMinutes } from './lib/stats'
import { captureInstallPrompt } from './lib/installPrompt'
import { NavPill } from './components/NavPill'
import { AppSettingsModal } from './components/AppSettingsModal'
import { ShortcutsModal } from './components/ShortcutsModal'
import { A11yLiveAnnouncer } from './components/A11yLiveAnnouncer'
import { TimerSettingsModal } from './components/TimerSettingsModal'
import { SoundSettingsDialog } from './components/SoundSettingsDialog'
import { FocusOverlay } from './components/FocusOverlay'
import { InstallPrompt } from './components/InstallPrompt'
import { Onboarding } from './components/Onboarding'
import { PillButton } from './components/PillButton'
import { Dial } from './components/Dial'
import { TimerView } from './views/TimerView'
import { applyTheme } from './lib/theme'
import { announceTimerEvent } from './lib/speech'

const TipsView = lazy(() => import('./views/TopicsIndex'))
const TopicViewLazy = lazy(() => import('./views/TopicView'))
const ArticleViewLazy = lazy(() => import('./views/ArticleView'))
const StatsView = lazy(() => import('./views/StatsView'))

type View = 'timer' | 'stats' | 'tips'

interface TipsRoute {
  topicId: string
  articleId?: string
}

function Shell() {
  const engine = useTimerEngine()
  const { t, lang } = useI18n()
  const [view, setView] = useState<View>('timer')
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme())
  const [appSettingsOpen, setAppSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [timerSettingsOpen, setTimerSettingsOpen] = useState(false)
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false)
  const [interfacePrefs, setInterfacePrefs] = useState(loadInterface)
  const [tipsStack, setTipsStack] = useState<TipsRoute[]>([])
  const [focusOpen, setFocusOpen] = useState(false)
  const [sounds, setSounds] = useState<CustomSound[]>(() => audioSubsystem.getCustomSounds())
  const [soundPrefs, setSoundPrefs] = useState<SoundPreferences>(() => audioSubsystem.getPreferences())
  const [soundMessage, setSoundMessage] = useState<string | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(loadOnboardingDone)
  const messageTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    captureInstallPrompt()
  }, [])

  // Initialize deep Audio Subsystem and subscribe to updates
  useEffect(() => {
    void audioSubsystem.init()
    return audioSubsystem.subscribe(() => {
      setSoundPrefs(audioSubsystem.getPreferences())
      setSounds(audioSubsystem.getCustomSounds())
    })
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
    document.body.style.overflow = focusOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [focusOpen])

  useEffect(() => {
    if (view === 'tips') window.scrollTo({ top: 0 })
  }, [view])

  const flashMessage = useCallback(
    (key: Parameters<typeof t>[0], name?: string) => {
      window.clearTimeout(messageTimer.current)
      setSoundMessage(t(key, name !== undefined ? { name } : undefined))
      messageTimer.current = window.setTimeout(() => setSoundMessage(null), 4000)
    },
    [t],
  )

  const setThemeAndPersist = useCallback((next: Theme) => {
    setTheme(next)
    saveTheme(next)
  }, [])

  const changeView = useCallback((next: View) => {
    setView(next)
    setTipsStack([])
  }, [])

  const addSoundFile = useCallback(
    async (file: File) => {
      const result = await audioSubsystem.addCustomSound(file, t('sound.unnamed'))
      if (!result.ok) {
        if (result.errorKey) flashMessage(result.errorKey)
        return
      }
      flashMessage('sound.added', result.sound?.name ?? '')
    },
    [flashMessage, t],
  )

  const removeSound = useCallback((id: string) => {
    void audioSubsystem.removeCustomSound(id)
  }, [])

  const setAmbientSound = useCallback((sound: AmbientSound) => {
    audioSubsystem.setBaseTexture(sound as BaseSoundTexture)
  }, [])

  const setBinauralMode = useCallback((mode: BinauralMode) => {
    audioSubsystem.setBinaural(mode)
  }, [])

  const setToneWarmth = useCallback((warmth: number) => {
    audioSubsystem.setToneWarmth(warmth)
  }, [])

  const changeVolume = useCallback((next: number) => {
    audioSubsystem.setVolume(next)
  }, [])

  const lastHandledEventRef = useRef<number | null>(null)

  const handleCompletion = useCallback(
    (kind: 'focus' | 'break', taskTitle: string) => {
      const title = t(kind === 'focus' ? 'session.complete' : 'break.complete')
      const currentTask = taskTitle.trim()
      const body = kind === 'focus' && currentTask !== '' ? currentTask : undefined

      try {
        audioSubsystem.playChime()
      } catch {
        // Stay silent if browser blocks audio autoplay
      }

      // Native haptic feedback triggered upon session completion
      triggerHapticFeedback()

      announceTimerEvent(
        { type: kind === 'focus' ? 'session-complete' : 'break-complete', task: currentTask },
        interfacePrefs.narration,
        lang,
      )

      // Unified mobile ServiceWorker and desktop notification dispatcher
      void dispatchNotification(title, { body, hapticFeedback: false })
    },
    [t, interfacePrefs.narration, lang],
  )

  useEffect(() => {
    if (engine.lastEvent === null) return
    if (lastHandledEventRef.current === engine.lastEvent.at) return
    lastHandledEventRef.current = engine.lastEvent.at
    handleCompletion(engine.lastEvent.kind, engine.task)
  }, [engine.lastEvent, engine.task, handleCompletion])

  const prevRunningRef = useRef(engine.running)
  const prevRoundRef = useRef(engine.round)
  const prevModeRef = useRef(engine.mode)

  useEffect(() => {
    if (prevRunningRef.current !== engine.running) {
      if (engine.running) {
        announceTimerEvent(
          { type: 'session-start', task: engine.task },
          interfacePrefs.narration,
          lang,
        )
      } else if (lastHandledEventRef.current !== engine.lastEvent?.at) {
        // Paused manually by user (not an auto-completion)
        announceTimerEvent(
          { type: 'session-pause' },
          interfacePrefs.narration,
          lang,
        )
      }
      prevRunningRef.current = engine.running
    }
  }, [engine.running, engine.task, engine.lastEvent, interfacePrefs.narration, lang])

  useEffect(() => {
    if (prevRoundRef.current !== engine.round) {
      if (engine.round > prevRoundRef.current) {
        announceTimerEvent(
          { type: 'round-advance', round: engine.round, totalRounds: engine.settings.rounds },
          interfacePrefs.narration,
          lang,
        )
      }
      prevRoundRef.current = engine.round
    }
  }, [engine.round, engine.settings.rounds, interfacePrefs.narration, lang])

  useEffect(() => {
    if (prevModeRef.current !== engine.mode) {
      if (engine.mode !== 'focus' && engine.running) {
        announceTimerEvent(
          { type: 'break-start', mode: engine.mode === 'long' ? 'long' : 'short' },
          interfacePrefs.narration,
          lang,
        )
      }
      prevModeRef.current = engine.mode
    }
  }, [engine.mode, engine.running, interfacePrefs.narration, lang])

  useShortcuts(
    {
      toggle: engine.toggle,
      reset: engine.reset,
      focusMode: () => setFocusOpen(true),
      openShortcuts: () => setShortcutsOpen(true),
      escape: () => {
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (focusOpen) setFocusOpen(false)
        else if (soundSettingsOpen) setSoundSettingsOpen(false)
        else if (tipsStack.length > 0) setTipsStack((s) => s.slice(0, -1))
        else if (timerSettingsOpen) setTimerSettingsOpen(false)
        else if (appSettingsOpen) setAppSettingsOpen(false)
      },
    },
    interfacePrefs.shortcuts,
  )

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

      <NavPill view={view} onView={changeView} onOpenSettings={() => setAppSettingsOpen(true)} />

      <main>
        {view === 'timer' ? (
          <TimerView
            engine={engine}
            ambient={soundPrefs.baseTexture}
            binaural={soundPrefs.binauralMode}
            onOpenSettings={() => setTimerSettingsOpen(true)}
            onOpenSoundSettings={() => setSoundSettingsOpen(true)}
            onEnterFocus={() => setFocusOpen(true)}
            showGreeting={interfacePrefs.showGreeting}
          />
        ) : view === 'stats' ? (
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <StatsView
              key={engine.lastEvent?.at ?? 'stats'}
              stats={engine.stats}
              lang={lang}
              chartDays={last7Days(engine.stats, lang)}
              totalMinutes={sumMinutes(last7Days(engine.stats, lang))}
              onStatsChange={engine.setStats}
            />
          </Suspense>
        ) : tipsStack.length === 0 ? (
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <TipsView onOpenTopic={(topicId) => setTipsStack([{ topicId }])} />
          </Suspense>
        ) : tipsStack.length === 1 ? (
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <TopicViewLazy
              topicId={tipsStack[0].topicId}
              onBack={() => setTipsStack([])}
              onOpenArticle={(articleId) => setTipsStack((s) => [...s, { topicId: s[0].topicId, articleId }])}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <ArticleViewLazy
              topicId={tipsStack[0].topicId}
              articleId={tipsStack[tipsStack.length - 1].articleId ?? ''}
              onBack={() => setTipsStack((s) => s.slice(0, -1))}
            />
          </Suspense>
        )}
      </main>

      <footer className="footer-safe-bottom pb-28 text-center text-caption text-ink-3 md:pb-10">
        {t('footer', { year: 2026 })}
      </footer>

      <Onboarding open={!onboardingDone} onDone={() => setOnboardingDone(true)} />

      <AppSettingsModal
        open={appSettingsOpen}
        theme={theme}
        onTheme={setThemeAndPersist}
        interfacePrefs={interfacePrefs}
        onInterfaceChange={(patch) => {
          setInterfacePrefs((prev) => {
            const next = { ...prev, ...patch }
            saveInterface(next)
            return next
          })
        }}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onImportSuccess={() => {
          setTheme(loadTheme() ?? systemTheme())
          setInterfacePrefs(loadInterface())
          void audioSubsystem.init().then(() => {
            setSounds(audioSubsystem.getCustomSounds())
            setSoundPrefs(audioSubsystem.getPreferences())
          })
          engine.refreshStats()
        }}
        onClose={() => setAppSettingsOpen(false)}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        shortcuts={interfacePrefs.shortcuts}
        onSaveShortcuts={(shortcuts) => {
          setInterfacePrefs((prev) => {
            const next = { ...prev, shortcuts }
            saveInterface(next)
            return next
          })
        }}
        onClose={() => setShortcutsOpen(false)}
      />

      <A11yLiveAnnouncer message={null} />

      <TimerSettingsModal
        open={timerSettingsOpen}
        settings={engine.settings}
        goals={engine.goals}
        onClose={() => setTimerSettingsOpen(false)}
        onSave={(settings, goals) => {
          engine.updateSettings(settings)
          if (goals) engine.updateGoals(goals)
          setTimerSettingsOpen(false)
        }}
      />

      <SoundSettingsDialog
        open={soundSettingsOpen}
        current={soundPrefs.baseTexture}
        binaural={soundPrefs.binauralMode}
        toneWarmth={soundPrefs.toneWarmthCutoff}
        volume={soundPrefs.volume}
        sounds={sounds}
        message={soundMessage}
        onChange={setAmbientSound}
        onBinauralChange={setBinauralMode}
        onToneWarmthChange={setToneWarmth}
        onVolumeChange={changeVolume}
        onAddFile={addSoundFile}
        onRemove={removeSound}
        onClose={() => setSoundSettingsOpen(false)}
      />

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

export default function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
