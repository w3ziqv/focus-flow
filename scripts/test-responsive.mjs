import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Chromium cannot supply iOS safe-area env() values. Inject the four shared
// variables to verify layout geometry; physical Safari acceptance stays manual.
const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1451'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1451', '--strictPort'], { stdio: 'pipe' })
const output = 'test-artifacts/v3.1/responsive'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const results = []
try {
  for (let attempt=0; attempt<100; attempt++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (attempt===99) throw Error('Responsive test server did not start')
    await delay(100)
  }
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    localStorage.setItem('ff2_onboardingDone', 'true')
    Object.defineProperty(navigator, 'standalone', { value: true })
    const matchMedia = window.matchMedia.bind(window)
    window.matchMedia = query => {
      const media = matchMedia(query)
      if (query === '(display-mode: standalone)') Object.defineProperty(media, 'matches', { value: true })
      return media
    }
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  for (const lang of ['en', 'pl', 'es', 'zh']) {
    const source = await readFile(`src/lib/locales/${lang}.ts`, 'utf8')
    const t = JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1))
    await page.goto(url)
    await page.evaluate(lang => localStorage.setItem('ff2_lang', JSON.stringify(lang)), lang)
    await page.reload()
    for (const [width, height, top, right, bottom, left] of [[320,740,0,0,0,0], [393,852,59,0,34,0], [852,393,0,59,21,59], [1440,1000,0,0,0,0]]) {
      console.log(`Checking ${lang} ${width}x${height}`)
      await page.setViewportSize({ width, height })
      await page.evaluate(([top,right,bottom,left]) => {
        for (const [side,value] of Object.entries({top,right,bottom,left})) document.documentElement.style.setProperty(`--safe-${side}`, `${value}px`)
      }, [top,right,bottom,left])
      await page.getByRole('button', { name: t['nav.timer'], exact: true }).click()
      await page.getByRole('button', { name: t['timer.start'], exact: true }).waitFor()
      await page.evaluate(() => window.scrollTo(0,0))
      assert.ok((await page.locator('.app-brand').boundingBox()).y >= top, 'Brand under status bar')
      const overflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${lang} ${width}: horizontal overflow`)
      await overflow()
      await page.getByRole('button', { name: t['sound.settings'], exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      const bounds = await dialog.boundingBox()
      assert.ok(bounds.y >= top && bounds.y+bounds.height <= height-bottom+1, 'Dialog outside safe area')
      await overflow()
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: t['nav.tips'], exact: true }).click()
      // If returning to an existing article, first return to the index.
      while (await page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) }).isVisible()) {
        await page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) }).click()
      }
      await page.locator('main > div:not([hidden]) button.group').first().click()
      await page.locator('main > div:not([hidden]) button.group').first().click()
      await page.locator('article h1').waitFor()
      await page.evaluate(() => window.scrollTo(0, 500))
      const close = page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) })
      const closeBounds = await close.boundingBox()
      assert.ok(closeBounds.y >= top && closeBounds.y+closeBounds.height < height-bottom, 'Guide return is unreachable')
      await overflow()
      await page.getByRole('button', { name: t['nav.timer'], exact: true }).click()
      await page.getByRole('button', { name: t['nav.tips'], exact: true }).click()
      await page.locator('article h1').waitFor() // reading route survives navigation
      await page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) }).click()
      await page.getByRole('button', { name: t['nav.timer'], exact: true }).click()
      if (width === 393) {
        await page.evaluate(() => window.scrollTo(0,0))
        await page.screenshot({ path: `${output}/${lang}-pwa.png`, fullPage: true })
      }
      results.push({lang,width,height,insets:{top,right,bottom,left},passed:true})
    }
  }
  await page.evaluate(() => localStorage.setItem('ff2_lang', JSON.stringify('en')))
  await page.reload()
  await page.setViewportSize({width:393,height:852})
  await page.getByRole('textbox', {name:'What are you working on?'}).fill('Keep my session')
  await page.getByRole('button', {name:'Add micro-step',exact:true}).click()
  await page.getByPlaceholder('Next small step...').fill('Unfinished draft')
  await page.getByRole('button', {name:'Statistics',exact:true}).click()
  await page.getByRole('button', {name:'Timer',exact:true}).click()
  assert.ok(await page.getByRole('checkbox',{name:'Unfinished draft',exact:true}).isVisible()) // existing blur behavior commits the draft
  await page.keyboard.press('Escape')
  await page.getByRole('button', {name:'Start',exact:true}).click()
  await page.getByRole('button', {name:'Pause',exact:true}).waitFor()
  for(const theme of ['light','dark','obsidian','sage','eink']) {
    await page.evaluate(theme => {localStorage.setItem('ff2_theme',JSON.stringify(theme));localStorage.setItem('ff2_lang',JSON.stringify(theme==='sage'?'pl':'en'))},theme)
    await page.reload()
    await page.getByRole('button',{name:/^(Pause|Pauza)$/,exact:true}).waitFor()
    assert.ok(await page.getByText('Keep my session',{exact:true}).isVisible())
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  }
  await page.getByRole('button',{name:'Pause',exact:true}).click()
  await page.getByRole('button',{name:'Export backup',exact:true}).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button',{name:'Full JSON Backup',exact:true}).click()
  const download=await downloadPromise
  assert.equal(await download.failure(),null)
  const backup=JSON.parse(await readFile(await download.path(),'utf8'))
  assert.ok(backup.data, 'Backup missing application data')
  assert.deepEqual(errors,[])
  console.log(`PASS: ${results.length} language/viewport cases, injected PWA safe areas, sticky guide return, route/draft/deadline retention, five themes and JSON download`)
  await writeFile(`${output}/results.json`,JSON.stringify({results,errors,physicalDevice:false},null,2))
} finally { await browser.close(); server?.kill() }
