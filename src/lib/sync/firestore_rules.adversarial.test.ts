import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// Static wiring check only. Actual authorization tests run with npm run test:rules.
describe('Firestore emulator configuration', () => {
  it('loads the production rules and binds only to loopback', () => {
    const config = JSON.parse(readFileSync('firebase.json', 'utf8'))
    expect(config.firestore.rules).toBe('src/lib/sync/firestore.rules')
    expect(config.emulators.firestore.host).toBe('127.0.0.1')
    expect(readFileSync(config.firestore.rules, 'utf8')).toContain("rules_version = '2'")
  })
})
