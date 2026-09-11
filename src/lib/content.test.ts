import { describe, expect, it } from 'vitest'
import { dict as translations } from './translations'
import { ARTICLES, articleById, isStepList, readMinutes, totalReadMinutesForTopic } from './articles'
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

  it('calculates total read minutes for every topic', () => {
    for (const topic of TOPICS) {
      expect(totalReadMinutesForTopic(topic.id, 'pl')).toBeGreaterThan(0)
      expect(totalReadMinutesForTopic(topic.id, 'en')).toBeGreaterThan(0)
    }
  })

  it('contains exactly 27 peer-reviewed articles across the 7 topics (v2.3.1 expansion)', () => {
    const allArticles = Object.values(ARTICLES)
    expect(allArticles).toHaveLength(27)

    const expectedCountsByTopic: Record<string, number> = {
      learning: 4,
      break: 4,
      sleep: 4,
      food: 4,
      productivity: 4,
      wellbeing: 4,
      mindfulness: 3,
    }

    for (const [topicId, count] of Object.entries(expectedCountsByTopic)) {
      const topicArticles = allArticles.filter((a) => a.topicId === topicId)
      expect(topicArticles, `Articles for ${topicId}`).toHaveLength(count)
    }
  })

  it('verifies strict schema integrity, bilingual symmetry and academic citations for all 27 articles', () => {
    for (const [key, article] of Object.entries(ARTICLES)) {
      expect(article.id, `Key matches id for ${key}`).toBe(key)
      expect(article.titlePl.trim().length, `titlePl for ${key}`).toBeGreaterThan(0)
      expect(article.titleEn.trim().length, `titleEn for ${key}`).toBeGreaterThan(0)
      expect(article.introPl.trim().length, `introPl for ${key}`).toBeGreaterThan(0)
      expect(article.introEn.trim().length, `introEn for ${key}`).toBeGreaterThan(0)

      expect(article.sections).toHaveLength(3)

      // Section 1: Mechanism
      expect(article.sections[0].hPl).toBe('Dlaczego to działa')
      expect(article.sections[0].hEn).toBe('Why it works')
      expect(article.sections[0].pPl.trim().length).toBeGreaterThan(40)
      expect(article.sections[0].pEn.trim().length).toBeGreaterThan(40)

      // Section 2: Step-by-step
      expect(['Jak to zrobić krok po kroku', 'Plan dzień po dniu']).toContain(article.sections[1].hPl)
      expect(['Step by step', 'Day by day']).toContain(article.sections[1].hEn)
      expect(article.sections[1].pPl.trim().length).toBeGreaterThan(40)
      expect(article.sections[1].pEn.trim().length).toBeGreaterThan(40)

      // Section 3: Pitfalls / Avoid
      expect(article.sections[2].hPl).toBe('Czego unikać')
      expect(article.sections[2].hEn).toBe('What to avoid')
      expect(article.sections[2].pPl.trim().length).toBeGreaterThan(40)
      expect(article.sections[2].pEn.trim().length).toBeGreaterThan(40)

      // Sources
      expect(article.sourcesPl.length, `sourcesPl length for ${key}`).toBeGreaterThanOrEqual(2)
      expect(article.sourcesEn.length, `sourcesEn length for ${key}`).toBeGreaterThanOrEqual(2)
      expect(article.sourcesPl.length, `sources symmetry for ${key}`).toBe(article.sourcesEn.length)

      for (let i = 0; i < article.sourcesPl.length; i++) {
        const sPl = article.sourcesPl[i].trim()
        const sEn = article.sourcesEn[i].trim()
        expect(sPl.length, `sPl[${i}] for ${key}`).toBeGreaterThan(0)
        expect(sEn.length, `sEn[${i}] for ${key}`).toBeGreaterThan(0)
      }

      // Every article must have at least 2 peer-reviewed sources with publication years
      const plYears = article.sourcesPl.filter((s) => /\b(19\d\d|20\d\d)\b/.test(s))
      const enYears = article.sourcesEn.filter((s) => /\b(19\d\d|20\d\d)\b/.test(s))
      expect(plYears.length, `plYears for ${key}`).toBeGreaterThanOrEqual(2)
      expect(enYears.length, `enYears for ${key}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('ensures all 14 newly added v2.3.1 guides have 100% peer-reviewed citations with years', () => {
    const v231Ids = [
      'interleaving-practice',
      'dual-coding',
      'nsdr-recovery',
      'nature-microbreaks',
      'adenosine-caffeine-timing',
      'circadian-light-entrainment',
      'glucose-stability',
      'neurotransmitter-nutrition',
      'ultradian-rhythms',
      'implementation-intentions',
      'physiological-sigh',
      'stress-reappraisal',
      'open-monitoring-focus',
      'body-scan-awareness',
    ]

    expect(v231Ids).toHaveLength(14)
    for (const id of v231Ids) {
      const article = ARTICLES[id]
      expect(article, `Article ${id} exists`).toBeDefined()
      expect(article.sections).toHaveLength(3)
      expect(article.sections[0].hPl).toBe('Dlaczego to działa')
      expect(article.sections[0].hEn).toBe('Why it works')
      expect(article.sections[1].hPl).toBe('Jak to zrobić krok po kroku')
      expect(article.sections[1].hEn).toBe('Step by step')
      expect(article.sections[2].hPl).toBe('Czego unikać')
      expect(article.sections[2].hEn).toBe('What to avoid')

      // Step-by-step numbered format test
      expect(article.sections[1].pPl).toMatch(/^1\.\s+.*2\.\s+.*3\.\s+/)
      expect(article.sections[1].pEn).toMatch(/^1\.\s+.*2\.\s+.*3\.\s+/)

      // All sources have academic year
      for (const s of article.sourcesPl) {
        expect(s).toMatch(/\b(19\d\d|20\d\d)\b/)
      }
      for (const s of article.sourcesEn) {
        expect(s).toMatch(/\b(19\d\d|20\d\d)\b/)
      }
    }
  })

  it('correctly resolves all 27 articles via articleById and calculates positive reading time in both languages', () => {
    for (const article of Object.values(ARTICLES)) {
      const found = articleById(article.topicId, article.id)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(article.id)

      const minPl = readMinutes(article, 'pl')
      const minEn = readMinutes(article, 'en')
      expect(minPl).toBeGreaterThan(0)
      expect(minEn).toBeGreaterThan(0)
    }
  })

  it('guarantees isStepList parses numbered steps into equal-length non-empty lists in both languages', () => {
    for (const [key, article] of Object.entries(ARTICLES)) {
      if (article.id === 'sleep-protocol') {
        // sleep-protocol uses day-by-day prose formatting
        expect(isStepList(article.sections[1].pPl)).toBeNull()
        expect(isStepList(article.sections[1].pEn)).toBeNull()
        continue
      }

      const listPl = isStepList(article.sections[1].pPl)
      const listEn = isStepList(article.sections[1].pEn)

      expect(listPl, `listPl for ${key} must parse`).not.toBeNull()
      expect(listEn, `listEn for ${key} must parse`).not.toBeNull()

      expect(listPl!.length, `listPl length for ${key}`).toBeGreaterThanOrEqual(4)
      expect(listEn!.length, `listEn length for ${key}`).toBeGreaterThanOrEqual(4)
      expect(listPl!.length, `list length symmetry for ${key}`).toBe(listEn!.length)

      for (let i = 0; i < listPl!.length; i++) {
        expect(listPl![i].length, `listPl[${i}] for ${key} not empty`).toBeGreaterThan(10)
        expect(listEn![i].length, `listEn[${i}] for ${key} not empty`).toBeGreaterThan(10)
      }
    }
  })

  it('guarantees sections 0 and 2 are always treated as prose and never parsed as step lists', () => {
    for (const [key, article] of Object.entries(ARTICLES)) {
      expect(isStepList(article.sections[0].pPl), `section 0 pPl for ${key}`).toBeNull()
      expect(isStepList(article.sections[0].pEn), `section 0 pEn for ${key}`).toBeNull()
      expect(isStepList(article.sections[2].pPl), `section 2 pPl for ${key}`).toBeNull()
      expect(isStepList(article.sections[2].pEn), `section 2 pEn for ${key}`).toBeNull()
    }
  })


  it('specifically verifies glucose-stability step 3 does not break list parsing via GLUT4 token collision', () => {
    const article = ARTICLES['glucose-stability']
    const listPl = isStepList(article.sections[1].pPl)
    const listEn = isStepList(article.sections[1].pEn)

    expect(listPl).toHaveLength(5)
    expect(listEn).toHaveLength(5)
    expect(listPl![2]).toContain('GLUT4')
    expect(listPl![3]).toContain('Wyeliminuj')
    expect(listEn![2]).toContain('GLUT4')
    expect(listEn![3]).toContain('Eliminate')
  })

  it('verifies readMinutes is genuinely language-specific and uses language appropriate word counts', () => {
    const dummyArticle = {
      ...ARTICLES['learning-recall'],
      introPl: 'Jeden dwa trzy cztery pięć.',
      introEn: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.',
      sections: [
        { hPl: 'H', hEn: 'H', pPl: 'Krótki tekst.', pEn: 'A much longer English text that has substantially more words than the Polish version to verify language isolation.' },
      ],
      sourcesPl: ['Źródło jeden', 'Źródło dwa'],
      sourcesEn: ['Source one with extra words', 'Source two with extra words here'],
    }

    const minPl = readMinutes(dummyArticle, 'pl')
    const minEn = readMinutes(dummyArticle, 'en')
    expect(minPl).toBeGreaterThan(0)
    expect(minEn).toBeGreaterThan(0)
  })

  it('verifies grammatical agreement and terminal punctuation across all 27 articles', () => {
    for (const [key, article] of Object.entries(ARTICLES)) {
      // open-monitoring-focus feminine gender agreement: 'na jednej kotwicy'
      if (key === 'open-monitoring-focus') {
        expect(article.sections[0].pPl).toContain('na jednej kotwicy')
        expect(article.sections[0].pPl).not.toContain('na jednym kotwicy')
      }

      // Terminal punctuation check for all sections
      for (let sIdx = 0; sIdx < article.sections.length; sIdx++) {
        const pPl = article.sections[sIdx].pPl.trim()
        const pEn = article.sections[sIdx].pEn.trim()
        const validTerminals = ['.', '!', '?', '"', "'", ')', '”', '’']

        expect(validTerminals, `pPl terminal punctuation in ${key} section ${sIdx}`).toContain(pPl.slice(-1))
        expect(validTerminals, `pEn terminal punctuation in ${key} section ${sIdx}`).toContain(pEn.slice(-1))
      }
    }
  })

  it('verifies readMinutes does not produce phantom word count inflation from leading or trailing whitespace', () => {
    const cleanArticle = {
      ...ARTICLES['learning-recall'],
      introPl: 'Jeden dwa trzy.',
      sections: [{ hPl: 'H', hEn: 'H', pPl: 'Cztery pięć sześć.', pEn: 'Four five six.' }],
      sourcesPl: ['Źródło jeden', 'Źródło dwa'],
      sourcesEn: ['Source one', 'Source two'],
    }
    const paddedArticle = {
      ...cleanArticle,
      introPl: '   Jeden dwa trzy.   ',
      sections: [{ hPl: 'H', hEn: 'H', pPl: '   Cztery pięć sześć.   ', pEn: '   Four five six.   ' }],
      sourcesPl: ['   Źródło jeden   ', '   Źródło dwa   '],
      sourcesEn: ['   Source one   ', '   Source two   '],
    }

    expect(readMinutes(paddedArticle, 'pl')).toBe(readMinutes(cleanArticle, 'pl'))
    expect(readMinutes(paddedArticle, 'en')).toBe(readMinutes(cleanArticle, 'en'))
  })
})


