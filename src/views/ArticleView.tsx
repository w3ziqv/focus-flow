import { useState } from 'react'
import { detectPlatform } from '../lib/platform'
import { nativeInvoke } from '../lib/desktop/runtime'
import { ArrowLeft } from 'lucide-react'
import { articleById, readMinutes } from '../lib/articles'
import { topicById } from '../lib/topics'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'
import { localeFor } from '../domain/language'
import type { TopicId } from '../types'

interface ArticleViewProps {
  topicId: TopicId
  articleId: string
  onBack: () => void
}
export function ArticleView({ topicId, articleId, onBack }: ArticleViewProps): React.JSX.Element {
  const { t, lang } = useI18n()
  const [sourceFailed, setSourceFailed] = useState(false)
  const topic = topicById(topicId)
  const article = articleById(topic.id, articleId)
  if (!article) return <div className="mx-auto max-w-[640px] px-4 py-24"><p>{t('topic.notFound')}</p><button type="button" onClick={onBack} className="mt-4 min-h-11 underline">{t('topic.backToTopic')}</button></div>
  const copy = article.content[lang]
  // A calendar date, not an instant: use UTC explicitly to avoid changing the day in western zones.
  const reviewDate = new Date(`${article.reviewedOn}T00:00:00Z`).toLocaleDateString(localeFor(lang), { timeZone: 'UTC' })
  const headingClass = 'guide-article-section-title'
  const bodyClass = 'guide-article-body'
  return (
    <article className="guide-article" style={accentStyle(topic.accent)}>
      <div className="guide-return">
        <button type="button" onClick={onBack} aria-label={`${t('topic.back')}: ${topic.copy[lang].title}`} className="guide-back">
          <ArrowLeft size={18} aria-hidden="true" /><span>{topic.copy[lang].title}</span>
        </button>
        <span className="guide-reading-time">{t('topic.read', { n: readMinutes(article, lang) })}</span>
      </div>
      <header className="guide-article-heading">
        <h1 tabIndex={-1}>{copy.title}</h1>
        <p className="guide-article-intro">{copy.intro}</p>
      </header>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.evidence')}</h2><p className={bodyClass}>{copy.evidence}</p>
      </section>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.steps')}</h2>
        <ol className="guide-article-steps">
          {copy.steps.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.limits')}</h2><p className={bodyClass}>{copy.limits}</p>
      </section>
      <section className="mt-10 border-t border-line pt-5">
        <h2 className="text-caption text-ink-3">{t('topic.sources')}</h2>
        <ul className="mt-2 space-y-2">
          {article.sources.map(source => <li key={source.url} className="text-[13px] text-ink-2">
            <a href={source.url} onClick={event => {
              if (detectPlatform() !== 'tauri') return
              event.preventDefault()
              setSourceFailed(false)
              void nativeInvoke('open_guide_source', { id: source.id }).catch(() => setSourceFailed(true))
            }} target="_blank" rel="noopener noreferrer" className="inline-block break-words py-2 underline decoration-line underline-offset-4 hover:text-ink">{source.label}</a>
          </li>)}
        </ul>
        {sourceFailed && <p role="alert" className="mt-3 text-caption text-ink">{t('topic.sourceError')}</p>}
        <p className="mt-3 text-caption text-ink-3">{t('topic.reviewed', { date: reviewDate })}</p>
      </section>
      <div className="mt-10 flex border-t border-line pt-6">
        <button type="button" onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-card px-4 py-2.5 text-caption font-medium text-ink transition-colors duration-150 hover:bg-sunken">
          <ArrowLeft size={16} aria-hidden="true" /><span>{t('topic.backToTopic')}</span>
        </button>
      </div>
    </article>
  )
}
export default ArticleView
