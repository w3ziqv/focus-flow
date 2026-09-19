import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShortcutsModal } from './ShortcutsModal'
import { I18nProvider } from '../lib/i18n'
import { DEFAULT_SHORTCUTS } from '../types'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
)

describe('ShortcutsModal Component', () => {
  const onSaveShortcuts = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <ShortcutsModal
        open={false}
        shortcuts={DEFAULT_SHORTCUTS}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with cheat sheet when open', () => {
    render(
      <ShortcutsModal
        open={true}
        shortcuts={DEFAULT_SHORTCUTS}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Space')).toBeDefined()
    expect(screen.getByText('R')).toBeDefined()
    expect(screen.getByText('F')).toBeDefined()
    expect(screen.getByText('Esc')).toBeDefined()
  })

  it('handles shortcut rebinding flow upon key press', () => {
    render(
      <ShortcutsModal
        open={true}
        shortcuts={DEFAULT_SHORTCUTS}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )

    // Click the Reset Timer button (shows 'R')
    const rButton = screen.getByRole('button', { name: /Zresetuj fazę/i })
    fireEvent.click(rButton)

    // Press a new key 'x'
    fireEvent.keyDown(window, { key: 'x' })

    expect(onSaveShortcuts).toHaveBeenCalledWith({
      ...DEFAULT_SHORTCUTS,
      resetTimer: 'x',
    })
  })

  it('ignores modifier keys and Escape during rebinding', () => {
    render(
      <ShortcutsModal
        open={true}
        shortcuts={DEFAULT_SHORTCUTS}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )

    const rButton = screen.getByRole('button', { name: /Zresetuj fazę/i })
    fireEvent.click(rButton)

    // Press Shift
    fireEvent.keyDown(window, { key: 'Shift' })
    expect(onSaveShortcuts).not.toHaveBeenCalled()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onSaveShortcuts).not.toHaveBeenCalled()
  })

  it('restores default keybindings on reset defaults click', () => {
    const customShortcuts = {
      toggleTimer: 'p',
      resetTimer: 'x',
      toggleFullscreen: 'z',
      openSettings: 'h',
    }

    render(
      <ShortcutsModal
        open={true}
        shortcuts={customShortcuts}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )

    const resetButton = screen.getByRole('button', { name: /Przywróć domyślne/i })
    fireEvent.click(resetButton)

    expect(onSaveShortcuts).toHaveBeenCalledWith({ ...DEFAULT_SHORTCUTS })
  })

  it('calls onClose when Done button is pressed', () => {
    render(
      <ShortcutsModal
        open={true}
        shortcuts={DEFAULT_SHORTCUTS}
        onSaveShortcuts={onSaveShortcuts}
        onClose={onClose}
      />,
      { wrapper },
    )

    const doneButton = screen.getByRole('button', { name: /Gotowe/i })
    fireEvent.click(doneButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
