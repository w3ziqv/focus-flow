import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const testProject = 'focus-flow-v3-test-20261010'
const testNumber = '711549076713'
const fields = [
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID', 'FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID',
]

export function validateDesktopCloud(env) {
  const mode = env.FOCUS_FLOW_CLOUD_MODE || 'offline'
  assert.ok(['offline', 'test'].includes(mode), 'Unknown desktop cloud mode')
  if (mode === 'offline') {
    assert.ok(fields.every(name => !env[name]), 'Offline build contains cloud configuration')
    return { mode, projectId: null, clientId: null }
  }
  assert.equal(env.GITHUB_REF, 'refs/heads/test/v3.0-cloud', 'Test cloud requires the isolated test branch')
  for (const name of fields) assert.ok(env[name]?.trim(), `Missing public build configuration: ${name}`)
  assert.equal(env.VITE_FIREBASE_PROJECT_ID, testProject, 'Unexpected Firebase project')
  assert.equal(env.VITE_FIREBASE_AUTH_DOMAIN, `${testProject}.firebaseapp.com`)
  assert.equal(env.VITE_FIREBASE_MESSAGING_SENDER_ID, testNumber)
  assert.ok(env.VITE_FIREBASE_APP_ID.startsWith(`1:${testNumber}:web:`), 'Firebase app belongs to another project')
  assert.match(env.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID, /^711549076713-[a-z0-9]+\.apps\.googleusercontent\.com$/)
  return { mode, projectId: testProject, clientId: env.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = 'src-tauri/target/release/bundle/desktop-build.json'
  if (process.argv.includes('--verify')) {
    const metadata = JSON.parse(readFileSync(file, 'utf8'))
    const mode = process.env.FOCUS_FLOW_CLOUD_MODE || 'offline'
    assert.equal(metadata.mode, mode, 'Installer cloud mode differs from requested runtime verification')
    assert.equal(metadata.projectId, mode === 'test' ? testProject : null)
    assert.equal(metadata.commit, process.env.FOCUS_FLOW_ARTIFACT_SHA || process.env.GITHUB_SHA)
  } else {
    const metadata = validateDesktopCloud(process.env)
    mkdirSync('src-tauri/target/release/bundle', { recursive: true })
    writeFileSync(file, JSON.stringify({ ...metadata, commit: process.env.GITHUB_SHA }, null, 2) + '\n')
  }
  console.log('Desktop installer cloud target verified; no credentials printed.')
}
