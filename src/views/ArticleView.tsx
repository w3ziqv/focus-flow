import { X } from 'lucide-react'
import { articleById } from '../lib/articles'
import { topicById } from '../lib/topics'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'

interface ArticleViewProps {
  topicId: string
  articleId: string
  onBack: () => void
}

export function ArticleView({ topicId, articleId, onBack }: ArticleViewProps) {
  const { t, lang } = useI18n()
  const topic = topicById(topicId as never)
  const article = articleById(topic.id, articleId)
  if (!article) return null

  const title = lang === 'pl' ? article.titlePl : article.titleEn
  const intro = lang === 'pl' ? article.introPl : article.introEn
  const sources = lang === 'pl' ? article.sourcesPl : article.sourcesEn
  const readMin = Math.max(
    1,
    Math.round(
      [intro, ...article.sections.map((s) => (lang === 'pl' ? s.pPl : s.pEn))].join(' ').split(/\s+/).length / 200,
    ),
  )

  return (
    <div className="fade-up relative mx-auto w-full max-w-[640px] px-4 pt-24 pb-16 max-md:pt-20" style={accentStyle(topic.accent)}>
      <button
        type="button"
        onClick={onBack}
        aria-label={t('topic.back')}
        className="absolute top-24 right-4 flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <p className="text-overline text-ink-3">{lang === 'pl' ? topic.titlePl : topic.titleEn}</p>
      <h1 className="mt-2 font-serif text-[1.75rem] font-[500] leading-snug tracking-[-0.01em] text-ink">{title}</h1>
      <p className="mt-2 text-caption text-ink-3">{t('topic.read', { n: readMin })}</p>

      <p className="mt-6 text-[16px] leading-relaxed text-ink">{intro}</p>

      {article.sections.map((section, index) => (
        <section key={index} className="mt-8">
          <h2 className="font-serif text-[1.25rem] font-[500] text-ink">
            {lang === 'pl' ? section.hPl : section.hEn}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            {lang === 'pl' ? section.pPl : section.pEn}
          </p>
        </section>
      ))}

      <section className="mt-10 border-t border-line pt-5">
        <p className="text-overline text-ink-3">{t('topic.sources')}</p>
        <ul className="mt-2 space-y-1">
          {sources.map((s) => (
            <li key={s} className="text-[13px] text-ink-2">
              {s}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default ArticleView
