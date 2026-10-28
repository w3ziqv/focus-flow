import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../lib/i18n'
import { Modal } from './Modal'
import { FocusOverlay } from '../features/timer/FocusOverlay'

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

function Nested({ parentVisible = true }: { parentVisible?: boolean }): React.JSX.Element {
  const [parent, setParent] = useState(false)
  const [child, setChild] = useState(false)
  return <I18nProvider>
    <nav><button aria-current="page" onClick={() => setParent(true)}>Open parent</button></nav>
    <main>Nested background</main><aside inert>Already unavailable</aside>
    {parentVisible && <Modal open={parent} title="Parent" onClose={() => setParent(false)}>
      <input aria-label="Unsaved draft" defaultValue="Keep this" />
      <button onClick={() => setChild(true)}>Open child</button>
    </Modal>}
    <Modal open={child} title="Child" onClose={() => setChild(false)}><button>Child action</button></Modal>
  </I18nProvider>
}

it('closes only the top dialog and restores its parent draft, focus and original inert state', () => {
  render(<Nested />)
  const opener = screen.getByRole('button', { name: 'Open parent' })
  opener.focus(); fireEvent.click(opener)
  const draft = screen.getByRole('textbox', { name: 'Unsaved draft' }) as HTMLInputElement
  fireEvent.change(draft, { target: { value: 'Still editing' } })
  const childTrigger = screen.getByRole('button', { name: 'Open child' })
  childTrigger.focus(); fireEvent.click(childTrigger)
  const child = screen.getByRole('dialog', { name: 'Child' })
  expect(screen.getByText('Parent').closest('[inert]')).not.toBeNull()
  expect(child.closest('[inert]')).toBeNull()
  fireEvent.keyDown(child, { key: 'Escape' })
  expect(document.activeElement).toBe(childTrigger)
  expect(draft.value).toBe('Still editing')
  expect(screen.getByText('Nested background').closest('[inert]')).not.toBeNull()
  fireEvent.keyDown(childTrigger, { key: 'Escape' })
  expect(document.activeElement).toBe(opener)
  expect(screen.getByText('Nested background').closest('[inert]')).toBeNull()
  expect(screen.getByText('Already unavailable').hasAttribute('inert')).toBe(true)
  expect(document.body.style.overflow).toBe('')
})

it('restores the background even when a parent unmounts before its child', () => {
  const { rerender } = render(<Nested />)
  fireEvent.click(screen.getByRole('button', { name: 'Open parent' }))
  fireEvent.click(screen.getByRole('button', { name: 'Open child' }))
  rerender(<Nested parentVisible={false} />)
  const child = screen.getByRole('dialog', { name: 'Child' })
  expect(child.closest('[inert]')).toBeNull()
  fireEvent.keyDown(child, { key: 'Escape' })
  expect(screen.getByText('Nested background').closest('[inert]')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open parent' }))
})
