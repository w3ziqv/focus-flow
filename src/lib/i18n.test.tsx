import { useEffect, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { LANGUAGE_CODES, LANGUAGE_META } from '../domain/language'
import { I18nProvider, useI18n } from './i18n'
import { saveLang } from './storage'
import { translate } from './translations'

let mounted = 0
const nodes: Element[] = []
function Child(): React.JSX.Element {
  const { t } = useI18n()
  const [count, setCount] = useState(0)
  useEffect(() => { mounted++ }, [])
  return <><p>{t('timer.start')}</p><button onClick={() => setCount(count + 1)}>Counter {count}</button></>
}
beforeEach(() => {
  localStorage.clear(); mounted = 0
  for (const name of ['description', 'twitter:description', 'twitter:title']) {
    const meta = document.createElement('meta'); meta.name = name; document.head.append(meta); nodes.push(meta)
  }
  for (const name of ['og:title', 'og:description']) {
    const meta = document.createElement('meta'); meta.setAttribute('property', name); document.head.append(meta); nodes.push(meta)
  }
  const manifest = document.createElement('link'); manifest.rel = 'manifest'; document.head.append(manifest); nodes.push(manifest)
})
afterEach(() => { for (const node of nodes.splice(0)) node.remove() })

it.each(LANGUAGE_CODES)('localizes browser title, descriptions and PWA metadata in %s', lang => {
  saveLang(lang)
  render(<I18nProvider><Child /></I18nProvider>)
  expect(document.title).toBe(translate(lang, 'app.documentTitle'))
  expect(document.documentElement.lang).toBe(LANGUAGE_META[lang].htmlLang)
  for (const meta of document.querySelectorAll('meta[name$="description"],meta[property$="description"]')) expect(meta.getAttribute('content')).toBe(translate(lang, 'app.metaDescription'))
  expect(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href).toContain(`/manifest-${lang}.webmanifest`)
})
it('applies a language change from imported storage without remounting local UI state', () => {
  saveLang('en')
  render(<I18nProvider><Child /></I18nProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Counter 0' }))
  act(() => { saveLang('zh') })
  expect(screen.getByText(translate('zh', 'timer.start'))).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Counter 1' })).toBeTruthy()
  expect(mounted).toBe(1)
  expect(document.title).toBe(translate('zh', 'app.documentTitle'))
})
