import { useState } from 'react'
import { detectPlatform } from '../lib/platform'
import { nativeInvoke } from '../lib/desktop/runtime'
import { ArrowLeft, X } from 'lucide-react'
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
  const headingClass = 'font-serif text-[1.25rem] font-[500] text-ink'
  const bodyClass = 'mt-2 text-[15px] leading-relaxed text-ink-2'
  return (
    <article className="fade-up relative mx-auto w-full max-w-[640px] px-4 pt-12 pb-16 md:pt-24" style={accentStyle(topic.accent)}>
      <button type="button" onClick={onBack} aria-label={t('topic.back')}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink md:top-20">
        <X size={20} aria-hidden="true" />
      </button>
      <p className="text-overline text-ink-3">{topic.copy[lang].title}</p>
      <h1 className="mt-2 font-serif text-[1.75rem] font-[500] leading-snug tracking-[-0.01em] text-ink">{copy.title}</h1>
      <p className="mt-2 text-caption text-ink-3">{t('topic.read', { n: readMinutes(article, lang) })}</p>
      <p className="mt-6 text-[16px] leading-relaxed text-ink">{copy.intro}</p>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.evidence')}</h2><p className={bodyClass}>{copy.evidence}</p>
      </section>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.steps')}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2 marker:font-medium marker:text-ink">
          {copy.steps.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className={headingClass}>{t('topic.limits')}</h2><p className={bodyClass}>{copy.limits}</p>
      </section>
      <section className="mt-10 border-t border-line pt-5">
        <h2 className="text-overline text-ink-3">{t('topic.sources')}</h2>
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
      <div className="mt-10 flex justify-center border-t border-line pt-6 pb-24 sm:pb-12">
        <button type="button" onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-6 py-2.5 text-caption font-medium text-ink shadow-halo transition-all duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <ArrowLeft size={16} aria-hidden="true" /><span>{t('topic.backToTopic')}</span>
        </button>
      </div>
    </article>
  )
}
export default ArticleView
