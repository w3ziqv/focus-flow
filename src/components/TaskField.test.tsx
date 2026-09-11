import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../lib/i18n'
import { TaskField } from './TaskField'
import type { ChecklistItem } from '../types'

describe('TaskField Component', () => {
  const renderField = (props: Partial<React.ComponentProps<typeof TaskField>> = {}) => {
    const defaultProps = {
      phase: 'draft' as const,
      value: '',
      greeting: 'Dzień dobry',
      onChange: vi.fn(),
      ...props,
    }
    return {
      ...render(
        <I18nProvider>
          <TaskField {...defaultProps} />
        </I18nProvider>,
      ),
      onChange: defaultProps.onChange,
    }
  }

  it('renders intention preset chips when value is empty', () => {
    renderField({ value: '' })
    expect(screen.getByRole('button', { name: /Głęboka praca|Deep Work/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Pisanie|Writing/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Przegląd kodu|Code Review/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Czytanie|Reading/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Inbox Zero/i })).toBeDefined()
  })

  it('populates input immediately upon clicking a preset without modal prompt', () => {
    const onChange = vi.fn()
    renderField({ value: '', onChange })
    const deepWorkBtn = screen.getByRole('button', { name: /Głęboka praca|Deep Work/i })
    fireEvent.click(deepWorkBtn)
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/Głęboka praca|Deep Work/i))
  })

  it('recedes presets visually when value is non-empty', () => {
    renderField({ value: 'Refactor engine' })
    const presetsGroup = screen.getByRole('group', { name: /Szablony intencji|Intention presets/i })
    expect(presetsGroup.className).toContain('opacity-0')
    expect(presetsGroup.className).toContain('pointer-events-none')
  })

  it('allows adding up to 3 micro-steps and commits on Enter', () => {
    const onChecklistChange = vi.fn()
    renderField({ onChecklistChange })

    const addBtn = screen.getByRole('button', { name: /\+ Dodaj mikrokrok|\+ Add micro-step/i })
    fireEvent.click(addBtn)

    const input = screen.getByPlaceholderText(/Kolejny mały krok|Next small step/i)
    fireEvent.change(input, { target: { value: 'Write initial draft' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    expect(onChecklistChange).toHaveBeenCalledWith([
      expect.objectContaining({ text: 'Write initial draft', completed: false }),
    ])
  })

  it('dismisses adding input on Escape', () => {
    renderField()
    const addBtn = screen.getByRole('button', { name: /\+ Dodaj mikrokrok|\+ Add micro-step/i })
    fireEvent.click(addBtn)

    const input = screen.getByPlaceholderText(/Kolejny mały krok|Next small step/i)
    fireEvent.change(input, { target: { value: 'Draft to cancel' } })
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    expect(screen.queryByPlaceholderText(/Kolejny mały krok|Next small step/i)).toBeNull()
  })

  it('removes last checklist item on Backspace when draft input is empty', () => {
    const initialChecklist: ChecklistItem[] = [
      { id: '1', text: 'Step one', completed: false },
    ]
    const onChecklistChange = vi.fn()
    renderField({ checklist: initialChecklist, onChecklistChange })

    const addBtn = screen.getByRole('button', { name: /\+ Dodaj mikrokrok|\+ Add micro-step/i })
    fireEvent.click(addBtn)

    const input = screen.getByPlaceholderText(/Kolejny mały krok|Next small step/i)
    fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' })

    expect(onChecklistChange).toHaveBeenCalledWith([])
  })

  it('toggles completion state on 14px check circle click with 120ms strikethrough classes', () => {
    const initialChecklist: ChecklistItem[] = [
      { id: '1', text: 'Analyze architecture', completed: false },
    ]
    const onChecklistChange = vi.fn()
    renderField({ checklist: initialChecklist, onChecklistChange })

    const checkbox = screen.getByRole('checkbox', { name: 'Analyze architecture' })
    expect(checkbox.className).toContain('size-3.5')
    expect(checkbox.className).toContain('w-[14px]')
    fireEvent.click(checkbox)

    expect(onChecklistChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', completed: true }),
    ])
  })

  it('removes a step when clicking the remove button', () => {
    const initialChecklist: ChecklistItem[] = [
      { id: '1', text: 'Step one', completed: false },
      { id: '2', text: 'Step two', completed: false },
    ]
    const onChecklistChange = vi.fn()
    renderField({ checklist: initialChecklist, onChecklistChange })

    const removeBtns = screen.getAllByRole('button', { name: /Usuń mikrokrok|Delete micro-step/i })
    fireEvent.click(removeBtns[0])

    expect(onChecklistChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: '2', text: 'Step two' }),
    ])
  })

  it('hides add button when maximum 3 micro-steps are present', () => {
    const fullChecklist: ChecklistItem[] = [
      { id: '1', text: 'Step one', completed: false },
      { id: '2', text: 'Step two', completed: true },
      { id: '3', text: 'Step three', completed: false },
    ]
    renderField({ checklist: fullChecklist })

    expect(screen.queryByRole('button', { name: /\+ Dodaj mikrokrok|\+ Add micro-step/i })).toBeNull()
  })

  it('renders running phase with active micro-steps checklist', () => {
    const checklist: ChecklistItem[] = [
      { id: '1', text: 'Step in progress', completed: false },
    ]
    renderField({ phase: 'running', value: 'Active session task', checklist })

    expect(screen.getByText('Active session task')).toBeDefined()
    expect(screen.getByRole('checkbox', { name: 'Step in progress' })).toBeDefined()
  })

  it('renders done phase with completed session task and micro-steps', () => {
    const checklist: ChecklistItem[] = [
      { id: '1', text: 'Completed subtask', completed: true },
    ]
    renderField({ phase: 'done', value: 'Completed session task', checklist })

    expect(screen.getByText('Completed session task')).toBeDefined()
    expect(screen.getByText('Completed subtask')).toBeDefined()
  })
})
