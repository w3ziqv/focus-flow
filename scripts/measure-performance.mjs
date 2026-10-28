import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const url = process.env.FOCUS_FLOW_MEASURE_URL ?? 'http://127.0.0.1:4173'
const directory = process.env.FOCUS_FLOW_MEASURE_OUTPUT ?? 'test-artifacts/modernization/performance'
const sampleMs = 5000
const repetitions = Number(process.env.FOCUS_FLOW_MEASURE_REPETITIONS ?? 3)
assert.ok(Number.isSafeInteger(repetitions) && repetitions >= 1 && repetitions <= 10, 'Repetitions must be an integer from 1 to 10')
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const system = await browser.newBrowserCDPSession()
const runs = []
try {
  for (const throttle of [1, 4]) for (let run = 0; run < repetitions; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
    await context.addInitScript(() => {
      localStorage.setItem('ff2_onboardingDone', 'true')
      window.__counts = { reads: 0, writes: 0, commits: 0 }
      for (const [name, counter] of [['getItem', 'reads'], ['setItem', 'writes']]) {
        const original = Storage.prototype[name]
        Storage.prototype[name] = function (...args) { window.__counts[counter]++; return original.apply(this, args) }
      }
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => window.__counts.commits++, onCommitFiberUnmount: () => {}, checkDCE: () => {} }
      new PerformanceObserver(list => { window.__lcp = list.getEntries().at(-1)?.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
    await cdp.send('Performance.enable')
    await page.goto(url)
    await page.getByRole('button', { name: 'Start', exact: true }).waitFor()
    await page.waitForTimeout(900)
    const startup = await page.evaluate(() => ({ lcpMs: window.__lcp, jsBytes: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')).reduce((n, r) => n + r.decodedBodySize, 0) }))
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    for (const sound of ['off', 'brown', 'rain']) {
      if (sound !== 'off') {
        await page.getByRole('button', { name: 'Sound settings', exact: true }).click()
        await page.getByRole('dialog').getByRole('button', { name: sound === 'brown' ? 'Brown noise' : 'Soft rain', exact: true }).click()
        await page.keyboard.press('Escape')
        await page.getByRole('dialog').waitFor({ state: 'hidden' })
      }
      await page.waitForTimeout(900)
      const before = (await cdp.send('Performance.getMetrics')).metrics
      const processesBefore = (await system.send('SystemInfo.getProcessInfo')).processInfo
      const counts = await page.evaluate(() => ({ ...window.__counts }))
      await page.waitForTimeout(sampleMs)
      const after = (await cdp.send('Performance.getMetrics')).metrics
      const processesAfter = (await system.send('SystemInfo.getProcessInfo')).processInfo
      const final = await page.evaluate(() => ({ ...window.__counts }))
      const metric = (values, name) => values.find(m => m.name === name)?.value ?? 0
      await cdp.send('HeapProfiler.collectGarbage')
      const heap = await cdp.send('Runtime.getHeapUsage')
      const pss = process.platform === 'linux' ? await Promise.all(processesAfter.map(async item => {
        try { return Number(/\nPss:\s+(\d+)/.exec(await readFile(`/proc/${item.id}/smaps_rollup`, 'utf8'))?.[1] ?? 0) } catch { return 0 }
      })) : null
      runs.push({ throttle, run, sound, ...startup, mainThreadMs: (metric(after, 'TaskDuration') - metric(before, 'TaskDuration')) * 1000, browserCpuMs: processesAfter.reduce((sum, item) => sum + Math.max(0, item.cpuTime - (processesBefore.find(previous => previous.id === item.id)?.cpuTime ?? item.cpuTime)), 0) * 1000, scriptMs: (metric(after, 'ScriptDuration') - metric(before, 'ScriptDuration')) * 1000, reads: final.reads - counts.reads, writes: final.writes - counts.writes, reactCommits: final.commits - counts.commits, retainedJsHeapBytes: heap.usedSize, browserPssKiB: pss ? pss.reduce((a, b) => a + b, 0) : null })
    }
    await context.close()
    console.log(`Measured CPU ${throttle}x, sample ${run + 1}/${repetitions}`)
  }
  assert.ok(runs.every(run => run.reactCommits > 0), 'React commit instrumentation did not observe the timer')
} finally {
  await writeFile(join(directory, 'performance.json'), JSON.stringify({ url, node: process.version, chromium: browser.version(), viewport: '390x844', serviceWorkers: 'blocked', network: 'unthrottled localhost', sampleMs, cpu: 'Main-thread TaskDuration plus CDP process-tree CPU time, including audio processes', heap: 'V8 retained heap after forced GC; excludes native audio buffers. Linux PSS sums the measured browser process tree after GC.', runs }, null, 2))
  await browser.close()
}
