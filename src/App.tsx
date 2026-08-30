import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { AmbientSound, CustomSound, Theme } from './types'
import { I18nProvider, useI18n } from './lib/i18n'
import { useTimerEngine } from './lib/timer'
import { useShortcuts } from './lib/useShortcuts'
import { useWakeLock } from './lib/useWakeLock'
import { audio } from './lib/audio'
import { accentStyle } from './lib/accent'
import {
  loadCustomSounds,
  loadInterface,
  loadTheme,
  loadVolume,
  MAX_SOUND_SIZE,
  saveCustomSounds,
  saveInterface,
  saveTheme,
  saveVolume,
  systemTheme,
} from './lib/storage'
import { last7Days, sumMinutes } from './lib/stats'
import { NavPill } from './components/NavPill'
import { AppSettingsModal } from './components/AppSettingsModal'
import { TimerSettingsModal } from './components/TimerSettingsModal'
import { FocusOverlay } from './components/FocusOverlay'
import { PillButton } from './components/PillButton'
import { Dial } from './components/Dial'
import { TimerView } from './views/TimerView'

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
  const [timerSettingsOpen, setTimerSettingsOpen] = useState(false)
  const [interfacePrefs, setInterfacePrefs] = useState(loadInterface)
  const [tipsStack, setTipsStack] = useState<TipsRoute[]>([])
  const [focusOpen, setFocusOpen] = useState(false)
  const [sounds, setSounds] = useState<CustomSound[]>(loadCustomSounds)
  const [ambient, setAmbient] = useState<AmbientSound>('none')
  const [volume, setVolume] = useState<number>(loadVolume)
  const [soundMessage, setSoundMessage] = useState<string | null>(null)
  const messageTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('grain')
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    audio.setAmbient(ambient, sounds)
  }, [ambient, sounds])

  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])

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
    (file: File) => {
      if (file.size > MAX_SOUND_SIZE) {
        flashMessage('sound.tooLarge')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') return
        const name = (file.name.replace(/\.[^.]+$/, '').trim() || t('sound.unnamed')).slice(0, 40)
        const record: CustomSound = {
          id: `cs${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
          name,
          dataUrl: reader.result,
        }
        const next = [...sounds, record]
        const persisted = saveCustomSounds(next)
        setSounds(next)
        setAmbient(`custom:${record.id}`)
        if (persisted) {
          flashMessage('sound.added', name)
        } else {
          flashMessage('sound.storageFull')
        }
      }
      reader.readAsDataURL(file)
    },
    [flashMessage, t, sounds],
  )

  const removeSound = useCallback(
    (id: string) => {
      const next = sounds.filter((sound) => sound.id !== id)
      saveCustomSounds(next)
      setSounds(next)
      setAmbient((current) => (current === `custom:${id}` ? 'none' : current))
    },
    [sounds],
  )

  const changeVolume = useCallback((next: number) => {
    setVolume(next)
    saveVolume(next)
  }, [])

  const notify = useCallback(
    (kind: 'focus' | 'break') => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const title = t(kind === 'focus' ? 'session.complete' : 'break.complete')
      const body = kind === 'focus' && engine.task.trim() !== '' ? engine.task : undefined
      try {
        new Notification(title, { body })
      } catch {
        // Some browsers reject constructors outside secure contexts.
      }
    },
    [engine.task, t],
  )

  useEffect(() => {
    if (engine.lastEvent === null) return
    notify(engine.lastEvent.kind)
  }, [engine.lastEvent, notify])

  useShortcuts({
    toggle: engine.toggle,
    reset: engine.reset,
    focusMode: () => setFocusOpen(true),
    escape: () => {
      if (focusOpen) setFocusOpen(false)
      else if (tipsStack.length > 0) setTipsStack((s) => s.slice(0, -1))
      else if (timerSettingsOpen) setTimerSettingsOpen(false)
      else if (appSettingsOpen) setAppSettingsOpen(false)
    },
  })

  const dial = (
    <Dial
      mode={engine.mode}
      remainingMs={engine.remainingMs}
      totalMs={engine.totalMs}
      running={engine.running}
      round={engine.round}
      rounds={engine.settings.rounds}
      onToggle={engine.toggle}
    />
  )

  return (
    <div style={accentStyle(engine.mode === 'focus' ? 'focus' : 'break')} className="min-h-[100dvh]">
      <NavPill view={view} onView={changeView} onOpenSettings={() => setAppSettingsOpen(true)} />

      <main>
        {view === 'timer' ? (
          <TimerView
            engine={engine}
            ambient={ambient}
            sounds={sounds}
            soundMessage={soundMessage}
            volume={volume}
            onAmbientChange={setAmbient}
            onAddSoundFile={addSoundFile}
            onRemoveSound={removeSound}
            onVolumeChange={changeVolume}
            onOpenSettings={() => setTimerSettingsOpen(true)}
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
        onClose={() => setAppSettingsOpen(false)}
      />

      <TimerSettingsModal
        open={timerSettingsOpen}
        settings={engine.settings}
        onClose={() => setTimerSettingsOpen(false)}
        onSave={(settings) => {
          engine.updateSettings(settings)
          setTimerSettingsOpen(false)
        }}
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

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
