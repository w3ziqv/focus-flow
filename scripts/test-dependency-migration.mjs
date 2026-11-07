import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright-core'
import { readConstant } from './read-typescript-constant.mjs'

assert.ok(process.env.FOCUS_FLOW_REFERENCE_DIST, 'Build v3.1.2 separately and set FOCUS_FLOW_REFERENCE_DIST')
const reference = resolve(process.env.FOCUS_FLOW_REFERENCE_DIST)
const candidate = resolve('dist')
const output = process.env.FOCUS_FLOW_MIGRATION_OUTPUT ?? 'test-artifacts/toolchain-migration/pwa'
await mkdir(output, { recursive: true })
const fingerprint = async root => createHash('sha256').update(await readFile(resolve(root, 'sw.js'))).digest('hex')
const entry = async root => /<script[^>]+src="([^"]+\/assets\/[^\"]+\.js|\/assets\/[^\"]+\.js)"/.exec(await readFile(resolve(root, 'index.html'), 'utf8'))?.[1]
const referenceHash = await fingerprint(reference), candidateHash = await fingerprint(candidate)
assert.notEqual(referenceHash, candidateHash, 'Reference and candidate service workers must identify different assets')
const candidateEntry = await entry(candidate)
assert.ok(candidateEntry, 'Candidate entry bundle is missing')
let root = reference
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' }
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
  try {
    const data = await readFile(path)
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'text/plain', 'Content-Encoding': 'gzip', 'Cache-Control': 'no-store' })
    res.end(gzipSync(data))
  } catch { res.writeHead(404); res.end('Missing migration fixture asset') }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const report = { referenceHash, candidateHash, candidateEntry, chromium: browser.version(), errors: [], passed: false }
let page
try {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    if (localStorage.getItem('TEST_dependency_migration')) return
    localStorage.setItem('TEST_dependency_migration', 'true')
    localStorage.setItem('ff2_onboardingDone', 'true')
    localStorage.setItem('ff2_lang', JSON.stringify('en'))
    localStorage.setItem('ff2_theme', JSON.stringify('sage'))
    localStorage.setItem('ff2_settings', JSON.stringify({ focus: 35, short: 7, long: 17, rounds: 3, autoStart: false }))
    const now = new Date(), monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    localStorage.setItem('ff2_stats', JSON.stringify({ today: 1, week: 1, streak: 1, minutes: 25, date: now.toDateString(), lastDate: now.toDateString(), weekStart: monday.toDateString(), history: { [now.toDateString()]: 25 } }))
    localStorage.setItem('ff2_sessions', JSON.stringify([{ id: 'migration-history', date: new Date().toISOString(), minutes: 25, task: 'History before dependency migration' }]))
  })
  page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(url)
  await page.getByRole('textbox', { name: 'What are you working on?' }).fill('Retain this running session')
  await page.getByRole('button', { name: 'Add micro-step', exact: true }).click()
  await page.getByPlaceholder('Next small step...').fill('Retain the checklist')
  await page.getByPlaceholder('Next small step...').press('Enter')
  await page.getByRole('checkbox', { name: 'Retain the checklist', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active), null, { timeout: 30_000 })
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  // Persist a non-default locale through the same UI used by existing users.
  await page.getByRole('button', { name: 'App', exact: true }).click()
  await page.getByRole('button', { name: /^Language/ }).click()
  await page.getByRole('button', { name: 'Polski', exact: true }).click()
  await page.keyboard.press('Escape')
  const pl = await readConstant('src/lib/locales/pl.ts', 'pl')
  await page.getByRole('button', { name: pl['timer.pause'], exact: true }).waitFor()
  const state = () => page.evaluate(() => Object.fromEntries(['session', 'sessions', 'stats', 'settings', 'theme', 'lang'].map(key => [key, JSON.parse(localStorage.getItem(`ff2_${key}`))])))
  const before = await state()
  assert.ok(before.session.id && before.session.endTs && before.session.running)
  assert.equal(before.session.task, 'Retain this running session')
  assert.equal(before.session.checklist[0].text, 'Retain the checklist')
  assert.equal(before.lang, 'pl')
  report.before = before
  root = candidate
  await page.evaluate(async () => {
    const changed = new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error('Candidate service worker did not take control')), 30_000)
      navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); done() }, { once: true })
    })
    await Promise.all([(await navigator.serviceWorker.getRegistration()).update(), changed])
  })
  await page.waitForFunction(async asset => {
    for (const key of await caches.keys()) if (key.includes('precache')) {
      if ((await (await caches.open(key)).keys()).some(request => new URL(request.url).pathname === asset)) return true
    }
    return false
  }, candidateEntry, { timeout: 30_000 })
  await page.reload()
  await page.waitForFunction(asset => [...document.scripts].some(script => script.src && new URL(script.src).pathname === asset), candidateEntry)
  await page.getByRole('button', { name: pl['timer.pause'], exact: true }).waitFor()
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: pl['timer.pause'], exact: true }).waitFor()
  const after = await state()
  for (const key of ['id', 'endTs', 'task', 'checklist', 'phaseSettings']) assert.deepEqual(after.session[key], before.session[key], `Active session ${key} changed during update`)
  for (const key of ['sessions', 'stats', 'settings', 'theme', 'lang']) assert.deepEqual(after[key], before[key], `${key} changed during update`)
  report.after = after
  // Guides and statistics have not been visited on this profile: both must load lazily offline.
  await page.getByRole('button', { name: pl['nav.tips'], exact: true }).click()
  await page.locator('.guide-library h1').waitFor()
  await page.locator('.guide-feature').click()
  await page.locator('.guide-article-row').last().click()
  await page.locator('.guide-article h1').waitFor()
  await page.getByRole('button', { name: pl['stats.view'], exact: true }).click()
  await page.getByRole('listitem').getByText('History before dependency migration', { exact: true }).waitFor()
  const topics = await readConstant('src/lib/topics.ts', 'TOPICS')
  report.offlineAssets = await page.evaluate(async topics => {
    let covers = 0
    for (const { id } of topics) for (const suffix of ['', '-small']) {
      const response = await fetch(`/images/guides/${id}${suffix}.webp`)
      if (!response.ok) throw Error('Offline cover is missing')
      const bitmap = await createImageBitmap(await response.blob()); bitmap.close(); covers++
    }
    const audio = new AudioContext()
    try {
      for (const name of ['rain', 'waves']) {
        const response = await fetch(`/sounds/moodist/${name}.mp3`)
        const decoded = await audio.decodeAudioData(await response.arrayBuffer())
        if (Math.abs(decoded.duration - 58) >= 0.1 || decoded.numberOfChannels !== 2) throw Error('Offline recording did not decode')
      }
    } finally { await audio.close() }
    return { covers, recordings: 2 }
  }, topics)
  assert.equal(report.offlineAssets.covers, topics.length * 2)
  assert.deepEqual(report.errors, [])
  await page.screenshot({ path: `${output}/updated-offline-history.png`, fullPage: true })
  report.passed = true
  console.log('PASS: same-origin reference PWA update, retained active deadline/session/task/checklist/history/settings/locale, lazy offline navigation, covers and audio')
} catch (error) {
  report.failure = String(error)
  report.documentScripts = await page?.evaluate(() => [...document.scripts].map(script => script.src)).catch(() => [])
  await page?.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  throw error
} finally {
  await writeFile(`${output}/update.json`, JSON.stringify(report, null, 2))
  await browser.close()
  await new Promise(done => server.close(done))
}
