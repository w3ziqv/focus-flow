import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_NOTIFICATION_OPTIONS,
  dispatchNotification,
  dispatchSessionCompletion,
  getNotificationPermission,
  HAPTIC_FEEDBACK_PATTERN,
  isNotificationSupported,
  requestNotificationPermission,
  triggerHapticFeedback,
} from './notifications'

describe('notifications module', () => {
  const originalNotification = window.Notification
  const originalNavigator = window.navigator

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // Restore global Notification and navigator
    Object.defineProperty(window, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  describe('Notification support and permission queries', () => {
    it('isNotificationSupported returns true when Notification API is available', () => {
      class MockNotification {}
      Object.defineProperty(window, 'Notification', {
        value: MockNotification,
        writable: true,
        configurable: true,
      })
      expect(isNotificationSupported()).toBe(true)
    })

    it('isNotificationSupported returns false when Notification API is undefined', () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      expect(isNotificationSupported()).toBe(false)
    })

    it('getNotificationPermission returns current permission when supported', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      })
      expect(getNotificationPermission()).toBe('granted')

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      })
      expect(getNotificationPermission()).toBe('denied')

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      })
      expect(getNotificationPermission()).toBe('default')
    })

    it('getNotificationPermission returns "unsupported" when Notification is undefined', () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      expect(getNotificationPermission()).toBe('unsupported')
    })

    it('getNotificationPermission returns "unsupported" when Notification.permission is not a string', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: null },
        writable: true,
        configurable: true,
      })
      expect(getNotificationPermission()).toBe('unsupported')
    })

    it('requestNotificationPermission returns updated permission when user grants', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: mockRequestPermission,
        },
        writable: true,
        configurable: true,
      })

      const result = await requestNotificationPermission()
      expect(result).toBe('granted')
      expect(mockRequestPermission).toHaveBeenCalled()
    })

    it('requestNotificationPermission falls back safely when requestPermission throws', async () => {
      const mockRequestPermission = vi.fn().mockRejectedValue(new Error('User dismissed dialog'))
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: mockRequestPermission,
        },
        writable: true,
        configurable: true,
      })

      const result = await requestNotificationPermission()
      expect(result).toBe('default')
    })

    it('requestNotificationPermission returns "unsupported" when API is missing', async () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await requestNotificationPermission()
      expect(result).toBe('unsupported')
    })

    it('requestNotificationPermission falls back to getNotificationPermission if requestPermission returns undefined (legacy callback API)', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: mockRequestPermission,
        },
        writable: true,
        configurable: true,
      })

      const result = await requestNotificationPermission()
      expect(result).toBe('granted')
    })
  })

  describe('Native haptic feedback (triggerHapticFeedback)', () => {
    it('calls navigator.vibrate with default session pattern [300, 150, 300]', () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })

      const result = triggerHapticFeedback()
      expect(result).toBe(true)
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_FEEDBACK_PATTERN)
      expect(vibrateSpy).toHaveBeenCalledWith([300, 150, 300])
    })

    it('calls navigator.vibrate with custom pattern when provided', () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })

      const customPattern = [100, 50, 100]
      const result = triggerHapticFeedback(customPattern)
      expect(result).toBe(true)
      expect(vibrateSpy).toHaveBeenCalledWith(customPattern)
    })

    it('calls navigator.vibrate with single number duration when provided', () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })

      const result = triggerHapticFeedback(250)
      expect(result).toBe(true)
      expect(vibrateSpy).toHaveBeenCalledWith(250)
    })

    it('returns false and does not throw when navigator.vibrate is undefined (e.g. desktop/iOS Safari)', () => {
      Object.defineProperty(window.navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(() => {
        const result = triggerHapticFeedback()
        expect(result).toBe(false)
      }).not.toThrow()
    })

    it('catches and ignores exceptions if navigator.vibrate throws SecurityError', () => {
      const vibrateSpy = vi.fn().mockImplementation(() => {
        throw new Error('SecurityError: NotAllowed')
      })
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })

      expect(() => {
        const result = triggerHapticFeedback()
        expect(result).toBe(false)
      }).not.toThrow()
    })
  })

  describe('dispatchNotification - Permission guards', () => {
    it('silently returns false without throwing when permission is "denied"', async () => {
      const showNotificationSpy = vi.fn()
      const notificationConstructorSpy = vi.fn()

      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'denied' }),
        writable: true,
        configurable: true,
      })

      const result = await dispatchNotification('Session complete', { body: 'Deep Work' })
      expect(result).toBe(false)
      expect(showNotificationSpy).not.toHaveBeenCalled()
      expect(notificationConstructorSpy).not.toHaveBeenCalled()
    })

    it('silently returns false without throwing when permission is "default"', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'default' }),
        writable: true,
        configurable: true,
      })

      const result = await dispatchNotification('Session complete')
      expect(result).toBe(false)
      expect(notificationConstructorSpy).not.toHaveBeenCalled()
    })

    it('silently returns false when Notification API is entirely missing', async () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await dispatchNotification('Session complete')
      expect(result).toBe(false)
    })
  })

  describe('dispatchNotification - Service Worker delivery (Mobile PWA)', () => {
    it('delivers via registration.showNotification with required options when SW is ready', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      const mockRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration

      // Mock Notification permission as granted
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      // Mock navigator.serviceWorker.ready
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration),
        },
        writable: true,
        configurable: true,
      })

      // Mock navigator.vibrate
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Focus session complete', {
        body: 'Write unit tests',
      })

      expect(delivered).toBe(true)
      expect(vibrateSpy).toHaveBeenCalledWith([300, 150, 300])

      expect(showNotificationMock).toHaveBeenCalledTimes(1)
      expect(showNotificationMock).toHaveBeenCalledWith('Focus session complete', {
        ...DEFAULT_NOTIFICATION_OPTIONS,
        body: 'Write unit tests',
        vibrate: [200, 100, 200],
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'focus-flow-session',
        renotify: true,
      })

      // Desktop fallback constructor must NOT be invoked when SW succeeds
      expect(notificationConstructorSpy).not.toHaveBeenCalled()
    })

    it('allows overriding notification options (e.g. custom tag or icon)', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      const mockRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration

      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration),
        },
        writable: true,
        configurable: true,
      })

      await dispatchNotification('Break over', {
        tag: 'custom-break-tag',
        icon: '/custom-icon.png',
      })

      expect(showNotificationMock).toHaveBeenCalledWith(
        'Break over',
        expect.objectContaining({
          tag: 'custom-break-tag',
          icon: '/custom-icon.png',
          vibrate: [200, 100, 200],
          badge: '/favicon.svg',
          renotify: true,
        }),
      )
    })
  })

  describe('dispatchNotification - Desktop fallback & Error Resilience', () => {
    it('falls back to new Notification() when navigator.serviceWorker is absent', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      // ServiceWorker is absent
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Focus session complete', {
        body: 'Refactor code',
      })

      expect(delivered).toBe(true)
      expect(notificationConstructorSpy).toHaveBeenCalledTimes(1)
      expect(notificationConstructorSpy).toHaveBeenCalledWith(
        'Focus session complete',
        expect.objectContaining({
          body: 'Refactor code',
          tag: 'focus-flow-session',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
          renotify: true,
        }),
      )
    })

    it('falls back to new Notification() when serviceWorker.ready rejects', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.reject(new Error('Service worker failed to register')),
        },
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Break over')
      expect(delivered).toBe(true)
      expect(notificationConstructorSpy).toHaveBeenCalledTimes(1)
      expect(notificationConstructorSpy).toHaveBeenCalledWith(
        'Break over',
        expect.objectContaining({
          tag: 'focus-flow-session',
        }),
      )
    })

    it('falls back to new Notification() when registration.showNotification rejects', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      const showNotificationMock = vi.fn().mockRejectedValue(new Error('Permission denied inside SW'))
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({ showNotification: showNotificationMock }),
        },
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Session complete')
      expect(delivered).toBe(true)
      expect(showNotificationMock).toHaveBeenCalled()
      expect(notificationConstructorSpy).toHaveBeenCalledWith(
        'Session complete',
        expect.objectContaining({ tag: 'focus-flow-session' }),
      )
    })

    it('gracefully returns false without throwing when new Notification() throws (e.g. Chrome Android TypeError)', async () => {
      // On mobile Chrome, calling `new Notification()` throws:
      // TypeError: Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.
      class ThrowingNotification {
        static permission = 'granted'
        constructor() {
          throw new TypeError("Failed to construct 'Notification': Illegal constructor.")
        }
      }

      Object.defineProperty(window, 'Notification', {
        value: ThrowingNotification,
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined, // Simulating SW missing or inactive
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Session complete')
      expect(delivered).toBe(false)
    })
  })

  describe('dispatchSessionCompletion - Parallel audio chime and notification', () => {
    it('executes notification dispatch and playChime in parallel', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({ showNotification: showNotificationMock }),
        },
        writable: true,
        configurable: true,
      })

      const chimeSpy = vi.fn()
      const result = await dispatchSessionCompletion(
        'Session complete',
        { body: 'Focus block done' },
        { playChime: chimeSpy },
      )

      expect(result.notification).toBe(true)
      expect(result.chime).toBe(true)
      expect(chimeSpy).toHaveBeenCalledTimes(1)
      expect(showNotificationMock).toHaveBeenCalledTimes(1)
    })

    it('does not throw or fail notification delivery if playChime throws (e.g. autoplay blocked)', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({ showNotification: showNotificationMock }),
        },
        writable: true,
        configurable: true,
      })

      const blockedChimeSpy = vi.fn().mockImplementation(() => {
        throw new Error('NotAllowedError: AudioContext autoplay policy blocked')
      })

      const result = await dispatchSessionCompletion(
        'Session complete',
        { body: 'Focus block done' },
        { playChime: blockedChimeSpy },
      )

      expect(result.notification).toBe(true)
      expect(result.chime).toBe(false)
      expect(blockedChimeSpy).toHaveBeenCalledTimes(1)
      expect(showNotificationMock).toHaveBeenCalledTimes(1)
    })

    it('triggers native haptics even when Notification.permission is denied or default', async () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      })

      const chimeSpy = vi.fn()
      const result = await dispatchSessionCompletion(
        'Session complete',
        { body: 'Focus block done' },
        { playChime: chimeSpy },
      )

      expect(result.notification).toBe(false)
      expect(result.chime).toBe(true)
      expect(result.haptic).toBe(true)
      expect(chimeSpy).toHaveBeenCalledTimes(1)
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_FEEDBACK_PATTERN)
    })

    it('skips native haptic feedback in dispatchSessionCompletion when hapticFeedback is explicitly false', async () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      const chimeSpy = vi.fn()
      const result = await dispatchSessionCompletion(
        'Session complete',
        { body: 'Focus block done', hapticFeedback: false },
        { playChime: chimeSpy },
      )

      expect(result.haptic).toBe(false)
      expect(vibrateSpy).not.toHaveBeenCalled()
    })

    it('supports audioEngine with chime() method alias and preserves this context', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({ showNotification: showNotificationMock }),
        },
        writable: true,
        configurable: true,
      })

      class CustomAudioEngine {
        called = false
        chime() {
          this.called = true
        }
      }
      const engine = new CustomAudioEngine()
      const result = await dispatchSessionCompletion(
        'Session complete',
        { body: 'Focus done' },
        engine,
      )

      expect(result.chime).toBe(true)
      expect(engine.called).toBe(true)
    })
  })

  describe('Adversarial & Edge Cases', () => {
    it('falls back to new Notification() when serviceWorker.ready times out (> 500ms)', async () => {
      vi.useFakeTimers()
      try {
        const notificationConstructorSpy = vi.fn()
        Object.defineProperty(window, 'Notification', {
          value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
          writable: true,
          configurable: true,
        })

        // Promise that never resolves
        const neverEndingReady = new Promise<ServiceWorkerRegistration>(() => {})
        Object.defineProperty(window.navigator, 'serviceWorker', {
          value: {
            ready: neverEndingReady,
          },
          writable: true,
          configurable: true,
        })

        const dispatchPromise = dispatchNotification('Timeout test')

        // Fast-forward past 500ms SW timeout
        await vi.advanceTimersByTimeAsync(600)

        const delivered = await dispatchPromise
        expect(delivered).toBe(true)
        expect(notificationConstructorSpy).toHaveBeenCalledTimes(1)
        expect(notificationConstructorSpy).toHaveBeenCalledWith(
          'Timeout test',
          expect.objectContaining({ tag: 'focus-flow-session' }),
        )
      } finally {
        vi.useRealTimers()
      }
    })

    it('falls back to new Notification() when showNotification throws synchronously', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      const throwingShowNotification = vi.fn().mockImplementation(() => {
        throw new Error('Synchronous SW exception')
      })

      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({ showNotification: throwingShowNotification }),
        },
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Sync throw test')
      expect(delivered).toBe(true)
      expect(throwingShowNotification).toHaveBeenCalled()
      expect(notificationConstructorSpy).toHaveBeenCalledWith(
        'Sync throw test',
        expect.objectContaining({ tag: 'focus-flow-session' }),
      )
    })

    it('succeeds with desktop fallback when navigator.vibrate is missing', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('No vibrate test')
      expect(delivered).toBe(true)
      expect(notificationConstructorSpy).toHaveBeenCalledTimes(1)
    })

    it('handles empty string title safely', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('')
      expect(delivered).toBe(true)
      expect(notificationConstructorSpy).toHaveBeenCalledWith('', expect.any(Object))
    })

    it('skips haptic feedback when hapticFeedback is explicitly false', async () => {
      const vibrateSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
        configurable: true,
      })
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('No haptic session', {
        hapticFeedback: false,
      })
      expect(delivered).toBe(true)
      expect(vibrateSpy).not.toHaveBeenCalled()
    })

    it('cleans undefined body property and disables renotify when tag is empty', async () => {
      const notificationConstructorSpy = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: Object.assign(notificationConstructorSpy, { permission: 'granted' }),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Clean options test', {
        body: undefined,
        tag: '',
        renotify: true,
      })
      expect(delivered).toBe(true)
      expect(notificationConstructorSpy).toHaveBeenCalledWith(
        'Clean options test',
        expect.not.objectContaining({ body: undefined }),
      )
      const passedOptions = notificationConstructorSpy.mock.calls[0][1]
      expect('body' in passedOptions).toBe(false)
      expect(passedOptions.renotify).toBe(false)
    })

    it('discovers ServiceWorker registration via getRegistration() when ready is undefined', async () => {
      const showNotificationMock = vi.fn().mockResolvedValue(undefined)
      const mockRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration

      Object.defineProperty(window, 'Notification', {
        value: Object.assign(vi.fn(), { permission: 'granted' }),
        writable: true,
        configurable: true,
      })

      const getRegistrationMock = vi.fn().mockResolvedValue(mockRegistration)
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          getRegistration: getRegistrationMock,
          ready: undefined,
        },
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('GetRegistration test', {
        body: 'Testing SW fallback via getRegistration',
      })

      expect(delivered).toBe(true)
      expect(getRegistrationMock).toHaveBeenCalled()
      expect(showNotificationMock).toHaveBeenCalledTimes(1)
      expect(showNotificationMock).toHaveBeenCalledWith(
        'GetRegistration test',
        expect.objectContaining({ body: 'Testing SW fallback via getRegistration' }),
      )
    })

    it('retries desktop new Notification with minimal options if full options throw TypeError', async () => {
      let callCount = 0
      const recordedOptions: NotificationOptions[] = []
      class ConditionalNotification {
        static permission = 'granted'
        constructor(_title: string, options: NotificationOptions) {
          callCount++
          recordedOptions.push(options)
          if (callCount === 1) {
            throw new TypeError("Failed to construct 'Notification': Unsupported vibration option.")
          }
        }
      }

      Object.defineProperty(window, 'Notification', {
        value: ConditionalNotification,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const delivered = await dispatchNotification('Strict desktop test', {
        body: 'Desktop body',
        icon: '/favicon.svg',
      })

      expect(delivered).toBe(true)
      expect(callCount).toBe(2)
      expect(recordedOptions[1]).toEqual({
        body: 'Desktop body',
        icon: '/favicon.svg',
        tag: 'focus-flow-session',
      })
    })

    it('discovers ServiceWorker registration concurrently via ready even if getRegistration() hangs or is slow', async () => {
      vi.useFakeTimers()
      try {
        const showNotificationMock = vi.fn().mockResolvedValue(undefined)
        const mockRegistration = {
          showNotification: showNotificationMock,
        } as unknown as ServiceWorkerRegistration

        Object.defineProperty(window, 'Notification', {
          value: Object.assign(vi.fn(), { permission: 'granted' }),
          writable: true,
          configurable: true,
        })

        // getRegistration returns a promise that never resolves
        const hangingGetRegistration = vi.fn().mockReturnValue(new Promise(() => {}))
        Object.defineProperty(window.navigator, 'serviceWorker', {
          value: {
            getRegistration: hangingGetRegistration,
            ready: Promise.resolve(mockRegistration),
          },
          writable: true,
          configurable: true,
        })

        const dispatchPromise = dispatchNotification('Hanging getRegistration test')
        await vi.advanceTimersByTimeAsync(600)

        const delivered = await dispatchPromise
        expect(delivered).toBe(true)
        expect(showNotificationMock).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('delivers via SW on mobile even if getRegistration() hangs and new Notification() throws TypeError', async () => {
      vi.useFakeTimers()
      try {
        const showNotificationMock = vi.fn().mockResolvedValue(undefined)
        const mockRegistration = {
          showNotification: showNotificationMock,
        } as unknown as ServiceWorkerRegistration

        class MobileThrowingNotification {
          static permission = 'granted'
          constructor() {
            throw new TypeError("Failed to construct 'Notification': Illegal constructor.")
          }
        }

        Object.defineProperty(window, 'Notification', {
          value: MobileThrowingNotification,
          writable: true,
          configurable: true,
        })

        const hangingGetRegistration = vi.fn().mockReturnValue(new Promise(() => {}))
        Object.defineProperty(window.navigator, 'serviceWorker', {
          value: {
            getRegistration: hangingGetRegistration,
            ready: Promise.resolve(mockRegistration),
          },
          writable: true,
          configurable: true,
        })

        const dispatchPromise = dispatchNotification('Mobile hanging getRegistration test')
        await vi.advanceTimersByTimeAsync(600)

        const delivered = await dispatchPromise
        expect(delivered).toBe(true)
        expect(showNotificationMock).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('discovers ServiceWorker registration concurrently via getRegistration() even if ready hangs', async () => {
      vi.useFakeTimers()
      try {
        const showNotificationMock = vi.fn().mockResolvedValue(undefined)
        const mockRegistration = {
          showNotification: showNotificationMock,
        } as unknown as ServiceWorkerRegistration

        Object.defineProperty(window, 'Notification', {
          value: Object.assign(vi.fn(), { permission: 'granted' }),
          writable: true,
          configurable: true,
        })

        // ready hangs forever
        const hangingReady = new Promise<ServiceWorkerRegistration>(() => {})
        const getRegistrationMock = vi.fn().mockResolvedValue(mockRegistration)

        Object.defineProperty(window.navigator, 'serviceWorker', {
          value: {
            getRegistration: getRegistrationMock,
            ready: hangingReady,
          },
          writable: true,
          configurable: true,
        })

        const dispatchPromise = dispatchNotification('Hanging ready test')
        await vi.advanceTimersByTimeAsync(600)

        const delivered = await dispatchPromise
        expect(delivered).toBe(true)
        expect(showNotificationMock).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
