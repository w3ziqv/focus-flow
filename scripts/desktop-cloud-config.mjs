import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const testProject = 'focus-flow-v3-test-20261010'
const testNumber = '711549076713'
const productionProject = 'focus-flow-70527'
const productionNumber = '895102769411'
const fields = [
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID', 'FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID',
  'FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET',
]

export function validateDesktopCloud(env) {
  const mode = env.FOCUS_FLOW_CLOUD_MODE || 'offline'
  assert.ok(['offline', 'test', 'production'].includes(mode), 'Unknown desktop cloud mode')
  if (mode === 'offline') {
    assert.ok(fields.every(name => !env[name]), 'Offline build contains cloud configuration')
    return { mode, projectId: null, clientId: null }
  }
  if (mode === 'test') {
    assert.equal(env.GITHUB_REF, 'refs/heads/test/v3.0-cloud', 'Test cloud requires the isolated test branch')
  } else {
    assert.ok(['refs/heads/main', 'refs/heads/codex/v3.0-release'].includes(env.GITHUB_REF), 'Production cloud requires main or the dedicated release candidate branch')
    assert.equal(env.GITHUB_REF_PROTECTED, 'true', 'Production cloud requires a protected branch')
  }
  const projectId = mode === 'test' ? testProject : productionProject
  const projectNumber = mode === 'test' ? testNumber : productionNumber
  for (const name of fields) assert.ok(env[name]?.trim(), `Missing build configuration: ${name}`)
  assert.equal(env.VITE_FIREBASE_PROJECT_ID, projectId, 'Unexpected Firebase project')
  assert.equal(env.VITE_FIREBASE_AUTH_DOMAIN, `${projectId}.firebaseapp.com`)
  assert.ok([`${projectId}.firebasestorage.app`, `${projectId}.appspot.com`].includes(env.VITE_FIREBASE_STORAGE_BUCKET), 'Storage bucket belongs to another project')
  assert.equal(env.VITE_FIREBASE_MESSAGING_SENDER_ID, projectNumber)
  assert.ok(env.VITE_FIREBASE_APP_ID.startsWith(`1:${projectNumber}:web:`), 'Firebase app belongs to another project')
  assert.match(env.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID, new RegExp(`^${projectNumber}-[a-z0-9]+\\.apps\\.googleusercontent\\.com$`))
  return { mode, projectId, clientId: env.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID }
}

export function verifyDesktopMetadata(metadata, env) {
  const mode = env.FOCUS_FLOW_CLOUD_MODE || 'offline'
  assert.ok(['offline', 'test', 'production'].includes(mode), 'Unknown desktop cloud mode')
  assert.deepEqual(Object.keys(metadata).sort(), ['clientId', 'commit', 'mode', 'projectId'])
  assert.equal(metadata.mode, mode, 'Installer cloud mode differs from requested runtime verification')
  assert.equal(metadata.projectId, mode === 'offline' ? null : mode === 'test' ? testProject : productionProject)
  const commit = env.FOCUS_FLOW_ARTIFACT_SHA || env.GITHUB_SHA
  assert.match(commit || '', /^[a-f0-9]{40}$/, 'An exact source commit is required')
  assert.equal(metadata.commit, commit)
  if (mode === 'offline') assert.equal(metadata.clientId, null)
  else assert.match(metadata.clientId, new RegExp(`^${mode === 'test' ? testNumber : productionNumber}-[a-z0-9]+\\.apps\\.googleusercontent\\.com$`))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = 'src-tauri/target/release/bundle/desktop-build.json'
  if (process.argv.includes('--verify')) {
    const metadata = JSON.parse(readFileSync(file, 'utf8'))
    verifyDesktopMetadata(metadata, process.env)
  } else {
    const metadata = validateDesktopCloud(process.env)
    mkdirSync('src-tauri/target/release/bundle', { recursive: true })
    writeFileSync(file, JSON.stringify({ ...metadata, commit: process.env.GITHUB_SHA }, null, 2) + '\n')
  }
  console.log('Desktop installer cloud target verified; no credentials printed.')
}
