import { Flower2 } from 'lucide-react'
import { TOPICS } from '../lib/topics'
import { articlesForTopic } from '../lib/articles'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'

export default function TopicsIndex({ onOpenTopic }: { onOpenTopic: (id: string) => void }) {
  const { t, lang } = useI18n()

  return (
    <div className="fade-up mx-auto w-full max-w-[760px] px-4 pt-24 pb-16 max-md:pt-20">
      <p className="text-overline text-ink-3">{t('app.name')}</p>
      <h1 className="mt-2 font-serif text-[2rem] font-[500] tracking-[-0.01em] text-ink">{t('tips.title')}</h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{t('tips.desc')}</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          const count = articlesForTopic(topic.id).length
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onOpenTopic(topic.id)}
              style={accentStyle(topic.accent)}
              className="group rounded-2xl border border-line bg-card p-5 text-left shadow-halo transition-colors duration-150 hover:bg-sunken"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon
                  size={22}
                  strokeWidth={1.75}
                  className="text-[var(--ac)]"
                  aria-hidden="true"
                />
                <span className="text-caption text-ink-3">{count}</span>
              </div>
              <p className="mt-3 font-serif text-[1.25rem] font-[500] text-ink">
                {lang === 'pl' ? topic.titlePl : topic.titleEn}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                {lang === 'pl' ? topic.descPl : topic.descEn}
              </p>
            </button>
          )
        })}
      </div>

      <p className="mt-8 flex items-center gap-2 text-caption text-ink-3">
        <Flower2 size={14} aria-hidden="true" />
        {t('topics.more')}
      </p>
    </div>
  )
}
