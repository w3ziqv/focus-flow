import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^(127\.0\.0\.1|localhost):\d+$/, 'Integration tests require an isolated loopback Firestore emulator')
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'src/lib/sync/adapter.emulator.test.ts'], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
