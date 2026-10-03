import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDesktopBridge } from './bridge'
import { DEFAULT_SETTINGS, saveSettings } from '../storage'
import type { TimerEngine } from '../timer'
const mocks = vi.hoisted(() => ({ listeners: new Map<string, (event: {payload: string}) => void>(), invoke: vi.fn() }))
vi.mock('../platform', () => ({detectPlatform: () => 'tauri'}))
vi.mock('./runtime', () => ({getPersistence: () => localStorage, getPersistenceError: () => null, nativeInvoke: mocks.invoke, flushPersistence: vi.fn(async () => {})}))
vi.mock('@tauri-apps/api/event', () => ({listen: vi.fn(async (name: string, callback: (event: {payload: string}) => void) => {
  mocks.listeners.set(name, callback)
  return () => mocks.listeners.delete(name)
})}))
beforeEach(() => { localStorage.clear(); mocks.listeners.clear(); mocks.invoke.mockReset(); mocks.invoke.mockImplementation(async (name: string) => name === 'desktop_warnings' ? [] : undefined) })
const engine = (): TimerEngine => ({settings:DEFAULT_SETTINGS, mode:'focus',remainingMs:1000,totalMs:1500000,running:false,task:'',refreshStats:vi.fn(),updateSettings:vi.fn()} as unknown as TimerEngine)
const t = (key: string) => key
const open = vi.fn()
describe('desktop event bridge', () => {
  it('defers remote timer settings during a running phase and applies them when paused', async () => {
    const timer = engine()
    timer.running = true
    const { rerender } = renderHook(() => useDesktopBridge(timer, 'sage', 'en', t, open))
    await waitFor(() => expect(mocks.listeners.has('desktop-action')).toBe(true))
    const settings = {...DEFAULT_SETTINGS, focus:30}
    saveSettings(settings)
    act(() => window.dispatchEvent(new Event('focus-flow:peer-sync')))
    expect(timer.updateSettings).not.toHaveBeenCalled()
    timer.running = false
    rerender()
    expect(timer.updateSettings).toHaveBeenCalledWith(settings)
  })

  it('keeps OS errors visible when an unrelated disk write succeeds', async () => {
    const { result } = renderHook(() => useDesktopBridge(engine(), 'sage', 'en', t, open))
    await waitFor(() => expect(mocks.listeners.has('desktop-error')).toBe(true))
    act(() => mocks.listeners.get('desktop-error')!({payload:'Wake lock unavailable'}))
    act(() => window.dispatchEvent(new CustomEvent('focus-flow:persistence', {detail:null})))
    expect(result.current.error).toBe('desktop.error.awake')
    expect(result.current.nativeError).toBe(true)
    act(() => result.current.dismiss())
    expect(result.current.error).toBeNull()
  })
  it('does not reset a paused timer when only history changes during peer sync', async () => {
    const timer = engine()
    renderHook(() => useDesktopBridge(timer, 'sage', 'en', t, open))
    await waitFor(() => expect(mocks.listeners.has('desktop-action')).toBe(true))
    act(() => window.dispatchEvent(new Event('focus-flow:peer-sync')))
    expect(timer.refreshStats).toHaveBeenCalledOnce()
    expect(timer.updateSettings).not.toHaveBeenCalled()
  })
})
