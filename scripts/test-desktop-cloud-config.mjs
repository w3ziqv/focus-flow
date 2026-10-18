import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateDesktopCloud, verifyDesktopMetadata } from './desktop-cloud-config.mjs'

const configured = {
  FOCUS_FLOW_CLOUD_MODE: 'test', GITHUB_REF: 'refs/heads/test/v3.0-cloud',
  VITE_FIREBASE_API_KEY: 'synthetic-public-key',
  VITE_FIREBASE_PROJECT_ID: 'focus-flow-v3-test-20261010',
  VITE_FIREBASE_AUTH_DOMAIN: 'focus-flow-v3-test-20261010.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: 'focus-flow-v3-test-20261010.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '711549076713',
  VITE_FIREBASE_APP_ID: '1:711549076713:web:synthetic',
  FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: '711549076713-synthetic.apps.googleusercontent.com',
  FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET: 'synthetic-desktop-client-parameter',
}
test('offline builds reject accidentally inherited cloud variables', () => {
  assert.equal(validateDesktopCloud({}).projectId, null)
  assert.throws(() => validateDesktopCloud({ VITE_FIREBASE_API_KEY: 'accidental' }))
  assert.throws(() => validateDesktopCloud({ FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET: 'accidental' }))
})
test('test cloud requires the test branch and one coherent Firebase project', () => {
  assert.equal(validateDesktopCloud(configured).projectId, configured.VITE_FIREBASE_PROJECT_ID)
  for (const replacement of [
    { GITHUB_REF: 'refs/heads/main' }, { VITE_FIREBASE_PROJECT_ID: 'production' },
    { VITE_FIREBASE_MESSAGING_SENDER_ID: 'different' },
    { VITE_FIREBASE_APP_ID: '1:123:web:different' },
    { FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: '123-other.apps.googleusercontent.com' },
    { VITE_FIREBASE_API_KEY: '' }, { FOCUS_FLOW_CLOUD_MODE: 'production' },
    { FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET: '' },
  ]) assert.throws(() => validateDesktopCloud({ ...configured, ...replacement }))
})
test('installer metadata excludes the desktop client parameter', () => {
  const result = validateDesktopCloud(configured)
  assert.deepEqual(Object.keys(result).sort(), ['clientId', 'mode', 'projectId'])
  assert.ok(!JSON.stringify(result).includes(configured.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET))
})

const production = {
  ...configured,
  FOCUS_FLOW_CLOUD_MODE: 'production', GITHUB_REF: 'refs/heads/main', GITHUB_REF_PROTECTED: 'true',
  VITE_FIREBASE_PROJECT_ID: 'focus-flow-70527',
  VITE_FIREBASE_AUTH_DOMAIN: 'focus-flow-70527.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: 'focus-flow-70527.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '895102769411',
  VITE_FIREBASE_APP_ID: '1:895102769411:web:synthetic',
  FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: '895102769411-synthetic.apps.googleusercontent.com',
}

test('production cloud requires a protected release branch and coherent production identifiers', () => {
  assert.equal(validateDesktopCloud(production).projectId, production.VITE_FIREBASE_PROJECT_ID)
  assert.equal(validateDesktopCloud({ ...production, GITHUB_REF: 'refs/heads/codex/v3.0-release' }).projectId, production.VITE_FIREBASE_PROJECT_ID)
  for (const replacement of [
    { GITHUB_REF: configured.GITHUB_REF }, { GITHUB_REF: 'refs/pull/4/merge' },
    { GITHUB_REF: 'refs/heads/feature/v3-desktop' }, { GITHUB_REF_PROTECTED: 'false' },
    { GITHUB_REF_PROTECTED: undefined },
    { VITE_FIREBASE_PROJECT_ID: configured.VITE_FIREBASE_PROJECT_ID },
    { VITE_FIREBASE_AUTH_DOMAIN: configured.VITE_FIREBASE_AUTH_DOMAIN },
    { VITE_FIREBASE_STORAGE_BUCKET: configured.VITE_FIREBASE_STORAGE_BUCKET },
    { VITE_FIREBASE_MESSAGING_SENDER_ID: configured.VITE_FIREBASE_MESSAGING_SENDER_ID },
    { VITE_FIREBASE_APP_ID: configured.VITE_FIREBASE_APP_ID },
    { FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: configured.FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID },
    { FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_SECRET: '' },
  ]) assert.throws(() => validateDesktopCloud({ ...production, ...replacement }))
})

test('installer verification rejects cross-environment, source and credential contamination', () => {
  const commit = 'a'.repeat(40)
  for (const config of [{}, configured, production]) {
    const env = { ...config, GITHUB_SHA: commit }
    const metadata = { ...validateDesktopCloud(config), commit }
    verifyDesktopMetadata(metadata, env)
    verifyDesktopMetadata(metadata, { ...env, GITHUB_SHA: 'b'.repeat(40), FOCUS_FLOW_ARTIFACT_SHA: commit })
    for (const replacement of [
      { commit: 'b'.repeat(40) }, { projectId: 'other-project' },
      { mode: 'unknown' }, { clientId: 'another-client' },
      { secret: 'must-never-ship' },
    ]) assert.throws(() => verifyDesktopMetadata({ ...metadata, ...replacement }, env))
    assert.throws(() => verifyDesktopMetadata(metadata, { ...env, GITHUB_SHA: undefined }))
    assert.throws(() => verifyDesktopMetadata(metadata, { ...env, FOCUS_FLOW_CLOUD_MODE: 'unknown' }))
  }
})
