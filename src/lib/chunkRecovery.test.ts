import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {installChunkRecovery} from './chunkRecovery'

describe('deployment chunk recovery', () => {
  let stop: () => void
  beforeEach(() => {sessionStorage.clear(); localStorage.clear(); vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)})
  afterEach(() => {stop?.(); vi.restoreAllMocks()})

  it('reloads once across repeated failures and a reload of the same build, preserving local data', () => {
    localStorage.setItem('ff2_sessions', 'saved history')
    const reload = vi.fn()
    stop = installChunkRecovery('build-a', reload)
    window.dispatchEvent(new Event('vite:preloadError'))
    window.dispatchEvent(new Event('vite:preloadError'))
    stop()
    stop = installChunkRecovery('build-a', reload)
    window.dispatchEvent(new Event('vite:preloadError'))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('ff2_sessions')).toBe('saved history')
  })
  it('allows recovery of a later build without growing the guard storage', () => {
    sessionStorage.setItem('ff3_chunk_reload', 'build-a')
    const reload = vi.fn()
    stop = installChunkRecovery('build-b', reload)
    window.dispatchEvent(new Event('vite:preloadError'))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.length).toBe(1)
  })
  it('does not reload offline or consume the later online recovery', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const reload = vi.fn()
    stop = installChunkRecovery('build-a', reload)
    window.dispatchEvent(new Event('vite:preloadError'))
    expect(reload).not.toHaveBeenCalled()
    online.mockReturnValue(true)
    window.dispatchEvent(new Event('vite:preloadError'))
    expect(reload).toHaveBeenCalledTimes(1)
  })
  it('keeps manual retry when the reload guard cannot be saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new Error('storage unavailable')})
    const reload = vi.fn()
    stop = installChunkRecovery('build-a', reload)
    window.dispatchEvent(new Event('vite:preloadError'))
    expect(reload).not.toHaveBeenCalled()
  })
})
