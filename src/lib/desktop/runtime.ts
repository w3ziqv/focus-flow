import { detectPlatform } from '../platform'
import { NativePersistence, validateNativeSnapshot, type KeyValueStorage } from './persistence'

let persistence: NativePersistence | null = null
export function getPersistence(): KeyValueStorage { return persistence ?? localStorage }
export async function flushPersistence(): Promise<void> { await persistence?.flush() }
export function getPersistenceError(): string | null { return persistence?.error ?? null }
export async function nativeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}
export async function initializeDesktopStorage(): Promise<void> {
  if (detectPlatform() !== 'tauri' || new URLSearchParams(location.search).has('mini')) return
  const stored = await nativeInvoke<unknown>('load_data')
  let snapshot
  if (stored === null) {
    const values: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && /^ff[23]?_/.test(key)) {
        const value = localStorage.getItem(key)
        if (value !== null) values[key] = value
      }
    }
    snapshot = { version: 3 as const, values }
    // Migration is durable before mounting. Original web storage is retained.
    await nativeInvoke('save_data', { snapshot })
  } else snapshot = validateNativeSnapshot(stored)
  persistence = new NativePersistence(snapshot, async data => { await nativeInvoke('save_data', { snapshot: data }) }, error => {
    window.dispatchEvent(new CustomEvent('focus-flow:persistence', { detail: error }))
  })
}
