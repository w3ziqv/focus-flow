import type { OS, Platform } from './platform'

/**
 * Chrome/Edge handshake fired once per page load when the app is installable.
 * Declared here because TypeScript's DOM lib does not know it yet.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

let captured: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()

function notify(): void {
  for (const cb of listeners) cb()
}

/** Idempotently start listening for the browser's install handshake. */
export function captureInstallPrompt(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    captured = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    captured = null
    notify()
  })
}

export function getInstallPromptEvent(): BeforeInstallPromptEvent | null {
  return captured
}

/** Hands the event out and clears it — the browser only allows one `prompt()`. */
export function consumeInstallPrompt(): BeforeInstallPromptEvent | null {
  const event = captured
  captured = null
  return event
}

export function subscribeInstallPrompt(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export type InstallPromptAction = 'native' | 'guide-ios' | 'guide-android' | 'none'

export interface InstallPromptDecision {
  platform: Platform
  os: OS
  dismissed: boolean
  canPrompt: boolean
}

/**
 * Pure gate for the install suggestion: browsers without the handshake
 * (Firefox, Safari desktop) stay quiet, iOS always gets the manual guide,
 * Android falls back to a guide when the handshake never arrived.
 */
export function resolveInstallPromptAction({ platform, os, dismissed, canPrompt }: InstallPromptDecision): InstallPromptAction {
  if (dismissed || platform !== 'browser') return 'none'
  if (os === 'ios') return 'guide-ios'
  if (os === 'desktop') return canPrompt ? 'native' : 'none'
  return canPrompt ? 'native' : 'guide-android'
}
