/**
 * Robust Mobile and Desktop Notification Dispatcher for Focus Flow.
 *
 * Upgrades notification delivery from naive `new Notification()` to
 * `ServiceWorkerRegistration.showNotification()` with vibration feedback,
 * native haptics, and graceful desktop fallback.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface MobileNotificationOptions extends NotificationOptions {
  vibrate?: number[] | number
  renotify?: boolean
  hapticFeedback?: boolean
}

export const NOTIFICATION_DEFAULTS: MobileNotificationOptions = {
  vibrate: [200, 100, 200],
  icon: '/favicon.svg',
  badge: '/favicon.svg',
  tag: 'focus-flow-session',
  renotify: true,
}

export const DEFAULT_NOTIFICATION_OPTIONS: MobileNotificationOptions = NOTIFICATION_DEFAULTS

export const HAPTIC_FEEDBACK_PATTERN: number[] = [300, 150, 300]

/**
 * Checks whether the Notifications API is supported in the current environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined'
}

/**
 * Gets the current notification permission state safely.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported() || typeof Notification.permission !== 'string') {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

/**
 * Requests notification permission from the user in a promise-safe manner.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  try {
    const result = await Notification.requestPermission()
    return (result ?? getNotificationPermission()) as NotificationPermissionState
  } catch {
    return getNotificationPermission()
  }
}

/**
 * Triggers native haptic feedback via navigator.vibrate if available.
 * Returns true if vibration was accepted, false otherwise.
 */
export function triggerHapticFeedback(pattern: number[] | number = HAPTIC_FEEDBACK_PATTERN): boolean {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(pattern)
    }
  } catch {
    // Restricted environment or permission exception
  }
  return false
}

/**
 * Dispatches a notification using ServiceWorkerRegistration.showNotification when
 * available (standard for mobile PWAs such as Chrome Android and iOS PWA), falling
 * back to standard desktop new Notification() if unavailable or inactive.
 *
 * Includes vibration feedback, session tag, icon, and renotify options.
 * Never throws uncaught errors.
 */
export async function dispatchNotification(
  title: string,
  options: MobileNotificationOptions = {},
): Promise<boolean> {
  // 1. Guard against ungranted permission or unsupported environment
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false
  }

  // 2. Trigger native haptic feedback directly upon session completion unless opted out
  if (options.hapticFeedback !== false) {
    triggerHapticFeedback(HAPTIC_FEEDBACK_PATTERN)
  }

  // 3. Compose merged options with defaults
  const mergedOptions: MobileNotificationOptions = {
    ...NOTIFICATION_DEFAULTS,
    ...options,
  }

  if (mergedOptions.body === undefined) {
    delete mergedOptions.body
  }
  if (!mergedOptions.tag && mergedOptions.renotify) {
    mergedOptions.renotify = false
  }
  delete mergedOptions.hapticFeedback

  // 4. Attempt delivery via Service Worker
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    Boolean(navigator.serviceWorker)
  ) {
    try {
      let timerId: ReturnType<typeof setTimeout> | undefined
      const timeoutPromise = new Promise<null>((resolve) => {
        timerId = setTimeout(() => resolve(null), 500)
      })

      const candidates: Promise<ServiceWorkerRegistration>[] = []

      if (navigator.serviceWorker.ready) {
        candidates.push(
          (async () => {
            const reg = await navigator.serviceWorker.ready
            if (reg && typeof reg.showNotification === 'function') return reg
            throw new Error('No showNotification on ready registration')
          })(),
        )
      }

      if (typeof navigator.serviceWorker.getRegistration === 'function') {
        candidates.push(
          (async () => {
            const reg = await navigator.serviceWorker.getRegistration()
            if (reg && typeof reg.showNotification === 'function') return reg
            throw new Error('No showNotification on getRegistration')
          })(),
        )
      }

      const swPromise: Promise<ServiceWorkerRegistration | null> =
        candidates.length > 0 ? Promise.any(candidates).catch(() => null) : Promise.resolve(null)

      const reg = await Promise.race([
        swPromise,
        timeoutPromise,
      ])

      if (timerId !== undefined) {
        clearTimeout(timerId)
      }

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, mergedOptions)
        return true
      }
    } catch {
      // SW delivery failed or rejected; fall through to desktop fallback
    }
  }

  // 5. Gracefully fall back to standard desktop new Notification()
  try {
    new Notification(title, mergedOptions)
    return true
  } catch {
    try {
      // Retry with minimal standard desktop options if browser rejected extended mobile options
      const minimalOptions: NotificationOptions = {}
      if (mergedOptions.body) minimalOptions.body = mergedOptions.body
      if (mergedOptions.icon) minimalOptions.icon = mergedOptions.icon
      if (mergedOptions.tag) minimalOptions.tag = mergedOptions.tag
      new Notification(title, minimalOptions)
      return true
    } catch {
      // In mobile environments without Service Worker (e.g. Chrome Android),
      // new Notification() throws a TypeError.
      return false
    }
  }
}

/**
 * Convenience helper to dispatch session completion notifications, trigger native
 * haptic feedback, and invoke completion audio chime in parallel without throwing
 * errors if audio is blocked or notification permission is ungranted.
 */
export async function dispatchSessionCompletion(
  title: string,
  options?: MobileNotificationOptions,
  audioEngine?: { playChime?: () => void; chime?: () => void },
): Promise<{ notification: boolean; chime: boolean; haptic: boolean }> {
  let chimePlayed = false
  const playFn = audioEngine && (audioEngine.playChime ?? audioEngine.chime)
  if (typeof playFn === 'function') {
    try {
      playFn.call(audioEngine)
      chimePlayed = true
    } catch {
      // Audio playback blocked by browser autoplay policy
    }
  }

  const hapticTriggered =
    options?.hapticFeedback !== false ? triggerHapticFeedback(HAPTIC_FEEDBACK_PATTERN) : false

  const notificationDelivered = await dispatchNotification(title, {
    ...options,
    hapticFeedback: false,
  })

  return { notification: notificationDelivered, chime: chimePlayed, haptic: hapticTriggered }
}
