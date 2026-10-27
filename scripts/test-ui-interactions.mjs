import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1442'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1442', '--strictPort'], { stdio: 'pipe' })
let browser
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (i === 99) throw Error('UI server did not start')
    await delay(100)
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => { localStorage.setItem('ff2_onboardingDone', 'true'); localStorage.setItem('ff2_lang', 'en') })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  const phase = await page.evaluate(() => JSON.parse(localStorage.getItem('ff2_session')))
  await page.getByRole('button', { name: 'App', exact: true }).click()
  const childTrigger = page.getByRole('button', { name: /^Keyboard Shortcuts/ })
  await childTrigger.click()
  const child = page.getByRole('dialog', { name: 'Keyboard Shortcuts', exact: true })
  await child.waitFor()
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    assert.equal(await child.evaluate(dialog => dialog.contains(document.activeElement)), true)
  }
  await page.keyboard.press('Escape')
  await child.waitFor({ state: 'hidden' })
  assert.equal(await childTrigger.evaluate(button => button === document.activeElement), true)
  await page.getByRole('dialog', { name: 'App settings', exact: true }).getByRole('button', { name: /^Cloud Synchronization/ }).click()
  await page.getByRole('dialog', { name: 'Cloud Synchronization', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await childTrigger.waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Timer settings', exact: true }).click()
  const focusMinutes = page.getByRole('spinbutton').first()
  await focusMinutes.fill('37')
  await page.setViewportSize({ width: 320, height: 640 })
  assert.equal(await focusMinutes.inputValue(), '37')
  await page.screenshot({ path: '/tmp/focus-flow-ui-draft-mobile.png', fullPage: true })
  await page.keyboard.press('Escape')
  const retained = await page.evaluate(() => JSON.parse(localStorage.getItem('ff2_session')))
  assert.equal(retained.id, phase.id)
  assert.equal(retained.endTs, phase.endTs)
  assert.equal(retained.running, true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Sound settings', exact: true }).click()
  await page.getByRole('button', { name: 'Brown noise', exact: true }).click()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button', { name: 'Sound settings', exact: true }).locator('[aria-hidden="true"]').count() >= 2, true)
  await page.getByRole('button', { name: 'App', exact: true }).click()
  await page.getByRole('button', { name: /^Language/ }).click()
  await page.getByRole('button', { name: 'Polish', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Statystyki', exact: true }).waitFor()
  // An independent sync-state event must still update the memoized indicator.
  await page.evaluate(async () => {
    const { saveCloudSyncState } = await import('/src/lib/storage.ts')
    saveCloudSyncState({ status: 'synced', uid: 'TEST-ui-only', displayName: 'TEST', email: null, photoURL: null, lastSyncedAt: null, error: null })
  })
  await page.getByRole('button', { name: /Synchronizacja w chmurze: Zsynchronizowano/ }).waitFor()
  await context.setOffline(true)
  await page.getByRole('button', { name: /Synchronizacja w chmurze: Offline/ }).waitFor()
  await context.setOffline(false)
  // The real adapter owns Auth. Reconnect replaces this synthetic cache with
  // disconnected state; a cached UID must never establish authentication.
  await page.getByRole('button', { name: /Synchronizacja w chmurze: Tylko lokalnie/ }).waitFor()
  assert.deepEqual(errors, [])
  await mkdir('test-artifacts/ui-architecture/after', { recursive: true })
  await page.screenshot({ path: 'test-artifacts/ui-architecture/after/interactions-pl.png', fullPage: true })
  console.log('PASS: nested lazy dialogs, top Escape/Tab/focus restore, resize preserves draft and phase, audio/language/sync/offline/reconnect propagate through memo')
} finally { await browser?.close(); server?.kill() }
