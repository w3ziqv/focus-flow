import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatsView } from './StatsView'
import { I18nProvider } from '../lib/i18n'
import type { StatsV2 } from '../types'
import * as storage from '../lib/storage'
import * as statsLib from '../lib/stats'

const mockStats: StatsV2 = {
  today: 2,
  week: 5,
  streak: 3,
  minutes: 120,
  date: new Date().toDateString(),
  weekStart: new Date().toDateString(),
  lastDate: new Date().toDateString(),
  history: {
    [new Date().toDateString()]: 120,
  },
}

describe('StatsView (v2.3 Features)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('pages the visible history while searching the complete set and preserving stored sessions', () => {
    const entries = Array.from({length:65}, (_, i) => ({id:`page-${i}`,date:new Date().toISOString(),minutes:1,task:`History ${i}`}))
    storage.saveSessions(entries)
    render(<I18nProvider><StatsView stats={mockStats} lang="pl" /></I18nProvider>)
    expect(screen.getAllByRole('button', {name:'Edytuj nazwę zadania'})).toHaveLength(50)
    expect(screen.queryByText('History 64', {exact:true})).toBeNull()
    fireEvent.click(screen.getByRole('button', {name:'Pokaż kolejne sesje'}))
    expect(screen.getAllByRole('button', {name:'Edytuj nazwę zadania'})).toHaveLength(65)
    fireEvent.change(screen.getByPlaceholderText(/szukaj/i), {target:{value:'History 64'}})
    expect(screen.getByText('History 64', {exact:true})).toBeDefined()
    expect(screen.getAllByRole('button', {name:'Edytuj nazwę zadania'})).toHaveLength(1)
    fireEvent.change(screen.getByPlaceholderText(/szukaj/i), {target:{value:''}})
    expect(screen.getAllByRole('button', {name:'Edytuj nazwę zadania'})).toHaveLength(50)
    expect(storage.loadSessions()).toHaveLength(65)
  })

  it('renders search and date filter well', () => {
    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" />
      </I18nProvider>,
    )

    const searchInput = screen.getByPlaceholderText(/szukaj/i)
    expect(searchInput).toBeDefined()
  })

  it('renders Zen milestone seals section', () => {
    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" />
      </I18nProvider>,
    )

    expect(screen.getByText(/Kamienie milowe/i)).toBeDefined()
    expect(screen.getByText(/Pierwszy krok/i)).toBeDefined()
  })

  it('renders export card trigger button and opens modal', () => {
    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" />
      </I18nProvider>,
    )

    const exportBtn = screen.getByText(/Eksportuj kartę/i)
    expect(exportBtn).toBeDefined()
    fireEvent.click(exportBtn)

    expect(screen.getByText(/Karta podsumowania tygodnia/i)).toBeDefined()
  })

  it('filters session history when user searches', () => {
    const mockSessions = [
      { id: 's1', date: new Date().toISOString(), minutes: 25, task: 'Writing report' },
      { id: 's2', date: new Date().toISOString(), minutes: 30, task: 'Code review' },
    ]
    vi.spyOn(storage, 'loadSessions').mockReturnValue(mockSessions)

    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Writing report').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Code review').length).toBeGreaterThanOrEqual(1)

    const searchInput = screen.getByPlaceholderText(/szukaj/i)
    fireEvent.change(searchInput, { target: { value: 'Writing' } })

    expect(screen.getAllByText('Writing report').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/1 z 2/i)).toBeDefined()
  })

  it('allows inline editing of session tasks', () => {
    const mockSessions = [
      { id: 's1', date: new Date().toISOString(), minutes: 25, task: 'Initial task' },
    ]
    vi.spyOn(storage, 'loadSessions').mockReturnValue(mockSessions)
    const updateSpy = vi.spyOn(storage, 'updateSessionTask').mockReturnValue([
      { id: 's1', date: new Date().toISOString(), minutes: 25, task: 'Renamed task' },
    ])

    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" />
      </I18nProvider>,
    )

    const editBtn = screen.getByLabelText(/Edytuj nazwę zadania/i)
    fireEvent.click(editBtn)

    const input = screen.getByDisplayValue('Initial task')
    fireEvent.change(input, { target: { value: 'Renamed task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(updateSpy).toHaveBeenCalledWith('s1', 'Renamed task')
  })

  it('does not save when focus moves from the edit input to Cancel', () => {
    storage.saveSessions([{id:'cancel-edit',date:new Date().toISOString(),minutes:25,task:'Original task'}])
    render(<I18nProvider><StatsView stats={mockStats} lang="pl" /></I18nProvider>)
    fireEvent.click(screen.getByRole('button', {name:'Edytuj nazwę zadania'}))
    const input = screen.getByRole('textbox', {name:'Edytuj nazwę zadania'})
    fireEvent.change(input, {target:{value:'Discard this edit'}})
    const cancel = screen.getByRole('button', {name:'Anuluj (Esc)'})
    fireEvent.blur(input, {relatedTarget:cancel})
    fireEvent.click(cancel)
    expect(storage.loadSessions()[0].task).toBe('Original task')
  })

  it('allows deleting session and triggers atomic stats decrement', () => {
    const mockSessions = [
      { id: 's1', date: new Date().toISOString(), minutes: 25, task: 'To be deleted' },
    ]
    vi.spyOn(storage, 'loadSessions').mockReturnValue(mockSessions)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const deleteSpy = vi.spyOn(statsLib, 'deleteSessionWithStats').mockReturnValue({
      sessions: [],
      stats: { ...mockStats, minutes: 95 },
      deleted: mockSessions[0],
    })
    const onStatsChange = vi.fn()

    render(
      <I18nProvider>
        <StatsView stats={mockStats} lang="pl" onStatsChange={onStatsChange} />
      </I18nProvider>,
    )

    const deleteBtn = screen.getByLabelText(/Usuń sesję z historii/i)
    fireEvent.click(deleteBtn)

    expect(deleteSpy).toHaveBeenCalledWith('s1')
    expect(onStatsChange).toHaveBeenCalledWith(expect.objectContaining({ minutes: 95 }))
  })
})
