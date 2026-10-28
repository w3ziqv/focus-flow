import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { SegmentedTabs } from './SegmentedTabs'

it('uses a roving tab stop, wraps arrows, supports Home/End and never submits a containing form', () => {
  const submit = vi.fn(event => event.preventDefault())
  function Harness(): React.JSX.Element {
    const [value, setValue] = useState('a')
    return <form onSubmit={submit}><SegmentedTabs ariaLabel="Modes" tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} value={value} onChange={setValue} /></form>
  }
  render(<Harness />)
  const tabs = screen.getAllByRole('tab')
  tabs[0].focus()
  fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' })
  expect(document.activeElement).toBe(tabs[2])
  expect(tabs[2].getAttribute('aria-selected')).toBe('true')
  fireEvent.keyDown(tabs[2], { key: 'Home' })
  expect(document.activeElement).toBe(tabs[0])
  fireEvent.keyDown(tabs[0], { key: 'End' })
  expect(document.activeElement).toBe(tabs[2])
  fireEvent.keyDown(tabs[2], { key: 'ArrowRight' })
  expect(document.activeElement).toBe(tabs[0])
  fireEvent.click(tabs[1])
  expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1])
  expect(submit).not.toHaveBeenCalled()
})
