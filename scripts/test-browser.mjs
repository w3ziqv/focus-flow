import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import axe from 'axe-core'
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
  const focusTrigger = page.getByRole('button', { name: 'Focus mode', exact: true })
  await focusTrigger.click()
  const focusDialog = page.getByRole('dialog', { name: 'Focus mode', exact: true })
  await focusDialog.waitFor()
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab')
    assert.equal(await focusDialog.evaluate(dialog => dialog.contains(document.activeElement)), true, 'Focus escaped focus mode')
  }
  await page.keyboard.press('Escape')
  await focusDialog.waitFor({ state: 'hidden' })
  assert.equal(await focusTrigger.evaluate(button => button === document.activeElement), true)
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
  const historyContext = await browser.newContext()
  await historyContext.addInitScript(() => {
    const now = new Date()
    const week = new Date(now)
    week.setDate(week.getDate() - week.getDay() + (week.getDay() === 0 ? -6 : 1))
    localStorage.setItem('ff2_onboardingDone', 'true')
    localStorage.setItem('ff2_sessions', JSON.stringify(Array.from({length:65}, (_, i) => ({id:`TEST-page-${i}`, date:now.toISOString(), minutes:1, task:`TEST history ${i}`}))))
    localStorage.setItem('ff2_stats', JSON.stringify({today:65,week:65,minutes:65,streak:1,date:now.toDateString(),weekStart:week.toDateString(),lastDate:now.toDateString(),history:{[now.toDateString()]:65}}))
  })
  page = await historyContext.newPage()
  await page.goto(url)
  await page.getByRole('button', {name:'Statistics',exact:true}).click()
  const edits = page.getByRole('button', {name:'Edit task name',exact:true})
  await edits.nth(49).waitFor({state:'attached'})
  assert.equal(await edits.count(), 50)
  await page.getByRole('button', {name:'Show more sessions',exact:true}).click()
  await edits.nth(64).waitFor({state:'attached'})
  assert.equal(await edits.count(), 65)
  const search = page.getByRole('searchbox')
  await search.fill('TEST history 64')
  await page.getByText('TEST history 64', {exact:true}).waitFor()
  assert.equal(await edits.count(), 1)
  await search.fill('')
  await edits.nth(49).waitFor({state:'attached'})
  assert.equal(await edits.count(), 50)
  await page.setViewportSize({width:390,height:844})
  await edits.first().click()
  const editTask = page.getByRole('textbox', {name:'Edit task name',exact:true})
  await editTask.fill('TEST mobile history edit')
  const screenshotDirectory = 'test-artifacts/modernization/history-mobile'
  await mkdir(screenshotDirectory, {recursive:true})
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:844})
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `History edit overflows at ${width}px`)
    assert.ok((await editTask.boundingBox()).width >= 128, `History edit input is too narrow at ${width}px`)
    await page.screenshot({path:join(screenshotDirectory,`editing-${width}.png`),fullPage:true})
    await page.screenshot({path:join(screenshotDirectory,`editing-${width}-viewport.png`)})
    await page.evaluate(axe.source)
    const accessibility = await page.evaluate(async () => window.axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}))
    assert.deepEqual(accessibility.violations.map(item => item.id), [], `History edit accessibility violations at ${width}px`)
  }
  await editTask.press('Enter')
  await page.getByRole('list').getByText('TEST mobile history edit', {exact:true}).waitFor()
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ff2_sessions')).length), 65)
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ff2_sessions'))[0].task), 'TEST mobile history edit')
  await edits.first().click()
  await editTask.fill('TEST discard this edit')
  await page.getByRole('button', {name:'Cancel (Esc)',exact:true}).click()
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ff2_sessions'))[0].task), 'TEST mobile history edit', 'Cancel saved the discarded text')
  await historyContext.close()
  console.log('PASS: history pagination, full-set search, filter reset, mobile edit/cancel at 390/320px and retained 65 stored sessions')
} catch (error) {
  console.error(await page?.locator('body').innerText().catch(() => 'Page unavailable'))
  await page?.screenshot({path:join(tmpdir(),'focus-flow-browser-failure.png')}).catch(() => {})
  throw error
} finally {
  await browser?.close()
  server?.kill()
}
