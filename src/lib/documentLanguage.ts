import type { Lang } from '../domain/language'
import { LANGUAGE_META } from '../domain/language'
import { translate } from './translations'

/** UI, recovery and the native mini window share the same document metadata. */
export function applyDocumentLanguage(lang: Lang): void {
  document.documentElement.lang = LANGUAGE_META[lang].htmlLang
  document.title = translate(lang, 'app.documentTitle')
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', translate(lang, 'app.metaDescription'))
  }
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', document.title)
  }
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifest) manifest.href = `/manifest-${lang}.webmanifest`
}
