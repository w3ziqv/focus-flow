import { describe, expect, it } from 'vitest'
import { dict as translations } from './translations'
import { TIP_CATEGORIES } from './tips'

describe('translations', () => {
  it('has the same key set in Polish and English', () => {
    const pl = Object.keys(translations.pl).sort()
    const en = Object.keys(translations.en).sort()
    expect(pl).toEqual(en)
  })

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries(translations.pl)) {
      expect(value.trim().length, `pl:${key}`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(translations.en)) {
      expect(value.trim().length, `en:${key}`).toBeGreaterThan(0)
    }
  })
})

describe('tips', () => {
  it('has five categories with content and sources in both languages', () => {
    expect(TIP_CATEGORIES).toHaveLength(5)
    for (const category of TIP_CATEGORIES) {
      expect(category.tips.length).toBeGreaterThan(0)
      for (const tip of category.tips) {
        expect(tip.pl.title.trim()).not.toBe('')
        expect(tip.pl.desc.trim()).not.toBe('')
        expect(tip.pl.source.trim()).not.toBe('')
        expect(tip.en.title.trim()).not.toBe('')
        expect(tip.en.desc.trim()).not.toBe('')
        expect(tip.en.source.trim()).not.toBe('')
      }
    }
  })
})
