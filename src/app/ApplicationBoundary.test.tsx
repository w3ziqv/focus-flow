import {render, screen, fireEvent} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import { LANGUAGE_CODES, LANGUAGE_META } from '../domain/language'
import { translate } from '../lib/translations'
import {ApplicationBoundary} from './ApplicationBoundary'

function BrokenView(): React.JSX.Element {throw new Error('Private SDK data token=secret')}
describe('application error recovery', () => {
  beforeEach(() => {localStorage.clear(); vi.spyOn(console, 'error').mockImplementation(() => {})})
  it('keeps rendering healthy children', () => {
    render(<ApplicationBoundary><p>Timer</p></ApplicationBoundary>)
    expect(screen.getByText('Timer')).toBeDefined()
  })
  it.each(LANGUAGE_CODES.flatMap(lang => [[lang, lang], [lang, JSON.stringify(lang)]] as const))('offers safe accessible retry in the saved language %s (%s) without erasing data', (language, stored) => {
    localStorage.setItem('ff2_lang', stored)
    localStorage.setItem('ff2_sessions', 'saved history')
    const reload = vi.fn()
    render(<ApplicationBoundary onReload={reload}><BrokenView/></ApplicationBoundary>)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).not.toContain('secret')
    expect(document.documentElement.lang).toBe(LANGUAGE_META[language].htmlLang)
    fireEvent.click(screen.getByRole('button', {name: translate(language, 'recovery.reload')}))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('ff2_sessions')).toBe('saved history')
  })
})
