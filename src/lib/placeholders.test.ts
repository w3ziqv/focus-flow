import { describe, expect, it } from 'vitest'
import { bucketOf, taskGreeting } from './placeholders'

describe('bucketOf', () => {
  it('splits the day into four buckets', () => {
    const at = (h: number) => new Date(2026, 5, 15, h, 0)
    expect(bucketOf(at(5))).toBe('morning')
    expect(bucketOf(at(11))).toBe('morning')
    expect(bucketOf(at(12))).toBe('afternoon')
    expect(bucketOf(at(17))).toBe('afternoon')
    expect(bucketOf(at(18))).toBe('evening')
    expect(bucketOf(at(22))).toBe('evening')
    expect(bucketOf(at(23))).toBe('night')
    expect(bucketOf(at(4))).toBe('night')
  })
})

describe('taskGreeting', () => {
  it('returns a non-empty greeting in both languages', () => {
    for (const lang of ['pl', 'en'] as const) {
      for (const h of [6, 14, 20, 2]) {
        expect(taskGreeting(lang, new Date(2026, 5, 15, h, 0)).trim().length).toBeGreaterThan(0)
      }
    }
  })
})
