import type { TopicId } from '../types'
import { articleCount, formatNumber } from '../lib/translations'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { articlesForTopic, readMinutes, totalReadMinutesForTopic } from '../lib/articles'
import { topicById, topicCover } from '../lib/topics'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'

interface TopicViewProps {
  topicId: TopicId
  onBack: () => void
  onOpenArticle: (articleId: string) => void
}

export function TopicView({ topicId, onBack, onOpenArticle }: TopicViewProps): React.JSX.Element {
  const { t, lang } = useI18n()
  const topic = topicById(topicId)
  const articles = articlesForTopic(topic.id)

  return (
    <div className="guide-category" style={accentStyle(topic.accent)}>
      <div className="guide-return">
        <button type="button" onClick={onBack} aria-label={t('topic.back')} className="guide-back">
          <ArrowLeft size={18} aria-hidden="true" /><span>{t('nav.tips')}</span>
        </button>
      </div>
      <header className="guide-category-hero">
        <img src={topicCover(topic.id)} width="1200" height="800" alt="" className="guide-cover" fetchPriority="high" />
        <div className="guide-category-heading">
          <span className="guide-cover-label">{t('guides.category')}</span>
          <h1 tabIndex={-1}>{topic.copy[lang].title}</h1>
          <p>{topic.copy[lang].description}</p>
          <span className="guide-category-meta">{t('topic.meta', { articles: articleCount(lang, articles.length), minutes: totalReadMinutesForTopic(topic.id, lang) })}</span>
        </div>
      </header>

      <div className="guide-section-heading"><h2>{t('guides.inCategory')}</h2></div>
      <div className="guide-article-list">
        {articles.map((article, index) => (
          <button key={article.id} type="button" onClick={() => onOpenArticle(article.id)} className="guide-article-row group">
            <span className="guide-article-number" aria-hidden="true">{formatNumber(lang, index + 1)}</span>
            <span className="guide-article-row-copy">
              <span className="guide-article-row-title">{article.content[lang].title}</span>
              <span className="guide-article-excerpt">{article.content[lang].intro}</span>
              <span className="guide-reading-time">{t('topic.read', { n: readMinutes(article, lang) })}</span>
            </span>
            <ArrowRight size={18} className="guide-row-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
export default TopicView
