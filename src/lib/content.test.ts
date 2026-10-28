import { describe, expect, it } from 'vitest'
import { LANGUAGE_CODES } from '../domain/language'
import { ARTICLES, articleById, readMinutes, totalReadMinutesForTopic } from './articles'
import { GUIDE_CATALOG, GUIDE_SOURCES } from './guides/catalog'
import { TOPICS } from './topics'

describe('reviewed guide content', () => {
  it('preserves all 27 routes and seven topics with complete four-language copy', () => {
    expect(Object.keys(ARTICLES)).toHaveLength(27)
    expect(TOPICS).toHaveLength(7)
    for (const topic of TOPICS) for (const lang of LANGUAGE_CODES) {
      expect(topic.copy[lang].title.trim()).not.toBe('')
      expect(topic.copy[lang].description.trim()).not.toBe('')
      expect(totalReadMinutesForTopic(topic.id, lang)).toBeGreaterThan(0)
    }
    for (const [id, article] of Object.entries(ARTICLES)) {
      expect(article.id).toBe(id)
      expect(articleById(article.topicId, id)).toBe(article)
      expect(TOPICS.some(topic => topic.id === article.topicId)).toBe(true)
      expect(article.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.sources.length).toBeGreaterThan(0)
      expect(Object.keys(article.content).sort()).toEqual([...LANGUAGE_CODES].sort())
      for (const lang of LANGUAGE_CODES) {
        const copy = article.content[lang]
        for (const text of [copy.title, copy.intro, copy.evidence, copy.limits, ...copy.steps]) {
          expect(text.trim(), `${id}:${lang}`).not.toBe('')
          expect(text).not.toMatch(/\{[^{}]+\}|\bTODO:|lorem ipsum/i)
        }
        expect(copy.steps).toHaveLength(4)
        expect(readMinutes(article, lang)).toBeGreaterThan(0)
        if (lang !== 'en') expect(copy).not.toEqual(article.content.en)
      }
    }
  })
  it('uses canonical HTTPS references without credentials, query tokens or fragments', () => {
    for (const source of Object.values(GUIDE_SOURCES)) {
      const url = new URL(source.url)
      expect(url.protocol).toBe('https:')
      expect(url.username + url.password + url.search + url.hash).toBe('')
      expect(source.label.trim()).not.toBe('')
    }
    for (const meta of Object.values(GUIDE_CATALOG)) for (const id of meta.sources) expect(GUIDE_SOURCES[id]).toBeDefined()
  })
  it('rejects unknown, prototype and wrong-topic routes', () => {
    expect(articleById('learning', 'missing')).toBeNull()
    expect(articleById('learning', '__proto__')).toBeNull()
    expect(articleById('learning', 'constructor')).toBeNull()
    expect(articleById('sleep', 'learning-recall')).toBeNull()
  })
  it('counts Chinese without requiring whitespace and isolates each locale', () => {
    const base = ARTICLES['learning-recall']
    const longChinese = { ...base.content.zh, intro: '学'.repeat(1400) }
    const extended = { ...base, content: { ...base.content, zh: longChinese } }
    expect(readMinutes(extended, 'zh')).toBeGreaterThanOrEqual(4)
    expect(readMinutes(extended, 'pl')).toBe(readMinutes(base, 'pl'))
    const padded = { ...base, content: { ...base.content, en: { ...base.content.en, intro: `  ${base.content.en.intro}  ` } } }
    expect(readMinutes(padded, 'en')).toBe(readMinutes(base, 'en'))
  })
})
