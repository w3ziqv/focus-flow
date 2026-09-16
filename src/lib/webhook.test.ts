import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebhookPayload, WebhookSettings } from '../types'
import {
  DEFAULT_WEBHOOK_SETTINGS,
  isWebhookSettings,
  loadWebhookSettings,
  saveWebhookSettings,
} from './storage'
import {
  createWebhookPayload,
  dispatchWebhook,
  isValidWebhookUrl,
  testWebhook,
} from './webhook'

describe('Webhook Storage Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('exports DEFAULT_WEBHOOK_SETTINGS with empty URL and enabled false', () => {
    expect(DEFAULT_WEBHOOK_SETTINGS).toEqual({
      url: '',
      enabled: false,
    })
  })

  it('isWebhookSettings correctly identifies valid WebhookSettings objects', () => {
    expect(isWebhookSettings({ url: 'https://example.com/webhook', enabled: true })).toBe(true)
    expect(isWebhookSettings({ url: '', enabled: false })).toBe(true)
    expect(isWebhookSettings(DEFAULT_WEBHOOK_SETTINGS)).toBe(true)

    // Invalid types and shapes
    expect(isWebhookSettings(null)).toBe(false)
    expect(isWebhookSettings(undefined)).toBe(false)
    expect(isWebhookSettings('string')).toBe(false)
    expect(isWebhookSettings(123)).toBe(false)
    expect(isWebhookSettings([])).toBe(false)
    expect(isWebhookSettings({ url: 'https://example.com' })).toBe(false)
    expect(isWebhookSettings({ enabled: true })).toBe(false)
    expect(isWebhookSettings({ url: 123, enabled: true })).toBe(false)
    expect(isWebhookSettings({ url: 'https://example.com', enabled: 'true' })).toBe(false)
  })

  it('loadWebhookSettings returns default settings when storage is empty', () => {
    const settings = loadWebhookSettings()
    expect(settings).toEqual(DEFAULT_WEBHOOK_SETTINGS)
  })

  it('loadWebhookSettings loads stored settings correctly', () => {
    localStorage.setItem(
      'ff2_webhook',
      JSON.stringify({ url: 'https://hooks.slack.com/services/123', enabled: true }),
    )
    const settings = loadWebhookSettings()
    expect(settings).toEqual({
      url: 'https://hooks.slack.com/services/123',
      enabled: true,
    })
  })

  it('loadWebhookSettings trims URL and clamps to 2048 characters', () => {
    const longUrl = `https://example.com/${'a'.repeat(3000)}`
    localStorage.setItem(
      'ff2_webhook',
      JSON.stringify({ url: `   ${longUrl}   `, enabled: true }),
    )
    const settings = loadWebhookSettings()
    expect(settings.enabled).toBe(true)
    expect(settings.url.length).toBe(2048)
    expect(settings.url.startsWith('https://example.com/')).toBe(true)
  })

  it('loadWebhookSettings falls back to defaults on corrupt JSON in storage', () => {
    localStorage.setItem('ff2_webhook', '{bad-json}')
    const settings = loadWebhookSettings()
    expect(settings).toEqual(DEFAULT_WEBHOOK_SETTINGS)
  })

  it('loadWebhookSettings falls back to defaults on invalid structure in storage', () => {
    localStorage.setItem('ff2_webhook', JSON.stringify({ url: 42, enabled: 'yes' }))
    expect(loadWebhookSettings()).toEqual(DEFAULT_WEBHOOK_SETTINGS)

    localStorage.setItem('ff2_webhook', JSON.stringify(['not', 'an', 'object']))
    expect(loadWebhookSettings()).toEqual(DEFAULT_WEBHOOK_SETTINGS)

    localStorage.setItem('ff2_webhook', JSON.stringify(null))
    expect(loadWebhookSettings()).toEqual(DEFAULT_WEBHOOK_SETTINGS)
  })

  it('saveWebhookSettings persists settings to ff2_webhook', () => {
    saveWebhookSettings({
      url: 'https://webhook.site/abc-123',
      enabled: true,
    })
    const storedRaw = localStorage.getItem('ff2_webhook')
    expect(storedRaw).not.toBeNull()
    const parsed = JSON.parse(storedRaw!)
    expect(parsed).toEqual({
      url: 'https://webhook.site/abc-123',
      enabled: true,
    })

    const reloaded = loadWebhookSettings()
    expect(reloaded).toEqual({
      url: 'https://webhook.site/abc-123',
      enabled: true,
    })
  })

  it('saveWebhookSettings trims URL and clamps to 2048 characters', () => {
    const longUrl = `https://example.com/${'b'.repeat(3000)}`
    saveWebhookSettings({
      url: `  ${longUrl}  `,
      enabled: false,
    })
    const reloaded = loadWebhookSettings()
    expect(reloaded.url.length).toBe(2048)
    expect(reloaded.enabled).toBe(false)
  })

  it('saveWebhookSettings falls back to defaults if given invalid settings', () => {
    // @ts-expect-error test runtime boundary with invalid payload
    saveWebhookSettings({ url: 999, enabled: 'no' })
    const reloaded = loadWebhookSettings()
    expect(reloaded).toEqual(DEFAULT_WEBHOOK_SETTINGS)
  })

  it('saveWebhookSettings strips prototype pollution payloads', () => {
    const malicious = JSON.parse('{"url":"https://evil.com","enabled":true,"__proto__":{"polluted":true}}')
    saveWebhookSettings(malicious)
    const reloaded = loadWebhookSettings()
    expect(reloaded).toEqual({
      url: 'https://evil.com',
      enabled: true,
    })
    // Ensure Object prototype was not polluted
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })
})

describe('isValidWebhookUrl', () => {
  it('validates standard HTTP and HTTPS URLs', () => {
    expect(isValidWebhookUrl('https://example.com/api/webhook')).toBe(true)
    expect(isValidWebhookUrl('http://localhost:8080/events')).toBe(true)
    expect(isValidWebhookUrl('http://127.0.0.1:3000/hook')).toBe(true)
    expect(isValidWebhookUrl('https://maker.ifttt.com/trigger/focus/with/key/xyz')).toBe(true)
  })

  it('rejects invalid, empty, or non-http protocols', () => {
    expect(isValidWebhookUrl('')).toBe(false)
    expect(isValidWebhookUrl('   ')).toBe(false)
    // @ts-expect-error test non-string input
    expect(isValidWebhookUrl(null)).toBe(false)
    // @ts-expect-error test non-string input
    expect(isValidWebhookUrl(123)).toBe(false)
    expect(isValidWebhookUrl('ftp://example.com/hook')).toBe(false)
    expect(isValidWebhookUrl('javascript:alert(1)')).toBe(false)
    expect(isValidWebhookUrl('file:///C:/Users/test')).toBe(false)
    expect(isValidWebhookUrl('not-a-valid-url')).toBe(false)
    expect(isValidWebhookUrl('http://')).toBe(false)
    expect(isValidWebhookUrl('https://')).toBe(false)
  })
})

describe('createWebhookPayload', () => {
  it('constructs a compliant WebhookPayload with version 2.4 and app focus-flow', () => {
    const payload = createWebhookPayload('start', {
      id: 'session-123',
      mode: 'focus',
      durationMinutes: 25,
      task: 'Deep Work on Webhooks',
      checklist: [
        { id: 'c1', text: 'Define types', completed: true },
        { id: 'c2', text: 'Write tests', completed: false },
      ],
    }, '2026-09-16T12:00:00.000Z')

    expect(payload).toEqual({
      event: 'start',
      timestamp: '2026-09-16T12:00:00.000Z',
      app: 'focus-flow',
      version: '2.4',
      session: {
        id: 'session-123',
        mode: 'focus',
        durationMinutes: 25,
        task: 'Deep Work on Webhooks',
        checklist: [
          { id: 'c1', text: 'Define types', completed: true },
          { id: 'c2', text: 'Write tests', completed: false },
        ],
      },
    })
  })

  it('handles null task and undefined checklist', () => {
    const payload = createWebhookPayload('complete', {
      id: 'session-456',
      mode: 'short',
      durationMinutes: 5,
      task: null,
    })

    expect(payload.event).toBe('complete')
    expect(payload.app).toBe('focus-flow')
    expect(payload.version).toBe('2.4')
    expect(payload.session.task).toBeNull()
    expect(payload.session.checklist).toBeUndefined()
    expect(Date.parse(payload.timestamp)).not.toBeNaN()
  })
})

describe('dispatchWebhook', () => {
  const dummyPayload: WebhookPayload = {
    event: 'complete',
    timestamp: '2026-09-16T14:30:00.000Z',
    app: 'focus-flow',
    version: '2.4',
    session: {
      id: 's_001',
      mode: 'focus',
      durationMinutes: 25,
      task: 'Build Webhook Integration',
    },
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false immediately without calling fetch when settings.enabled is false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const settings: WebhookSettings = {
      url: 'https://example.com/webhook',
      enabled: false,
    }

    const result = await dispatchWebhook(settings, dummyPayload)
    expect(result).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns false immediately without calling fetch when settings.url is empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const settings: WebhookSettings = {
      url: '',
      enabled: true,
    }

    const result = await dispatchWebhook(settings, dummyPayload)
    expect(result).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()

    const whitespaceResult = await dispatchWebhook({ url: '   ', enabled: true }, dummyPayload)
    expect(whitespaceResult).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns false immediately without calling fetch when URL format is invalid', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const invalidUrls = ['not-a-url', 'ftp://example.com', 'javascript:alert(1)', 'http://', 'https://']

    for (const badUrl of invalidUrls) {
      const result = await dispatchWebhook({ url: badUrl, enabled: true }, dummyPayload)
      expect(result).toBe(false)
    }

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('dispatches valid POST request with JSON Content-Type, payload body, and returns true on 200 response', async () => {
    let capturedUrl: string | undefined
    let capturedInit: RequestInit | undefined

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
      capturedUrl = String(url)
      capturedInit = init
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    })

    const settings: WebhookSettings = {
      url: '  https://webhook.site/target-uuid  ',
      enabled: true,
    }

    const result = await dispatchWebhook(settings, dummyPayload)
    expect(result).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(capturedUrl).toBe('https://webhook.site/target-uuid')
    expect(capturedInit?.method).toBe('POST')
    expect(capturedInit?.headers).toEqual({
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(capturedInit?.body as string)).toEqual(dummyPayload)
    expect(capturedInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it('returns true on 204 No Content response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const result = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      dummyPayload,
    )
    expect(result).toBe(true)
  })

  it('handles pause and start lifecycle events seamlessly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('OK', { status: 200 }))

    const pausePayload: WebhookPayload = {
      ...dummyPayload,
      event: 'pause',
    }
    const startPayload: WebhookPayload = {
      ...dummyPayload,
      event: 'start',
    }

    const pauseResult = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      pausePayload,
    )
    expect(pauseResult).toBe(true)

    const startResult = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      startPayload,
    )
    expect(startResult).toBe(true)
  })

  it('silent error handling: returns false without throwing on network error (fetch rejects)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      dummyPayload,
    )
    expect(result).toBe(false)
  })

  it('silent error handling: returns false without throwing on CORS error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('CORS request did not succeed'))

    const result = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      dummyPayload,
    )
    expect(result).toBe(false)
  })

  it('silent error handling: returns false without throwing on HTTP 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not Found', { status: 404 }))

    const result = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      dummyPayload,
    )
    expect(result).toBe(false)
  })

  it('silent error handling: returns false without throwing on HTTP 500 server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Internal Server Error', { status: 500 }))

    const result = await dispatchWebhook(
      { url: 'https://example.com/hook', enabled: true },
      dummyPayload,
    )
    expect(result).toBe(false)
  })

  it('silent error handling: handles timeout abortion gracefully without throwing', async () => {
    vi.useFakeTimers()

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'))
        })
      })
    })

    const dispatchPromise = dispatchWebhook(
      { url: 'https://example.com/timeout', enabled: true },
      dummyPayload,
    )

    // Fast-forward past 5000ms timeout
    vi.advanceTimersByTime(5000)

    const result = await dispatchPromise
    expect(result).toBe(false)

    vi.useRealTimers()
  })
})

describe('testWebhook', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns { success: true, status: 200 } on valid URL with 200 response', async () => {
    let capturedBody: string | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      capturedBody = init?.body as string
      return Promise.resolve(new Response(JSON.stringify({ received: true }), { status: 200 }))
    })

    const result = await testWebhook('https://example.com/test-endpoint')
    expect(result).toEqual({
      success: true,
      status: 200,
    })

    // Verify diagnostic test payload contents
    expect(capturedBody).toBeDefined()
    const parsed = JSON.parse(capturedBody!) as WebhookPayload
    expect(parsed.event).toBe('start')
    expect(parsed.app).toBe('focus-flow')
    expect(parsed.version).toBe('2.4')
    expect(parsed.session).toEqual({
      id: 'test-ping',
      mode: 'focus',
      durationMinutes: 25,
      task: 'Test Webhook Integration',
    })
    expect(Date.parse(parsed.timestamp)).not.toBeNaN()
  })

  it('returns { success: true, status: 204 } on 204 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const result = await testWebhook('https://example.com/test-204')
    expect(result).toEqual({
      success: true,
      status: 204,
    })
  })

  it('returns error when URL is empty or invalid', async () => {
    const emptyResult = await testWebhook('')
    expect(emptyResult.success).toBe(false)
    expect(emptyResult.error).toBeDefined()

    const invalidResult = await testWebhook('not-a-valid-url')
    expect(invalidResult.success).toBe(false)
    expect(invalidResult.error).toBeDefined()

    const ftpResult = await testWebhook('ftp://example.com')
    expect(ftpResult.success).toBe(false)
    expect(ftpResult.error).toBeDefined()

    // @ts-expect-error test runtime non-string input
    const nonStringResult = await testWebhook(12345)
    expect(nonStringResult.success).toBe(false)
    expect(nonStringResult.error).toBeDefined()
  })

  it('returns { success: false, error: ... } on network rejection', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await testWebhook('https://offline.example.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to fetch')
  })

  it('returns { success: false, status: 500, error: ... } on HTTP 500 error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    }))

    const result = await testWebhook('https://example.com/server-error')
    expect(result.success).toBe(false)
    expect(result.status).toBe(500)
    expect(result.error).toContain('500')
  })

  it('returns { success: false, status: 404, error: ... } on HTTP 404 error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
    }))

    const result = await testWebhook('https://example.com/not-found')
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
    expect(result.error).toContain('404')
  })

  it('handles timeout abortion in testWebhook gracefully', async () => {
    vi.useFakeTimers()

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'))
        })
      })
    })

    const testPromise = testWebhook('https://example.com/hangs')

    vi.advanceTimersByTime(5000)

    const result = await testPromise
    expect(result.success).toBe(false)
    expect(result.error).toContain('aborted')

    vi.useRealTimers()
  })
})
