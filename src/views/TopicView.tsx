import { X } from 'lucide-react'
import { articlesForTopic, readMinutes, totalReadMinutesForTopic } from '../lib/articles'
import { topicById } from '../lib/topics'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'

interface TopicViewProps {
  topicId: string
  onBack: () => void
  onOpenArticle: (articleId: string) => void
}

export function TopicView({ topicId, onBack, onOpenArticle }: TopicViewProps) {
  const { t, lang } = useI18n()
  const topic = topicById(topicId as never)
  const Icon = topic.icon
  const articles = articlesForTopic(topic.id)
  const title = lang === 'pl' ? topic.titlePl : topic.titleEn
  const totalMinutes = totalReadMinutesForTopic(topic.id, lang)

  return (
    <div
      className="fade-up relative mx-auto w-full max-w-[760px] px-4 pt-12 pb-16 md:pt-24"
      style={accentStyle(topic.accent)}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={t('topic.back')}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink md:top-20"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center pt-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[var(--ac-soft)]">
          <Icon size={30} strokeWidth={1.5} className="text-[var(--ac)]" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-[2rem] font-[500] tracking-[-0.01em] text-ink">{title}</h1>
        <p className="mt-2 text-caption text-ink-3">
          {t('topic.meta', { count: articles.length, minutes: totalMinutes })}
        </p>
      </div>

      <div className="mt-10 border-t border-line">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => onOpenArticle(article.id)}
            className="group flex w-full items-center justify-between gap-4 border-b border-line py-5 text-left outline-offset-4"
          >
            <span>
              <span className="block text-[15px] font-medium text-ink group-hover:text-[var(--ac-strong)]">
                {lang === 'pl' ? article.titlePl : article.titleEn}
              </span>
              <span className="mt-1 block text-caption text-ink-3">
                {t('topic.read', { n: readMinutes(article, lang) })}
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-3 transition-colors group-hover:text-[var(--ac-strong)]">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TopicView
