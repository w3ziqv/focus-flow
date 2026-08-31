import { afterEach, describe, expect, it } from 'vitest'
import { detectOS } from './platform'

const stubNavigator = (overrides: Partial<{ userAgent: string; maxTouchPoints: number }>): void => {
  for (const [key, value] of Object.entries(overrides)) {
    Object.defineProperty(window.navigator, key, { value, configurable: true })
  }
}

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'userAgent')
  Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
})

describe('detectOS', () => {
  it('detects an iPhone as ios', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' })
    expect(detectOS()).toBe('ios')
  })

  it('detects iPadOS masquerading as a Mac through its touch points', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', maxTouchPoints: 2 })
    expect(detectOS()).toBe('ios')
  })

  it('keeps a touchless Mac as desktop', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', maxTouchPoints: 0 })
    expect(detectOS()).toBe('desktop')
  })

  it('detects android', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36' })
    expect(detectOS()).toBe('android')
  })
})
