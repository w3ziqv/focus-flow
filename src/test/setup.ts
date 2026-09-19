import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

const store = new Map<string, string>()

class MemoryStorage {
  getItem(key: string): string | null {
    return store.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    store.set(key, String(value))
  }
  removeItem(key: string): void {
    store.delete(key)
  }
  clear(): void {
    store.clear()
  }
  get length(): number {
    return store.size
  }
  key(index: number): string | null {
    return Array.from(store.keys())[index] ?? null
  }
}

// Ensure Storage constructor exists with methods on prototype
const StorageClass = typeof Storage !== 'undefined' ? Storage : (MemoryStorage as unknown as typeof Storage)
if (typeof Storage === 'undefined') {
  globalThis.Storage = StorageClass
} else {
  // Sync methods to Storage.prototype so prototype spies work
  if (!Storage.prototype.getItem) Storage.prototype.getItem = MemoryStorage.prototype.getItem
  if (!Storage.prototype.setItem) Storage.prototype.setItem = MemoryStorage.prototype.setItem
  if (!Storage.prototype.removeItem) Storage.prototype.removeItem = MemoryStorage.prototype.removeItem
  if (!Storage.prototype.clear) Storage.prototype.clear = MemoryStorage.prototype.clear
}

const memoryStorageInstance = Object.create(Storage.prototype) as Storage
Object.defineProperties(memoryStorageInstance, {
  getItem: { value: (key: string) => Storage.prototype.getItem.call(memoryStorageInstance, key), writable: true, configurable: true },
  setItem: { value: (key: string, val: string) => Storage.prototype.setItem.call(memoryStorageInstance, key, val), writable: true, configurable: true },
  removeItem: { value: (key: string) => Storage.prototype.removeItem.call(memoryStorageInstance, key), writable: true, configurable: true },
  clear: { value: () => Storage.prototype.clear.call(memoryStorageInstance), writable: true, configurable: true },
})

// Actually, in MemoryStorage:
Storage.prototype.getItem = function (key: string) {
  return store.get(key) ?? null
}
Storage.prototype.setItem = function (key: string, value: string) {
  store.set(key, String(value))
}
Storage.prototype.removeItem = function (key: string) {
  store.delete(key)
}
Storage.prototype.clear = function () {
  store.clear()
}
Object.defineProperty(Storage.prototype, 'length', {
  get() {
    return store.size
  },
  configurable: true,
})
Storage.prototype.key = function (index: number) {
  return Array.from(store.keys())[index] ?? null
}

const instance = Object.create(Storage.prototype) as Storage

Object.defineProperty(globalThis, 'localStorage', {
  value: instance,
  writable: true,
  configurable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: instance,
    writable: true,
    configurable: true,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})


