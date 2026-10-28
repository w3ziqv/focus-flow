import { translate } from './translations'
import type { Lang } from '../domain/language'
import { LANGUAGE_META } from '../domain/language'
import type { ManifestOptions } from 'vite-plugin-pwa'

const copy: Record<Lang, { desktop: string; mobile: string; start: string; short: string; action: string }> = {
  pl: { desktop: 'Timer Focus Flow na komputerze', mobile: 'Timer Focus Flow na telefonie', start: 'Rozpocznij skupienie', short: 'Skupienie', action: 'Rozpocznij sesję skupienia' },
  en: { desktop: 'The Focus Flow timer on desktop', mobile: 'The Focus Flow timer on a phone', start: 'Start Focus', short: 'Focus', action: 'Start a focus session' },
  es: { desktop: 'Temporizador Focus Flow en un ordenador', mobile: 'Temporizador Focus Flow en un teléfono', start: 'Iniciar concentración', short: 'Concentración', action: 'Iniciar una sesión de concentración' },
  zh: { desktop: '电脑上的 Focus Flow 计时器', mobile: '手机上的 Focus Flow 计时器', start: '开始专注', short: '专注', action: '开始一个专注时段' },
}
/** All locales share installation identity, scope and start URL. */
export function manifestForLanguage(lang: Lang): Partial<ManifestOptions> {
  const text = copy[lang]
  return {
    name: 'Focus Flow', short_name: 'Focus Flow', description: translate(lang, 'app.metaDescription'),
    theme_color: '#f5f4ed', background_color: '#f5f4ed', display: 'standalone', display_override: ['standalone', 'minimal-ui'],
    start_url: '/', id: '/', scope: '/', lang: LANGUAGE_META[lang].htmlLang,
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/screenshots/desktop.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: text.desktop },
      { src: '/screenshots/mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: text.mobile },
    ],
    shortcuts: [{ name: text.start, short_name: text.short, url: '/?start=focus', description: text.action }],
  }
}
