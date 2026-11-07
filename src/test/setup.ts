import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(String(key)) ?? null
  }
  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value))
  }
  removeItem(key: string): void {
    this.store.delete(String(key))
  }
  clear(): void {
    this.store.clear()
  }
  get length(): number {
    return this.store.size
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
}

// Node and jsdom can expose different Storage constructors. Use one test
// implementation so quota spies cover both stores without sharing their data.
for (const target of new Set([globalThis, window])) {
  Object.defineProperty(target, 'Storage', { value: MemoryStorage, writable: true, configurable: true })
}
for (const name of ['localStorage', 'sessionStorage'] as const) {
  const instance = new MemoryStorage()
  for (const target of new Set([globalThis, window])) {
    Object.defineProperty(target, name, { value: instance, writable: true, configurable: true })
  }
}

Object.defineProperty(navigator, 'language', {
  value: 'pl-PL',
  configurable: true,
  writable: true,
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
