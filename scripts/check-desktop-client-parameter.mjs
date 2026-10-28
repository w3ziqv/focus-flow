import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const parameter = process.env.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET
if (parameter) {
  function check(directory) {
    for (const file of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, file.name)
      if (file.isDirectory()) check(path)
      else assert.ok(!readFileSync(path).includes(parameter), 'Desktop client parameter leaked into frontend assets')
    }
  }
  check('dist-desktop')
  assert.ok(!readFileSync('src-tauri/target/release/bundle/desktop-build.json').includes(parameter),
    'Desktop client parameter leaked into installer metadata')
}
console.log('Desktop frontend/metadata isolation checked; no credentials printed.')
