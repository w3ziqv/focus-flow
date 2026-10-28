import { languageFromLocales, parseStoredLanguage, type Lang } from '../domain/language'
import { getPersistence } from './desktop/runtime'

/** Recovery can run before storage initialization or the React provider succeeds. */
export function recoveryLanguage(): Lang {
  try {
    const saved = parseStoredLanguage(getPersistence().getItem('ff2_lang'))
    if (saved) return saved
  } catch { /* Keep recovery available when persistence is unavailable. */ }
  if (typeof navigator === 'undefined') return 'en'
  return languageFromLocales([navigator.language, ...(navigator.languages ?? [])])
}
