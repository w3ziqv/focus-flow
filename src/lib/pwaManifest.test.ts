import { expect, it } from 'vitest'
import { LANGUAGE_CODES, LANGUAGE_META } from '../domain/language'
import { manifestForLanguage } from './pwaManifest'

it('localizes OS-facing metadata without changing installed app identity or routes', () => {
  for (const lang of LANGUAGE_CODES) {
    const manifest = manifestForLanguage(lang)
    expect(manifest.lang).toBe(LANGUAGE_META[lang].htmlLang)
    expect(manifest.id).toBe('/')
    expect(manifest.scope).toBe('/')
    expect(manifest.start_url).toBe('/')
    expect(manifest.shortcuts?.[0].url).toBe('/?start=focus')
    if (lang !== 'en') {
      expect(manifest.description).not.toBe(manifestForLanguage('en').description)
      expect(manifest.shortcuts?.[0].name).not.toBe(manifestForLanguage('en').shortcuts?.[0].name)
    }
  }
})
