import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../lib/i18n'
import { Onboarding } from './Onboarding'

const stubNavigator = (overrides: Partial<{ userAgent: string; maxTouchPoints: number }>): void => {
  for (const [key, value] of Object.entries(overrides)) {
    Object.defineProperty(window.navigator, key, { value, configurable: true })
  }
}

const stubStandaloneDisplay = (standalone: boolean): void => {
  window.matchMedia = (query: string) =>
    ({ matches: standalone && query.includes('standalone') }) as MediaQueryList
}

const renderOnboarding = (onDone: () => void): void => {
  render(
    <I18nProvider>
      <Onboarding open onDone={onDone} />
    </I18nProvider>,
  )
}

const goForward = (times: number): void => {
  for (let i = 0; i < times; i += 1) {
    const button = screen.getByRole('button', { name: /Dalej|Zaczynajmy/ })
    if (button.textContent === 'Zaczynajmy') return
    fireEvent.click(button)
  }
}

beforeEach(() => {
  stubNavigator({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
    maxTouchPoints: 0,
  })
  stubStandaloneDisplay(false)
})

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'userAgent')
  Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('Onboarding', () => {
  it('shows keyboard shortcuts and the desktop install hint on a desktop browser', () => {
    renderOnboarding(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }))
    expect(screen.getByText(/Skróty: Space startuje/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }))
    expect(screen.getByText(/ikonę instalacji w pasku adresu/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zaczynajmy' })).toBeTruthy()
  })

  it('drops the shortcut sentence on a touchscreen phone', () => {
    stubNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
    })
    renderOnboarding(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }))
    expect(screen.getByText(/bez konta i bez chmury/)).toBeTruthy()
    expect(screen.queryByText(/Skróty: Space startuje/)).toBeNull()
  })

  it('guides iPhone users through the share sheet', () => {
    stubNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
    })
    renderOnboarding(vi.fn())

    goForward(2)
    expect(screen.getByText(/dotknij „Udostępnij”/)).toBeTruthy()
  })

  it('guides Android users through the browser menu', () => {
    stubNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      maxTouchPoints: 5,
    })
    renderOnboarding(vi.fn())

    goForward(2)
    expect(screen.getByText(/menu przeglądarki/)).toBeTruthy()
  })

  it('skips the install slide inside the installed PWA', () => {
    stubNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      maxTouchPoints: 5,
    })
    stubStandaloneDisplay(true)
    renderOnboarding(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Dalej' }))
    expect(screen.getByRole('button', { name: 'Zaczynajmy' })).toBeTruthy()
    expect(screen.queryByText(/Zainstaluj jako aplikację/)).toBeNull()
  })

  it('marks onboarding done on the final button and on early close', () => {
    const onDone = vi.fn()
    renderOnboarding(onDone)

    goForward(2)
    fireEvent.click(screen.getByRole('button', { name: 'Zaczynajmy' }))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('ff2_onboardingDone')).toBe('true')
  })
})
