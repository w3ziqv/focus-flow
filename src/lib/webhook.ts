import type { ChecklistItem, TimerMode, WebhookEvent, WebhookPayload, WebhookSettings } from '../types'

export type { WebhookEvent, WebhookPayload, WebhookSettings }

export interface WebhookTestResult {
  success: boolean
  status?: number
  error?: string
}

/**
 * Validates that a string is a valid absolute HTTP or HTTPS URL.
 */
export function isValidWebhookUrl(urlString: string): boolean {
  if (typeof urlString !== 'string') return false
  const trimmed = urlString.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Constructs a typed WebhookPayload adhering to the Stage 4 (v2.4) specification.
 */
export function createWebhookPayload(
  event: WebhookEvent,
  session: {
    id: string
    mode: TimerMode
    durationMinutes: number
    task: string | null
    checklist?: ChecklistItem[]
  },
  timestamp: string = new Date().toISOString(),
): WebhookPayload {
  return {
    event,
    timestamp,
    app: 'focus-flow',
    version: '2.4',
    session,
  }
}

/**
 * Direct client-side HTTP POST dispatcher for timer lifecycle events.
 * Executes with pure silent error handling: never throws unhandled exceptions or disrupts the caller.
 * Enforces a 5000ms timeout via AbortController.
 */
export async function dispatchWebhook(
  settings: WebhookSettings,
  payload: WebhookPayload,
): Promise<boolean> {
  if (!settings || !settings.enabled || typeof settings.url !== 'string') {
    return false
  }

  const trimmedUrl = settings.url.trim()
  if (!trimmedUrl || !isValidWebhookUrl(trimmedUrl)) {
    return false
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    return res?.ok ?? false
  } catch {
    // Pure silent error handling: network offline, CORS blocked, timeout, DNS failure
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Diagnostic test trigger sending a standardized diagnostic payload to the specified URL.
 * Surfaces user-facing success or error diagnostics for the settings modal.
 */
export async function testWebhook(
  url: string,
): Promise<{ success: boolean; status?: number; error?: string }> {
  if (typeof url !== 'string') {
    return { success: false, error: 'URL must be a string' }
  }

  const trimmedUrl = url.trim()
  if (!trimmedUrl) {
    return { success: false, error: 'URL is required' }
  }

  if (!isValidWebhookUrl(trimmedUrl)) {
    return { success: false, error: 'Invalid URL format: must be http or https' }
  }

  const payload: WebhookPayload = {
    event: 'start',
    timestamp: new Date().toISOString(),
    app: 'focus-flow',
    version: '2.4',
    session: {
      id: 'test-ping',
      mode: 'focus',
      durationMinutes: 25,
      task: 'Test Webhook Integration',
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `HTTP ${res.status}${res.statusText ? `: ${res.statusText}` : ''}`,
      }
    }

    return { success: true, status: res.status }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  } finally {
    clearTimeout(timeoutId)
  }
}
