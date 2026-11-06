import type { TopicId } from '../types'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { articleCount } from '../lib/translations'
import { TOPICS, topicCover } from '../lib/topics'
import { articlesForTopic } from '../lib/articles'
import { useI18n } from '../lib/i18n'

export default function TopicsIndex({ onOpenTopic }: { onOpenTopic: (id: TopicId) => void }): React.JSX.Element {
  const { t, lang } = useI18n()
  const featured = TOPICS[0]

  return (
    <div className="guide-library">
      <header className="guide-library-heading">
        <div>
          <h1 tabIndex={-1}>{t('tips.title')}</h1>
          <p>{t('tips.desc')}</p>
        </div>
        <span className="guide-library-note">{t('guides.libraryNote')}</span>
      </header>

      <button type="button" onClick={() => onOpenTopic(featured.id)} className="guide-feature group">
        <img src={topicCover(featured.id)} width="1200" height="800" alt="" fetchPriority="high" className="guide-cover" />
        <span className="guide-feature-content">
          <span className="guide-cover-label">{t('guides.featured')}</span>
          <span className="guide-feature-title">{featured.copy[lang].title}</span>
          <span className="guide-feature-description">{featured.copy[lang].description}</span>
          <span className="guide-feature-bottom">
            <span>{articleCount(lang, articlesForTopic(featured.id).length)}</span>
            <span className="guide-cover-action">{t('guides.explore')}<ArrowRight size={17} aria-hidden="true" /></span>
          </span>
        </span>
      </button>

      <div className="guide-section-heading"><h2>{t('guides.categories')}</h2><span>{t('topics.more')}</span></div>
      <div className="guide-topics-grid">
        {TOPICS.slice(1).map(topic => (
          <button key={topic.id} type="button" onClick={() => onOpenTopic(topic.id)} className="guide-topic-card group">
            <div className="guide-topic-image"><img src={topicCover(topic.id, true)} alt="" width="400" height="267" loading="lazy" /></div>
            <div className="guide-topic-copy">
              <span className="guide-topic-title">{topic.copy[lang].title}<ArrowUpRight size={17} aria-hidden="true" /></span>
              <span className="guide-topic-description">{topic.copy[lang].description}</span>
              <span className="guide-topic-count">{articleCount(lang, articlesForTopic(topic.id).length)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
