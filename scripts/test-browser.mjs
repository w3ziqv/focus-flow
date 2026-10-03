import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1420'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1420', '--strictPort'], { stdio: 'pipe' })
let browser
let page
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (i === 99) throw Error('Test server did not start')
    await delay(100)
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
  const context = await browser.newContext()
  page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  const task = page.getByRole('textbox', { name: 'What are you working on?' })
  await task.fill('Linux browser verification')
  await task.blur()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
  await delay(1200)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.reload()
  await assert.equal(await task.inputValue(), 'Linux browser verification')
  await page.getByRole('button', { name: 'Statistics', exact: true }).click()
  await page.getByRole('button', { name: 'Guides', exact: true }).click()
  await page.getByRole('button', { name: 'Timer', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile viewport overflows')
  assert.deepEqual(errors, [])
  console.log('PASS: browser start/pause, persisted task, navigation, mobile width, no page errors')
  await context.close()

  const contexts = await Promise.all([browser.newContext(), browser.newContext()])
  const pages = await Promise.all(contexts.map(context => context.newPage()))
  for (let index = 0; index < pages.length; index++) {
    await pages[index].goto(url)
    await pages[index].evaluate(async index => {
      localStorage.clear()
      const storage = await import('/src/lib/storage.ts')
      storage.addSession({ id: `peer-session-${index}`, date: new Date().toISOString(), minutes: 25, task: `Task ${index}` })
      const { LocalPeer } = await import('/src/lib/desktop/peer.ts')
      window.testPeer = new LocalPeer(() => {})
    }, index)
  }
  const [a, b] = pages
  const offer = await a.evaluate(() => window.testPeer.offer())
  const answer = await b.evaluate(offer => window.testPeer.accept(offer), offer)
  await a.evaluate(answer => window.testPeer.accept(answer), answer)
  for (const page of pages) await page.waitForFunction(() => JSON.parse(localStorage.getItem('ff2_sessions') ?? '[]').length === 2, null, { timeout: 15000 })
  const documents = await Promise.all(pages.map(page => page.evaluate(() => localStorage.getItem('ff3_replica'))))
  assert.equal(documents[0], documents[1], 'Peer documents diverged')
  // Offline concurrent edits and a deletion must converge after re-pairing.
  await a.evaluate(async () => { window.testPeer.disconnect(); const s = await import('/src/lib/storage.ts'); s.deleteSession('peer-session-0') })
  await b.evaluate(async () => { window.testPeer.disconnect(); const s = await import('/src/lib/storage.ts'); s.updateSessionTask('peer-session-0', 'Offline edit'); s.updateSessionTask('peer-session-1', null) })
  const offer2 = await a.evaluate(() => window.testPeer.offer())
  const answer2 = await b.evaluate(code => window.testPeer.accept(code), offer2)
  await a.evaluate(code => window.testPeer.accept(code), answer2)
  for (const page of pages) await page.waitForFunction(() => { const rows = JSON.parse(localStorage.getItem('ff2_sessions') ?? '[]'); return rows.length === 1 && rows[0].id === 'peer-session-1' && rows[0].task === null }, null, { timeout: 15000 })
  const final = await Promise.all(pages.map(page => page.evaluate(() => localStorage.getItem('ff3_replica'))))
  assert.equal(final[0], final[1])
  console.log('PASS: real WebRTC pairing, bidirectional transfer, offline edit/delete conflict, null task, CRDT convergence')
} catch (error) {
  console.error(await page?.locator('body').innerText().catch(() => 'Page unavailable'))
  await page?.screenshot({path:join(tmpdir(),'focus-flow-browser-failure.png')}).catch(() => {})
  throw error
} finally {
  await browser?.close()
  server?.kill()
}
