import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import * as platform from '../lib/platform'
import * as runtime from '../lib/desktop/runtime'
import { ArticleView } from './ArticleView'
import { I18nProvider } from '../lib/i18n'
import { ARTICLES, readMinutes } from '../lib/articles'
import { LANGUAGE_CODES } from '../domain/language'
import { translate } from '../lib/translations'
import { saveLang } from '../lib/storage'

describe('ArticleView', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })
  it.each(LANGUAGE_CODES)('renders localized content, ordered steps, references and reading time in %s', lang => {
    saveLang(lang)
    const article = ARTICLES['glucose-stability']
    const copy = article.content[lang]
    const onBack = vi.fn()
    const result = render(<I18nProvider><ArticleView topicId="food" articleId={article.id} onBack={onBack} /></I18nProvider>)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.title)
    expect(screen.getByText(copy.evidence)).toBeTruthy()
    expect(screen.getByText(copy.limits)).toBeTruthy()
    expect(screen.getByText(translate(lang, 'topic.read', { n: readMinutes(article, lang) }))).toBeTruthy()
    const steps = result.container.querySelector('ol')!
    expect(within(steps).getAllByRole('listitem').map(item => item.textContent)).toEqual(copy.steps)
    for (const source of article.sources) {
      const link = screen.getByRole('link', { name: source.label })
      expect(link.getAttribute('href')).toBe(source.url)
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
    fireEvent.click(screen.getByRole('button', { name: translate(lang, 'topic.backToTopic') }))
    expect(onBack).toHaveBeenCalledOnce()
  })
  it('provides a way back for an unknown article', () => {
    saveLang('es')
    const onBack = vi.fn()
    render(<I18nProvider><ArticleView topicId="learning" articleId="missing" onBack={onBack} /></I18nProvider>)
    expect(screen.getByText(translate('es', 'topic.notFound'))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: translate('es', 'topic.backToTopic') }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})


it('passes only a catalog ID to desktop and localizes launch failures', async () => {
  saveLang('zh')
  vi.spyOn(platform, 'detectPlatform').mockReturnValue('tauri')
  const invoke = vi.spyOn(runtime, 'nativeInvoke').mockRejectedValue(Error('TEST-launch-failure'))
  try {
    render(<I18nProvider><ArticleView topicId="learning" articleId="learning-recall" onBack={() => {}} /></I18nProvider>)
    const source = ARTICLES['learning-recall'].sources[0]
    fireEvent.click(screen.getByRole('link', { name: source.label }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(translate('zh', 'topic.sourceError')))
    expect(invoke).toHaveBeenCalledExactlyOnceWith('open_guide_source', { id: source.id })
    expect(screen.queryByText('TEST-launch-failure')).toBeNull()
  } finally { vi.restoreAllMocks() }
})
