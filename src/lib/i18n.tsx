import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang } from '../types'
import { loadLang, saveLang } from './storage'

const dict = {
  pl: {
    'app.name': 'Focus Flow',
    'nav.timer': 'Timer',
    'nav.tips': 'Wskazówki',
    'nav.theme': 'Przełącz motyw',
    'nav.lang': 'Zmień język',
    'mode.focus': 'Focus',
    'mode.short': 'Krótka przerwa',
    'mode.long': 'Długa przerwa',
    'timer.round': 'Runda {n} z {total}',
    'timer.start': 'Start',
    'timer.pause': 'Pauza',
    'timer.reset': 'Reset',
    'timer.settings': 'Ustawienia',
    'timer.shortcuts': 'Space start · R reset · F tryb focus',
    'timer.aria': 'Pozostało {time}. Tryb {mode}.',
    'task.placeholder': 'Nad czym pracujesz?',
    'task.committed': 'W tej sesji:',
    'task.done': 'Zrobione:',
    'sound.off': 'Cisza',
    'sound.group': 'Dźwięki otoczenia',
    'sound.rain': 'Deszcz',
    'sound.noise': 'Szum',
    'sound.add': 'Dodaj dźwięk',
    'sound.choose': 'Wybierz plik audio (maks. 4 MB)',
    'sound.tooLarge': 'Plik jest za duży. Maksymalny rozmiar to 4 MB.',
    'sound.added': 'Dodano: {name}',
    'sound.remove': 'Usuń {name}',
    'sound.unnamed': 'Mój dźwięk',
    'stat.today': 'dzisiaj',
    'stat.week': 'w tym tygodniu',
    'stat.streak': 'dni z rzędu',
    'stat.minutes': 'minut focusu',
    'chart.label': 'Minuty focusu — ostatnie 7 dni',
    'chart.aria': 'Wykres minut focusu z ostatnich 7 dni. Łącznie {total} minut.',
    'chart.day': '{day}: {minutes} min',
    'break.tip': 'Na przerwę',
    'focus.enter': 'Tryb focus',
    'focus.exit': 'Wyjdź',
    'session.complete': 'Sesja zakończona',
    'break.complete': 'Przerwa zakończona',
    'settings.title': 'Ustawienia timera',
    'settings.focus': 'Focus (min)',
    'settings.short': 'Krótka przerwa (min)',
    'settings.long': 'Długa przerwa (min)',
    'settings.rounds': 'Rund do długiej przerwy',
    'settings.autoStart': 'Auto-start kolejnej fazy',
    'settings.save': 'Zapisz',
    'settings.cancel': 'Anuluj',
    'tips.title': 'Wskazówki',
    'tips.desc': 'Praktyczne, sprawdzone porady jak się uczyć i pracować. Kliknij kategorię, aby rozwinąć.',
    'footer': '© {year} Focus Flow',
  },
  en: {
    'app.name': 'Focus Flow',
    'nav.timer': 'Timer',
    'nav.tips': 'Tips',
    'nav.theme': 'Toggle theme',
    'nav.lang': 'Switch language',
    'mode.focus': 'Focus',
    'mode.short': 'Short break',
    'mode.long': 'Long break',
    'timer.round': 'Round {n} of {total}',
    'timer.start': 'Start',
    'timer.pause': 'Pause',
    'timer.reset': 'Reset',
    'timer.settings': 'Settings',
    'timer.shortcuts': 'Space start · R reset · F focus mode',
    'timer.aria': '{time} remaining. {mode} mode.',
    'task.placeholder': 'What are you working on?',
    'task.committed': 'This session:',
    'task.done': 'Done:',
    'sound.off': 'Off',
    'sound.group': 'Ambient sounds',
    'sound.rain': 'Rain',
    'sound.noise': 'Noise',
    'sound.add': 'Add sound',
    'sound.choose': 'Choose an audio file (max 4 MB)',
    'sound.tooLarge': 'File is too large. Maximum size is 4 MB.',
    'sound.added': 'Added: {name}',
    'sound.remove': 'Remove {name}',
    'sound.unnamed': 'My sound',
    'stat.today': 'today',
    'stat.week': 'this week',
    'stat.streak': 'day streak',
    'stat.minutes': 'focus minutes',
    'chart.label': 'Focus minutes — last 7 days',
    'chart.aria': 'Bar chart of focus minutes over the last 7 days. {total} minutes in total.',
    'chart.day': '{day}: {minutes} min',
    'break.tip': 'While you rest',
    'focus.enter': 'Focus mode',
    'focus.exit': 'Exit',
    'session.complete': 'Session complete',
    'break.complete': 'Break over',
    'settings.title': 'Timer settings',
    'settings.focus': 'Focus (min)',
    'settings.short': 'Short break (min)',
    'settings.long': 'Long break (min)',
    'settings.rounds': 'Rounds until long break',
    'settings.autoStart': 'Auto-start next phase',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
    'tips.title': 'Tips',
    'tips.desc': 'Practical, proven advice on studying and working. Click a category to expand it.',
    'footer': '© {year} Focus Flow',
  },
} as const

export type TranslationKey = keyof (typeof dict)['pl']

type I18nContextValue = {
  lang: Lang
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang() ?? 'pl')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text: string = dict[lang][key]
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
