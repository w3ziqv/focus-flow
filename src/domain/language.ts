/** Persisted language codes. Keep these stable in backups and native snapshots. */
export const LANGUAGE_CODES = ['pl', 'en', 'es', 'zh'] as const
export type Lang = (typeof LANGUAGE_CODES)[number]

export const LANGUAGE_META: Record<Lang, { name: string; locale: string; htmlLang: string }> = {
  pl: { name: 'Polski', locale: 'pl-PL', htmlLang: 'pl' },
  en: { name: 'English', locale: 'en-GB', htmlLang: 'en' },
  es: { name: 'Español', locale: 'es-ES', htmlLang: 'es' },
  zh: { name: '简体中文', locale: 'zh-CN', htmlLang: 'zh-Hans' },
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && LANGUAGE_CODES.some(code => code === value)
}

/** Accept the JSON representation and the plain-string legacy preference. */
export function parseStoredLanguage(raw: string | null): Lang | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    return isLang(value) ? value : null
  } catch {
    return isLang(raw) ? raw : null
  }
}

export function languageFromLocales(locales: readonly string[]): Lang {
  for (const locale of locales) {
    const language = locale.toLowerCase().split(/[-_]/)[0]
    if (isLang(language)) return language
  }
  return 'en'
}

export function localeFor(lang: Lang): string {
  return LANGUAGE_META[lang].locale
}
