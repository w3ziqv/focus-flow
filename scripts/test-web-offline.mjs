import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
const url = process.env.FOCUS_FLOW_WEB_URL ?? 'http://127.0.0.1:4173'
const server = process.env.FOCUS_FLOW_WEB_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'pipe' })
let browser
try {
  for (let i=0; i<100; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (i === 99) throw Error('Preview did not start')
    await delay(100)
  }
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : []})
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors=[]
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  await page.getByRole('button',{name:'Close',exact:true}).click()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await page.reload()
  const recordings = await page.evaluate(async () => {
    const ctx = new AudioContext()
    try {
      const results = []
      for (const sound of ['rain', 'waves']) {
        const response = await fetch(`/sounds/moodist/${sound}.mp3`)
        if (!response.ok) throw Error(`Missing offline recording: ${sound}`)
        const decoded = await ctx.decodeAudioData(await response.arrayBuffer())
        results.push({ sound, duration: decoded.duration, channels: decoded.numberOfChannels })
      }
      const notice = await fetch('/sounds/moodist/NOTICE.txt')
      if (!notice.ok || !(await notice.text()).includes('Pixabay')) throw Error('Missing offline attribution')
      return results
    } finally { await ctx.close() }
  })
  for (const recording of recordings) {
    assert.ok(Math.abs(recording.duration - 58) < 0.1, `${recording.sound} must decode completely offline`)
    assert.equal(recording.channels, 2)
  }
  await page.getByRole('button',{name:'Start',exact:true}).waitFor()
  await page.getByRole('button',{name:'Statistics',exact:true}).click()
  await page.getByRole('button',{name:'Guides',exact:true}).click()
  await page.getByRole('button',{name:'App',exact:true}).click()
  assert.deepEqual(errors,[])
  console.log('PASS: production PWA reload, timer/navigation/settings, rain/wave decoding and attribution offline, no page errors')
} finally { await browser?.close(); server?.kill() }
