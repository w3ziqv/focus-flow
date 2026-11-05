import type { TopicId } from '../types'
import { formatNumber } from '../lib/translations'
import { TOPICS } from '../lib/topics'
import { articlesForTopic } from '../lib/articles'
import { useI18n } from '../lib/i18n'
import { accentStyle } from '../lib/accent'

export default function TopicsIndex({ onOpenTopic }: { onOpenTopic: (id: TopicId) => void }): React.JSX.Element {
  const { t, lang } = useI18n()

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-8 pb-12">
      <h1 className="font-serif text-2xl font-medium text-ink">{t('tips.title')}</h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{t('tips.desc')}</p>

      <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          const count = articlesForTopic(topic.id).length
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onOpenTopic(topic.id)}
              style={accentStyle(topic.accent)}
              className="group border-b border-line py-6 text-left transition-colors duration-150 hover:bg-card"
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 text-ink-2"
                  aria-hidden="true"
                />
                <p className="grow text-base font-medium text-ink">{topic.copy[lang].title}</p>
                <span className="text-caption text-ink-2">{formatNumber(lang, count)}</span>
              </div>
              <p className="mt-2 pl-[30px] text-[14px] leading-relaxed text-ink-2">
                {topic.copy[lang].description}
              </p>
            </button>
          )
        })}
      </div>

      <p className="mt-8 text-caption text-ink-2">
        {t('topics.more')}
      </p>
    </div>
  )
}
