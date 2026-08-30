import { useCallback, useEffect, useRef, useState } from 'react'
import type { AmbientSound, CustomSound, Theme } from './types'
import { I18nProvider, useI18n } from './lib/i18n'
import { useTimerEngine } from './lib/timer'
import { useShortcuts } from './lib/useShortcuts'
import { audio } from './lib/audio'
import { accentStyle } from './lib/accent'
import {
  loadCustomSounds,
  loadTheme,
  MAX_SOUND_SIZE,
  saveCustomSounds,
  saveTheme,
  systemTheme,
} from './lib/storage'
import { NavPill } from './components/NavPill'
import { SettingsModal } from './components/SettingsModal'
import { FocusOverlay } from './components/FocusOverlay'
import { PillButton } from './components/PillButton'
import { Dial } from './components/Dial'
import { TimerView } from './views/TimerView'
import { TipsView } from './views/TipsView'

type View = 'timer' | 'tips'

function Shell() {
  const engine = useTimerEngine()
  const { t, lang, setLang } = useI18n()
  const [view, setView] = useState<View>('timer')
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [sounds, setSounds] = useState<CustomSound[]>(loadCustomSounds)
  const [ambient, setAmbient] = useState<AmbientSound>('none')
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

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'pl' ? 'en' : 'pl')
  }, [lang, setLang])

  const changeView = useCallback((next: View) => {
    setView(next)
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
        setSounds((prev) => {
          const next = [...prev, record]
          saveCustomSounds(next)
          return next
        })
        setAmbient(`custom:${record.id}`)
        flashMessage('sound.added', name)
      }
      reader.readAsDataURL(file)
    },
    [flashMessage, t],
  )

  const removeSound = useCallback(
    (id: string) => {
      setSounds((prev) => {
        const next = prev.filter((sound) => sound.id !== id)
        saveCustomSounds(next)
        return next
      })
      setAmbient((current) => (current === `custom:${id}` ? 'none' : current))
    },
    [],
  )

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
      else if (settingsOpen) setSettingsOpen(false)
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
    />
  )

  return (
    <div style={accentStyle(engine.mode === 'focus' ? 'focus' : 'break')} className="min-h-[100dvh]">
      <NavPill
        view={view}
        onView={changeView}
        theme={theme}
        onTheme={toggleTheme}
        lang={lang}
        onLang={toggleLang}
      />

      <main>
        {view === 'timer' ? (
          <TimerView
            engine={engine}
            ambient={ambient}
            sounds={sounds}
            soundMessage={soundMessage}
            onAmbientChange={setAmbient}
            onAddSoundFile={addSoundFile}
            onRemoveSound={removeSound}
            onOpenSettings={() => setSettingsOpen(true)}
            onEnterFocus={() => setFocusOpen(true)}
          />
        ) : (
          <TipsView />
        )}
      </main>

      <footer className="pb-28 text-center text-caption text-ink-3 md:pb-10">
        {t('footer', { year: 2026 })}
      </footer>

      <SettingsModal
        open={settingsOpen}
        settings={engine.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(settings) => {
          engine.updateSettings(settings)
          setSettingsOpen(false)
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
