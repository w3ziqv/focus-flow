import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateDesktopCloud } from './desktop-cloud-config.mjs'

const configured = {
  FOCUS_FLOW_CLOUD_MODE: 'test', GITHUB_REF: 'refs/heads/test/v3.0-cloud',
  VITE_FIREBASE_API_KEY: 'synthetic-public-key',
  VITE_FIREBASE_PROJECT_ID: 'focus-flow-v3-test-20261010',
  VITE_FIREBASE_AUTH_DOMAIN: 'focus-flow-v3-test-20261010.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: 'focus-flow-v3-test-20261010.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '711549076713',
  VITE_FIREBASE_APP_ID: '1:711549076713:web:synthetic',
  FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: '711549076713-synthetic.apps.googleusercontent.com',
}
test('offline builds reject accidentally inherited cloud variables', () => {
  assert.equal(validateDesktopCloud({}).projectId, null)
  assert.throws(() => validateDesktopCloud({ VITE_FIREBASE_API_KEY: 'accidental' }))
})
test('test cloud requires the test branch and one coherent Firebase project', () => {
  assert.equal(validateDesktopCloud(configured).projectId, configured.VITE_FIREBASE_PROJECT_ID)
  for (const replacement of [
    { GITHUB_REF: 'refs/heads/main' }, { VITE_FIREBASE_PROJECT_ID: 'production' },
    { VITE_FIREBASE_MESSAGING_SENDER_ID: 'different' },
    { VITE_FIREBASE_APP_ID: '1:123:web:different' },
    { FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID: '123-other.apps.googleusercontent.com' },
    { VITE_FIREBASE_API_KEY: '' }, { FOCUS_FLOW_CLOUD_MODE: 'production' },
  ]) assert.throws(() => validateDesktopCloud({ ...configured, ...replacement }))
})
