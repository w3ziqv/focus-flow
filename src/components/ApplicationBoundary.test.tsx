import {render, screen, fireEvent} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {ApplicationBoundary} from './ApplicationBoundary'

function BrokenView(): React.JSX.Element {throw new Error('Private SDK data token=secret')}
describe('application error recovery', () => {
  beforeEach(() => {localStorage.clear(); vi.spyOn(console, 'error').mockImplementation(() => {})})
  it('keeps rendering healthy children', () => {
    render(<ApplicationBoundary><p>Timer</p></ApplicationBoundary>)
    expect(screen.getByText('Timer')).toBeDefined()
  })
  it.each(['en', 'pl'])('offers safe accessible retry in the saved language %s without erasing data', language => {
    localStorage.setItem('ff2_lang', language)
    localStorage.setItem('ff2_sessions', 'saved history')
    const reload = vi.fn()
    render(<ApplicationBoundary onReload={reload}><BrokenView/></ApplicationBoundary>)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).not.toContain('secret')
    fireEvent.click(screen.getByRole('button', {name: language === 'pl' ? 'Wczytaj ponownie' : 'Reload application'}))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('ff2_sessions')).toBe('saved history')
  })
})
