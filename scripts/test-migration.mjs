import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/, 'A loopback Firestore emulator is required')
assert.ok(process.env.FOCUS_FLOW_MIGRATION_SNAPSHOT, 'Set FOCUS_FLOW_MIGRATION_SNAPSHOT to the private Firestore snapshot')
assert.ok(statSync(process.env.FOCUS_FLOW_MIGRATION_SNAPSHOT).isFile(), 'Snapshot must be a file')
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'src/lib/sync/migration.emulator.test.ts'], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
