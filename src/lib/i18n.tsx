import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang } from '../types'
import { loadLang, saveLang, systemLang } from './storage'
import { translate } from './translations'
import type { TranslationKey } from './translations'
import { applyDocumentLanguage } from './documentLanguage'


export type I18nContextValue = {
  lang: Lang
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(() => loadLang() ?? systemLang())

  useEffect(() => {
    applyDocumentLanguage(lang)
  }, [lang])

  useEffect(() => {
    const refresh = (event: Event) => {
      const key = event instanceof StorageEvent ? event.key : (event as CustomEvent<string>).detail
      if (key === 'ff2_lang' || key === null) setLangState(loadLang() ?? systemLang())
    }
    window.addEventListener('focus-flow:storage', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus-flow:storage', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      return translate(lang, key, vars)
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
