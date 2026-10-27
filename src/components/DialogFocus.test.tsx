import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../lib/i18n'
import { Modal } from './Modal'
import { FocusOverlay } from './FocusOverlay'

function Harness({ focusMode }: { focusMode: boolean }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const content = <><button disabled>Unavailable</button><button hidden>Hidden</button><button>Last action</button></>
  return <I18nProvider><button onClick={() => setOpen(true)}>Open</button><main>Background</main>{focusMode
    ? <FocusOverlay open={open} onClose={() => setOpen(false)}>{content}</FocusOverlay>
    : <Modal open={open} title="Settings" onClose={() => setOpen(false)}>{content}</Modal>}</I18nProvider>
}

describe.each([false, true])('dialog keyboard behavior, focus mode=%s', focusMode => {
  it('contains focus, skips unavailable controls and restores the opener on Escape', () => {
    render(<Harness focusMode={focusMode} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    const first = dialog.querySelector('button')!
    expect(document.activeElement).toBe(first)
    expect(screen.getByText('Background').closest('[inert]')).not.toBeNull()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement?.textContent).toBe('Last action')
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(screen.getByText('Background').closest('[inert]')).toBeNull()
  })
})
