import { describe, expect, it, vi } from 'vitest'
import type { BeforeInstallPromptEvent } from './installPrompt'
import {
  captureInstallPrompt,
  consumeInstallPrompt,
  getInstallPromptEvent,
  resolveInstallPromptAction,
  subscribeInstallPrompt,
} from './installPrompt'

const makePromptEvent = (): BeforeInstallPromptEvent =>
  Object.assign(new Event('beforeinstallprompt'), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  })

describe('resolveInstallPromptAction', () => {
  const cases: Array<{
    name: string
    platform: 'browser' | 'pwa' | 'tauri' | 'electron'
    os: 'ios' | 'android' | 'desktop'
    dismissed?: boolean
    canPrompt?: boolean
    expected: 'native' | 'guide-ios' | 'guide-android' | 'none'
  }> = [
    { name: 'desktop with the handshake offers the native dialog', platform: 'browser', os: 'desktop', canPrompt: true, expected: 'native' },
    { name: 'desktop without the handshake stays quiet', platform: 'browser', os: 'desktop', canPrompt: false, expected: 'none' },
    { name: 'iOS always gets the manual guide', platform: 'browser', os: 'ios', canPrompt: false, expected: 'guide-ios' },
    { name: 'android with the handshake offers the native dialog', platform: 'browser', os: 'android', canPrompt: true, expected: 'native' },
    { name: 'android without the handshake gets the guide', platform: 'browser', os: 'android', canPrompt: false, expected: 'guide-android' },
    { name: 'a dismissal wins over everything', platform: 'browser', os: 'desktop', dismissed: true, canPrompt: true, expected: 'none' },
    { name: 'the installed PWA is never asked again', platform: 'pwa', os: 'android', canPrompt: true, expected: 'none' },
    { name: 'packaged runtimes stay quiet', platform: 'tauri', os: 'desktop', canPrompt: true, expected: 'none' },
  ]

  it.each(cases)('$name', ({ platform, os, dismissed, canPrompt, expected }) => {
    expect(resolveInstallPromptAction({ platform, os, dismissed: dismissed ?? false, canPrompt: canPrompt ?? false })).toBe(expected)
  })
})

describe('install prompt capture', () => {
  it('captures the handshake, notifies, and clears it on consume', () => {
    captureInstallPrompt()
    const listener = vi.fn()
    const unsubscribe = subscribeInstallPrompt(listener)

    const event = makePromptEvent()
    window.dispatchEvent(event)

    expect(getInstallPromptEvent()).toBe(event)
    expect(listener).toHaveBeenCalled()
    expect(consumeInstallPrompt()).toBe(event)
    expect(getInstallPromptEvent()).toBeNull()

    unsubscribe()
  })

  it('clears the captured event once the app is installed', () => {
    captureInstallPrompt()
    window.dispatchEvent(makePromptEvent())
    expect(getInstallPromptEvent()).not.toBeNull()

    window.dispatchEvent(new Event('appinstalled'))

    expect(getInstallPromptEvent()).toBeNull()
  })
})
