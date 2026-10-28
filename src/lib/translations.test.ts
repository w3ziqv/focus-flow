import { describe, expect, it } from 'vitest'
import { LANGUAGE_CODES } from '../domain/language'
import { articleCount, dict, formatNumber, translate, type TranslationKey } from './translations'

const placeholders = (text: string) => [...text.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort()

describe('four complete UI dictionaries', () => {
  it.each(LANGUAGE_CODES)('%s has every key and preserves every interpolation variable', lang => {
    expect(Object.keys(dict[lang]).sort()).toEqual(Object.keys(dict.en).sort())
    for (const key of Object.keys(dict.en) as TranslationKey[]) {
      expect(dict[lang][key].trim(), `${lang}:${key}`).not.toBe('')
      expect(placeholders(dict[lang][key]), `${lang}:${key}`).toEqual(placeholders(dict.en[key]))
    }
  })

  it('uses native Spanish and Chinese on critical action/error surfaces', () => {
    expect(translate('es', 'timer.start')).toBe('Iniciar')
    expect(translate('zh', 'timer.pause')).toBe('暂停')
    expect(translate('es', 'data.description')).toContain('Exporta')
    expect(translate('zh', 'recovery.viewTitle')).toBe('无法打开此页面')
    expect(translate('zh', 'sync.deleteDescription')).toContain('无法撤销')
  })

  it('formats numbers for the chosen language', () => {
    expect(formatNumber('es', 12500.5)).toBe('12.500,5')
    expect(formatNumber('zh', 12500.5)).toBe('12,500.5')
    expect(translate('zh', 'log.totalSessions', {count:12500})).toContain('12,500')
  })

  it('does not interpret user task text as a second template', () => {
    expect(translate('en', 'narration.startTask', {task:'Read {round}',round:4})).toBe('Focus session started: Read {round}')
  })

  it('handles Polish and Spanish article counts instead of fixed plural suffixes', () => {
    expect(articleCount('pl', 1)).toBe('1 artykuł')
    expect(articleCount('pl', 2)).toBe('2 artykuły')
    expect(articleCount('pl', 5)).toBe('5 artykułów')
    expect(articleCount('pl', 22)).toBe('22 artykuły')
    expect(articleCount('es', 1)).toBe('1 guía')
    expect(articleCount('zh', 4)).toBe('4 篇指南')
  })
})
