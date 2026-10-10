import { describe, expect, it } from 'vitest'
import { isSyncCancelled, syncErrorCode, syncErrorMessageKey } from './errors'

describe('sync error diagnostics', () => {
  it('preserves the SDK permission code when its message contains no code', () => {
    const failure = Object.assign(new Error('Missing or insufficient permissions.'), {code: 'permission-denied'})
    expect(syncErrorCode(failure)).toBe('permission-denied')
    expect(syncErrorMessageKey(failure)).toBe('sync.error.permission')
  })

  it.each([
    ['firestore/failed-precondition', 'sync.error.service'],
    ['resource-exhausted', 'sync.error.limit'],
    ['unavailable', 'sync.error.network'],
    ['auth/user-token-expired', 'sync.error.login'],
    ['auth/network-request-failed', 'sync.error.network'],
    ['cloud-http-403', 'sync.error.permission'],
    ['cloud-http-401', 'sync.error.login'],
  ])('distinguishes %s', (code, key) => {
    expect(syncErrorMessageKey({code})).toBe(key)
  })

  it('does not expose arbitrary SDK text, URLs, credentials or injected codes', () => {
    expect(syncErrorCode({code: 'token-secret@example.com', message: 'https://example.com?token=secret'})).toBe('sync-failed')
    expect(syncErrorCode(new Error('https://example.com/permission-denied/token-secret'))).toBe('sync-failed')
    expect(syncErrorMessageKey(new Error('private data'))).toBe('sync.error.general')
  })

  it('recognizes legacy stored codes and deliberate cancellation', () => {
    expect(syncErrorCode('permission-denied: token expired')).toBe('permission-denied')
    expect(isSyncCancelled({code: 'auth/popup-closed-by-user'})).toBe(true)
    expect(isSyncCancelled({code: 'auth/popup-blocked'})).toBe(false)
  })
})
