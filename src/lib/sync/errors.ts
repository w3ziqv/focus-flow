import type { TranslationKey } from '../translations'

const codes = [
  'permission-denied', 'unauthenticated', 'unavailable', 'deadline-exceeded',
  'resource-exhausted', 'failed-precondition', 'not-found', 'invalid-argument',
  'aborted', 'internal', 'unknown', 'cancelled', 'data-loss', 'already-exists',
  'auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/popup-blocked',
  'auth/unauthorized-domain', 'auth/operation-not-allowed', 'auth/network-request-failed',
  'auth/user-disabled', 'auth/user-token-expired', 'auth/invalid-user-token',
  'cloud-not-configured', 'cloud-account-mismatch', 'cloud-account-changed',
  'cloud-network-error', 'cloud-offline', 'cloud-timeout',
  'cloud-http-400', 'cloud-http-401', 'cloud-http-403', 'cloud-http-404',
  'cloud-http-409', 'cloud-http-429', 'cloud-http-500', 'cloud-http-503',
  'oauth-browser-error', 'oauth-listener-error', 'oauth-timeout',
  'account-switch-cancelled', 'account-switch-consent-required',
] as const

/** Only return allowlisted identifiers, never SDK messages, URLs or account data. */
export function syncErrorCode(error: unknown): string {
  const structured = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
  if (typeof structured === 'string') {
    const candidate = structured.replace(/^firestore\//, '')
    if (codes.some(code => code === candidate)) return candidate
  }
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  for (const code of codes) {
    if (new RegExp(`(?:^|[^a-zA-Z0-9_/-])${code}(?=$|[^a-zA-Z0-9_/-])`).test(message)) return code
  }
  if (/not.configured/i.test(message)) return 'cloud-not-configured'
  return 'sync-failed'
}

export function syncErrorMessageKey(error: unknown): TranslationKey {
  const code = syncErrorCode(error)
  if (code === 'cloud-not-configured') return 'sync.error.config'
  if (code === 'permission-denied' || code === 'cloud-http-403') return 'sync.error.permission'
  if (['failed-precondition', 'not-found', 'cloud-http-404'].includes(code)) return 'sync.error.service'
  if (['resource-exhausted', 'cloud-http-429'].includes(code)) return 'sync.error.limit'
  if (['unauthenticated', 'cloud-http-401', 'cloud-account-mismatch', 'account-switch-consent-required'].includes(code) || (code.startsWith('auth/') && code !== 'auth/network-request-failed') || code.startsWith('oauth-')) return 'sync.error.login'
  if (['unavailable', 'deadline-exceeded', 'cloud-offline', 'cloud-timeout', 'cloud-network-error', 'auth/network-request-failed', 'cloud-http-503'].includes(code)) return 'sync.error.network'
  return 'sync.error.general'
}

export function isSyncCancelled(error: unknown): boolean {
  return ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'account-switch-cancelled', 'cancelled'].includes(syncErrorCode(error))
}
