export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface NativeSnapshot {
  version: 3
  values: Record<string, string>
}

/** Synchronous domain reads with a single serialized, durable native writer. */
export class NativePersistence implements KeyValueStorage {
  private values: Record<string, string>
  private revision = 0
  private saved = 0
  private pending: Promise<void> | null = null
  public error: string | null = null

  constructor(snapshot: NativeSnapshot, private readonly write: (snapshot: NativeSnapshot) => Promise<void>, private readonly onStatus: (error: string | null) => void = () => {}) {
    this.values = { ...snapshot.values }
  }

  getItem(key: string): string | null { return this.values[key] ?? null }
  setItem(key: string, value: string): void {
    if (this.values[key] === value) return
    this.values[key] = value
    this.changed()
  }
  removeItem(key: string): void {
    if (!(key in this.values)) return
    delete this.values[key]
    this.changed()
  }
  private changed(): void {
    this.revision++
    // Domain operations such as session + stats writes are coalesced in this turn.
    queueMicrotask(() => { void this.flush().catch(() => {}) })
  }
  async flush(): Promise<void> {
    if (this.pending) {
      await this.pending
      if (this.saved < this.revision) return this.flush()
      return
    }
    if (this.saved === this.revision) return
    this.pending = (async () => {
      while (this.saved < this.revision) {
        const revision = this.revision
        await this.write({ version: 3, values: { ...this.values } })
        this.saved = revision
      }
      this.error = null
      this.onStatus(null)
    })().catch((error: unknown) => {
      this.error = String(error)
      this.onStatus(this.error)
      throw error
    }).finally(() => { this.pending = null })
    return this.pending
  }
}

export function validateNativeSnapshot(value: unknown): NativeSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid native data file')
  const raw = value as Record<string, unknown>
  if (raw.version !== 3 || !raw.values || typeof raw.values !== 'object' || Array.isArray(raw.values)) throw Error('Unsupported native data schema')
  const values: Record<string, string> = Object.create(null) as Record<string, string>
  for (const [key, item] of Object.entries(raw.values)) {
    if (!/^ff[23]?_/.test(key) || typeof item !== 'string') throw Error('Invalid native storage entry')
    values[key] = item
  }
  return { version: 3, values }
}
