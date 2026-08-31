import type { CustomSound } from '../types'
import { loadCustomSounds, saveCustomSounds } from './storage'

/**
 * Custom soundscape audio lives in IndexedDB as raw Blobs — localStorage
 * (~5 MB per origin) could only hold a few megabytes of base64. Only the
 * { id, name } metadata stays in localStorage so the sound list renders
 * before any async work and keeps the storage-adapter boundary of ADR-003.
 */

const DB_NAME = 'focus-flow-sounds'
const STORE = 'sounds'

interface StoredSound {
  name: string
  blob: Blob
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB unavailable'))
  })
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = run(tx.objectStore(STORE))
        tx.oncomplete = () => {
          db.close()
          resolve(request.result)
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error ?? new Error('IndexedDB request failed'))
        }
        tx.onabort = () => {
          db.close()
          reject(tx.error ?? new Error('IndexedDB transaction aborted'))
        }
      }),
  )
}

export function putSound(id: string, name: string, blob: Blob): Promise<void> {
  return withStore('readwrite', (store) => store.put({ name, blob }, id)).then(() => undefined)
}

export async function getSoundBlob(id: string): Promise<Blob | null> {
  const stored = await withStore<StoredSound | undefined>('readonly', (store) => store.get(id))
  return stored?.blob ?? null
}

export function deleteSound(id: string): Promise<void> {
  return withStore('readwrite', (store) => store.delete(id)).then(() => undefined)
}

interface LegacyEntry {
  id: string
  name: string
  dataUrl: string
}

function isLegacyEntry(value: unknown): value is LegacyEntry {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' && typeof v.name === 'string' && typeof v.dataUrl === 'string' && v.dataUrl.startsWith('data:')
  )
}

/**
 * One-time move of pre-IndexedDB sounds (inline base64 in localStorage) into
 * IDB. Idempotent: migrated entries lose their dataUrl, so the next run finds
 * nothing to do. Entries that fail keep the data: URL and still play through
 * the runtime fallback.
 */
export async function migrateLegacySounds(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  let raw: unknown
  try {
    raw = JSON.parse(localStorage.getItem('ff2_sounds') ?? 'null')
  } catch {
    return
  }
  if (!Array.isArray(raw)) return
  const legacy = raw.filter(isLegacyEntry)
  if (legacy.length === 0) return

  const migrated = new Set<string>()
  for (const entry of legacy) {
    try {
      const blob = await (await fetch(entry.dataUrl)).blob()
      await putSound(entry.id, entry.name, blob)
      migrated.add(entry.id)
    } catch {
      // Kept inline — playback falls back to the data: URL.
    }
  }
  if (migrated.size === 0) return
  const metas: CustomSound[] = loadCustomSounds().map((sound) =>
    migrated.has(sound.id) ? { id: sound.id, name: sound.name } : sound,
  )
  saveCustomSounds(metas)
}
