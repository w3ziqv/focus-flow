import type { Lang } from '../domain/language'
import { LANGUAGE_CODES, localeFor } from '../domain/language'
import { pl } from './locales/pl'
import { en } from './locales/en'
import { es } from './locales/es'
import { zh } from './locales/zh'

export type TranslationKey = keyof typeof pl
export const dict: Record<Lang, Record<TranslationKey, string>> = { pl, en, es, zh }
const numbers = Object.fromEntries(LANGUAGE_CODES.map(code => [code, new Intl.NumberFormat(localeFor(code))])) as Record<Lang, Intl.NumberFormat>

export function formatNumber(lang: Lang, value: number): string {
  return numbers[lang].format(value)
}

/** Pure translation also used by notifications, exports and recovery outside React. */
export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  return dict[lang][key].replace(/\{([^{}]+)\}/g, (placeholder, name: string) => {
    if (!vars || !Object.hasOwn(vars, name)) return placeholder
    const value = vars[name]
    return typeof value === 'number' ? formatNumber(lang, value) : value
  })
}

export function articleCount(lang: Lang, count: number): string {
  const form = new Intl.PluralRules(localeFor(lang)).select(count)
  const key: TranslationKey = form === 'one' ? 'topic.article.one' : form === 'few' ? 'topic.article.few' : form === 'many' ? 'topic.article.many' : 'topic.article.other'
  return translate(lang, key, { count })
}
