import { describe, expect, it } from 'vitest'
import { dict as translations } from './translations'
import { ARTICLES } from './articles'
import { TOPICS } from './topics'

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

describe('topics and articles', () => {
  it('has seven topics with descriptions in both languages', () => {
    expect(TOPICS).toHaveLength(7)
    for (const topic of TOPICS) {
      expect(topic.descPl.trim()).not.toBe('')
      expect(topic.descEn.trim()).not.toBe('')
    }
  })

  it('has at least one methodical article per topic in both languages', () => {
    for (const topic of TOPICS) {
      const articles = Object.values(ARTICLES).filter((a) => a.topicId === topic.id)
      expect(articles.length, `topic ${topic.id}`).toBeGreaterThanOrEqual(1)
      for (const article of articles) {
        expect(article.sections.length).toBeGreaterThanOrEqual(3)
        for (const s of article.sections) {
          expect(s.hPl.trim()).not.toBe('')
          expect(s.hEn.trim()).not.toBe('')
          expect(s.pPl.trim()).not.toBe('')
          expect(s.pEn.trim()).not.toBe('')
        }
        expect(article.sourcesPl.length).toBeGreaterThanOrEqual(2)
        expect(article.sourcesEn.length).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
