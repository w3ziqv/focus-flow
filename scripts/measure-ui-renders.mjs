import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

// Development names + React's DevTools commit hook. No product instrumentation.
// Count only fibers with PerformedWork, not ancestors merely traversed on commit.
const url = process.env.FOCUS_FLOW_MEASURE_URL ?? 'http://127.0.0.1:1431'
const server = process.env.FOCUS_FLOW_MEASURE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1431', '--strictPort'], { stdio: 'pipe' })
const output = process.env.FOCUS_FLOW_MEASURE_OUTPUT ?? 'test-artifacts/ui-architecture/after'
const sampleMs = 2000
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
await mkdir(output, { recursive: true })
const runs = []
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (i === 99) throw Error('Measurement server did not start')
    await delay(100)
  }
  for (let repetition = 0; repetition < 3; repetition++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' })
    await context.addInitScript(() => {
      localStorage.setItem('ff2_onboardingDone', 'true')
      localStorage.setItem('ff2_lang', 'en')
      window.__renders = {}
      window.__commits = 0
      let previous = new WeakSet()
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true, renderers: new Map(), inject: () => 1, onCommitFiberUnmount: () => {}, checkDCE: () => {},
        onCommitFiberRoot: (_renderer, root) => {
          window.__commits++
          const current = new WeakSet()
          const visit = fiber => {
            current.add(fiber)
            const type = fiber.type
            const name = type?.displayName ?? type?.name ?? type?.type?.name
            // A bailed-out subtree reuses the prior fiber, including its old
            // PerformedWork flag. Counting that flag alone yields false renders.
            if (!previous.has(fiber) && (fiber.flags & 1) && name) window.__renders[name] = (window.__renders[name] ?? 0) + 1
            if (fiber.child) visit(fiber.child)
            if (fiber.sibling) visit(fiber.sibling)
          }
          visit(root.current)
          previous = current
        },
      }
    })
    const page = await context.newPage()
    await page.goto(url)
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    for (const scenario of ['timer', 'settings', 'audio', 'stats', 'guides']) {
      if (scenario === 'settings') await page.getByRole('button', { name: 'App', exact: true }).click()
      if (scenario === 'audio') await page.getByRole('button', { name: 'Sound settings', exact: true }).click()
      if (scenario === 'stats') await page.getByRole('button', { name: 'Statistics', exact: true }).click()
      if (scenario === 'guides') await page.getByRole('button', { name: 'Guides', exact: true }).click()
      await page.waitForTimeout(1000)
      if (repetition === 0) await page.screenshot({ path: join(output, `${scenario}.png`), fullPage: true })
      await page.evaluate(() => { window.__renders = {}; window.__commits = 0 })
      await page.waitForTimeout(sampleMs)
      runs.push({ repetition, scenario, ...await page.evaluate(() => ({ commits: window.__commits, renders: window.__renders })) })
      if (scenario === 'settings' || scenario === 'audio') {
        await page.keyboard.press('Escape')
        await page.getByRole('dialog').waitFor({ state: 'hidden' })
      }
    }
    await context.close()
  }
  assert.ok(runs.every(run => run.renders.Shell >= 4), 'Timer/Shell render instrumentation must observe active ticks')
  await writeFile(join(output, 'renders.json'), JSON.stringify({ url, chromium: browser.version(), node: process.version, sampleMs, mode: 'development; StrictMode mount excluded; DevTools PerformedWork fibers per commit; not CPU or production timings', runs }, null, 2))
  console.log(JSON.stringify(runs))
} finally { await browser.close(); server?.kill() }
