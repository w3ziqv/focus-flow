import { X } from 'lucide-react'
import { articleById } from '../lib/articles'
import { topicById } from '../lib/topics'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'
import type { ArticleSection } from '../lib/articles'

/** Splits "1. … 2. … 3. …" paragraphs into numbered list items; prose stays a paragraph. */
function isStepList(text: string): string[] | null {
  if (!/^\d+\.\s/.test(text.trim())) return null
  const items = text.trim().split(/(?=\d+\.\s)/).map((s) => s.replace(/^\d+\.\s*/, '').trim())
  return items.every((s) => s.length > 0) && items.length > 1 ? items : null
}

function SectionBody({ text }: { text: string }) {
  const items = isStepList(text)
  if (items) {
    return (
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2 marker:font-medium marker:text-ink">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    )
  }
  return <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{text}</p>
}

function Section({ section }: { section: ArticleSection }) {
  const { lang } = useI18n()
  return (
    <section className="mt-8">
      <h2 className="font-serif text-[1.25rem] font-[500] text-ink">
        {lang === 'pl' ? section.hPl : section.hEn}
      </h2>
      <SectionBody text={lang === 'pl' ? section.pPl : section.pEn} />
    </section>
  )
}

interface ArticleViewProps {
  topicId: string
  articleId: string
  onBack: () => void
}

export function ArticleView({ topicId, articleId, onBack }: ArticleViewProps): React.JSX.Element | null {
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
    <div className="fade-up relative mx-auto w-full max-w-[640px] px-4 pt-12 pb-16 md:pt-24" style={accentStyle(topic.accent)}>
      <button
        type="button"
        onClick={onBack}
        aria-label={t('topic.back')}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink md:top-20"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <p className="text-overline text-ink-3">{lang === 'pl' ? topic.titlePl : topic.titleEn}</p>
      <h1 className="mt-2 font-serif text-[1.75rem] font-[500] leading-snug tracking-[-0.01em] text-ink">{title}</h1>
      <p className="mt-2 text-caption text-ink-3">{t('topic.read', { n: readMin })}</p>

      <p className="mt-6 text-[16px] leading-relaxed text-ink">{intro}</p>

      {article.sections.map((section, index) => (
        <Section key={index} section={section} />
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
