import type { TopicId } from '../types'
import type { Lang } from '../domain/language'
import { GUIDE_CATALOG, GUIDE_SOURCES } from './guides/catalog'
import type { ArticleCopy, ArticleId, GuideSourceId } from './guides/catalog'
import { pl } from './guides/pl'
import { en } from './guides/en'
import { es } from './guides/es'
import { zh } from './guides/zh'

export interface Article {
  id: ArticleId
  topicId: TopicId
  content: Record<Lang, ArticleCopy>
  sources: readonly { id: GuideSourceId; label: string; url: string }[]
  reviewedOn: string
}
export const ARTICLES: Record<string, Article> = Object.fromEntries(
  (Object.keys(GUIDE_CATALOG) as ArticleId[]).map(id => [id, {
    id, topicId: GUIDE_CATALOG[id].topicId,
    content: { pl: pl[id], en: en[id], es: es[id], zh: zh[id] },
    sources: GUIDE_CATALOG[id].sources.map(source => ({ id: source, ...GUIDE_SOURCES[source] })),
    reviewedOn: '2026-10-28',
  }]),
)

export function articlesForTopic(topicId: TopicId): Article[] {
  return Object.values(ARTICLES).filter(article => article.topicId === topicId)
}
export function articleById(topicId: TopicId, articleId: string): Article | null {
  if (!Object.hasOwn(ARTICLES, articleId)) return null
  const article = ARTICLES[articleId]
  return article.topicId === topicId ? article : null
}
/** Approximate reading time: whitespace-delimited words, Chinese Han characters separately.
 * References are optional further reading and excluded. These rates are editorial estimates. */
export function readMinutes(article: Article, lang: Lang): number {
  const copy = article.content[lang]
  const text = [copy.title, copy.intro, copy.evidence, ...copy.steps, copy.limits].join(' ').trim()
  const han = text.match(/\p{Script=Han}/gu)?.length ?? 0
  const words = text.replace(/\p{Script=Han}/gu, ' ').trim().split(/\s+/u).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200 + han / 350))
}
export function totalReadMinutesForTopic(topicId: TopicId, lang: Lang): number {
  return articlesForTopic(topicId).reduce((sum, article) => sum + readMinutes(article, lang), 0)
}
