import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TipCategory } from '../types'
import { useI18n } from '../lib/i18n'

interface TipsAccordionProps {
  categories: TipCategory[]
}

export function TipsAccordion({ categories }: TipsAccordionProps) {
  const { lang, t } = useI18n()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="mt-8 border-t border-line">
      {categories.map((category) => {
        const open = openId === category.id
        const title = lang === 'pl' ? category.titlePl : category.titleEn
        const Icon = category.icon
        return (
          <section key={category.id} className="border-b border-line">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`tips-${category.id}`}
              onClick={() => setOpenId(open ? null : category.id)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left outline-offset-4"
            >
              <span className="flex items-center gap-3">
                <Icon size={20} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
                <span className="font-serif text-[1.25rem] font-[500] text-ink">{title}</span>
                <span className="text-caption text-ink-3">{category.tips.length}</span>
              </span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`text-ink-3 transition-transform duration-[220ms] [transition-timing-function:var(--ease-standard)] ${open ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              id={`tips-${category.id}`}
              role="region"
              aria-label={title}
              className={`grid transition-[grid-template-rows] duration-[260ms] [transition-timing-function:var(--ease-standard)] ${
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <ul className="pb-5">
                  {category.tips.map((tip, index) => {
                    const content = tip[lang]
                    return (
                      <li key={index} className="border-t border-line-subtle py-3 first:border-t-0">
                        <p className="text-[15px] font-medium text-ink">{content.title}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{content.desc}</p>
                        <p className="mt-1.5 text-[12px] text-ink-3">
                          {t('tip.source')}: {content.source}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
