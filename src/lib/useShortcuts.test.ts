import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useShortcuts } from './useShortcuts'

describe('useShortcuts', () => {
  const handlers = { toggle: vi.fn(), reset: vi.fn(), focusMode: vi.fn(), escape: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('toggles on Space from the page body', () => {
    renderHook(() => useShortcuts(handlers))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(handlers.toggle).toHaveBeenCalledTimes(1)
  })

  it('lets Space activate a focused button instead of toggling', () => {
    renderHook(() => useShortcuts(handlers))
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(handlers.toggle).not.toHaveBeenCalled()
  })

  it('lets Space activate elements with role="switch" or "tab"', () => {
    renderHook(() => useShortcuts(handlers))
    const sw = document.createElement('span')
    sw.setAttribute('role', 'switch')
    document.body.appendChild(sw)
    sw.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(handlers.toggle).not.toHaveBeenCalled()
  })

  it('still wires R and F outside of interactive elements', () => {
    renderHook(() => useShortcuts(handlers))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }))
    expect(handlers.reset).toHaveBeenCalledTimes(1)
    expect(handlers.focusMode).toHaveBeenCalledTimes(1)
  })

  it('triggers openShortcuts when ? is pressed', () => {
    const openShortcuts = vi.fn()
    renderHook(() => useShortcuts({ ...handlers, openShortcuts }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(openShortcuts).toHaveBeenCalledTimes(1)
  })

  it('respects custom keymap configurations', () => {
    const customKeymap = {
      toggleTimer: 'p',
      resetTimer: 'x',
      toggleFullscreen: 'z',
      openSettings: 'h',
    }
    const openShortcuts = vi.fn()
    renderHook(() => useShortcuts({ ...handlers, openShortcuts }, customKeymap))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
    expect(handlers.toggle).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
    expect(handlers.reset).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }))
    expect(handlers.focusMode).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))
    expect(openShortcuts).toHaveBeenCalledTimes(1)
  })
})
