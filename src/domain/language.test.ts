import { describe, expect, it } from 'vitest'
import { LANGUAGE_CODES, LANGUAGE_META, isLang, languageFromLocales, parseStoredLanguage } from './language'

describe('persisted language contract', () => {
  it.each(LANGUAGE_CODES)('retains %s in current JSON and legacy plain storage', code => {
    expect(parseStoredLanguage(JSON.stringify(code))).toBe(code)
    expect(parseStoredLanguage(code)).toBe(code)
    expect(isLang(code)).toBe(true)
  })

  it.each([null, 'null', '{}', '["es"]', '"fr"', '"constructor"', '"__proto__"', 'es-ES', ''])('rejects invalid storage %s', raw => {
    expect(parseStoredLanguage(raw)).toBeNull()
  })

  it('detects regional variants without storing unstable region codes', () => {
    expect(languageFromLocales(['fr-FR', 'es-MX', 'en-US'])).toBe('es')
    expect(languageFromLocales(['zh-Hans-CN'])).toBe('zh')
    expect(languageFromLocales(['pl_PL'])).toBe('pl')
    expect(languageFromLocales(['de-DE'])).toBe('en')
    expect(LANGUAGE_META.zh.htmlLang).toBe('zh-Hans')
  })
})
