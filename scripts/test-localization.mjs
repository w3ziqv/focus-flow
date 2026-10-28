import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync, spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import ts from 'typescript'
import { chromium } from 'playwright-core'
import axe from 'axe-core'

// Read the authored data with the TypeScript parser, without evaluating application modules.
async function readConstant(file, name) {
  const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true)
  let initializer
  function walk(node) { if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) initializer = node.initializer; ts.forEachChild(node, walk) }
  walk(source)
  function value(node) {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return value(node.expression)
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(value)
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(prop => [prop.name.text, value(prop.initializer)]))
    if (ts.isIdentifier(node)) return node.text
    throw Error(`Unsupported content expression in ${file}`)
  }
  assert.ok(initializer, `${name} missing from ${file}`)
  return value(initializer)
}
const langs = ['en', 'pl', 'es', 'zh']
const names = { en: 'English', pl: 'Polski', es: 'Español', zh: '简体中文' }
const htmlLang = { en: 'en', pl: 'pl', es: 'es', zh: 'zh-Hans' }
const dictionaries = Object.fromEntries(await Promise.all(langs.map(async lang => [lang, await readConstant(`src/lib/locales/${lang}.ts`, lang)])))
const guides = Object.fromEntries(await Promise.all(langs.map(async lang => [lang, await readConstant(`src/lib/guides/${lang}.ts`, lang)])))
const topics = await readConstant('src/lib/topics.ts', 'TOPICS')
const catalog = await readConstant('src/lib/guides/catalog.ts', 'catalog')
const sources = JSON.parse(await readFile('src/lib/guides/sources.json', 'utf8'))
const output = process.env.FOCUS_FLOW_LOCALE_OUTPUT ?? 'test-artifacts/localization'
const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1448'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1448', '--strictPort'], { stdio: 'pipe' })
let browser
let page
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0
const report = { gitHead, dirty, checkedAt: new Date().toISOString(), languages: [], guideViews: 0, accessibility: [], errors: [], physicalDevices: false }
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
try {
  await mkdir(output, { recursive: true })
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (attempt === 99) throw Error('Localization server did not start')
    await delay(100)
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
  const context = await browser.newContext({ locale: 'en-GB', viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    if (localStorage.getItem('TEST_localization_initialized')) return
    localStorage.setItem('TEST_localization_initialized', 'true')
    localStorage.setItem('ff2_lang', JSON.stringify('en'))
    localStorage.setItem('ff2_onboardingDone', 'true')
    const now = new Date(), monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    localStorage.setItem('ff2_stats', JSON.stringify({ today: 1, week: 1, streak: 1, minutes: 25, date: now.toDateString(), lastDate: now.toDateString(), weekStart: monday.toDateString(), history: { [now.toDateString()]: 25 } }))
    localStorage.setItem('ff2_sessions', JSON.stringify([{ id: 'TEST-locale-session', date: new Date().toISOString(), minutes: 25, task: '中文 prueba 👨‍👩‍👧‍👦' }]))
  })
  page = await context.newPage()
  page.setDefaultTimeout(15_000)
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(url)
  await page.getByRole('button', { name: dictionaries.en['timer.start'], exact: true }).click()
  const original = await page.evaluate(() => ({ phase: JSON.parse(localStorage.getItem('ff2_session')), sessions: localStorage.getItem('ff2_sessions') }))
  let previous = 'en'
  async function noOverflow(label) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label)
    assert.equal(await page.getByText(/\{(?:articles|count|minutes|task|n)\}/).count(), 0, `Unfilled template: ${label}`)
  }
  async function audit(label) {
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})))
    })
    await page.evaluate(axe.source)
    const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
    report.accessibility.push({ label, violations: result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })) })
  }
  for (const lang of langs) {
    const old = dictionaries[previous], d = dictionaries[lang]
    await page.getByRole('button', { name: old['settings.app'], exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`^${escape(old['settings.language'])}`) }).click()
    for (const name of Object.values(names)) await page.getByRole('button', { name, exact: true }).waitFor()
    await page.getByRole('button', { name: names[lang], exact: true }).click()
    assert.equal(await page.locator('html').getAttribute('lang'), htmlLang[lang])
    if (await page.locator('link[rel="manifest"]').count()) {
      const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json())
      assert.equal(manifest.lang, htmlLang[lang])
      assert.equal(manifest.id, '/')
    }
    assert.equal(await page.getByRole('button', { name: names[lang], exact: true }).getAttribute('aria-pressed'), 'true')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: d['timer.pause'], exact: true }).waitFor()
    const current = await page.evaluate(() => ({ phase: JSON.parse(localStorage.getItem('ff2_session')), sessions: localStorage.getItem('ff2_sessions') }))
    assert.equal(current.phase.id, original.phase.id)
    assert.equal(current.phase.endTs, original.phase.endTs)
    assert.equal(current.phase.running, true)
    assert.equal(current.sessions, original.sessions)
    await audit(`${lang}:timer`)
    await page.screenshot({ path: `${output}/${lang}-timer.png`, fullPage: true })
    for (const width of [320, 390, 1440]) { await page.setViewportSize({ width, height: 900 }); await noOverflow(`${lang}:timer:${width}`) }
    await page.getByRole('button', { name: d['sound.settings'], exact: true }).click()
    await page.getByRole('button', { name: d['binaural.alpha'], exact: true }).waitFor()
    await page.getByRole('button', { name: d['sound.brown'], exact: true }).waitFor()
    await audit(`${lang}:audio`)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: d['settings.app'], exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`^${escape(d['data.title'])}`) }).click()
    await page.getByText(d['data.description'], { exact: true }).waitFor()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: d['exportMarkdown'], exact: true }).click()])
    const markdown = await readFile(await download.path(), 'utf8')
    assert.ok(markdown.includes(d['export.md.title']), `${lang}: Markdown title`)
    assert.ok(markdown.includes('中文 prueba 👨‍👩‍👧‍👦'), `${lang}: task preservation`)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: d['stats.view'], exact: true }).click()
    await page.getByText('中文 prueba 👨‍👩‍👧‍👦', { exact: true }).first().waitFor()
    await noOverflow(`${lang}:stats`)
    await audit(`${lang}:stats`)
    await page.setViewportSize({ width: 320, height: 740 })
    await noOverflow(`${lang}:stats:320`)
    const cardTrigger = page.getByRole('button', { name: d['stats.exportCard'], exact: true })
    await cardTrigger.click()
    const cardDialog = page.getByRole('dialog', { name: d['stats.exportCardTitle'], exact: true })
    await cardDialog.waitFor()
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab')
      assert.equal(await cardDialog.evaluate(dialog => dialog.contains(document.activeElement)), true)
    }
    await noOverflow(`${lang}:card:320`)
    await audit(`${lang}:card`)
    const [png] = await Promise.all([page.waitForEvent('download'), cardDialog.getByRole('button', { name: d['stats.exportCardDownload'], exact: true }).click()])
    await png.saveAs(`${output}/${lang}-weekly.png`)
    await page.keyboard.press('Escape')
    await cardDialog.waitFor({ state: 'hidden' })
    assert.equal(await cardTrigger.evaluate(button => button === document.activeElement), true)
    await page.getByRole('button', { name: d['nav.tips'], exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    for (const topic of topics) {
      await page.getByRole('main').getByRole('button', { name: new RegExp(escape(topic.copy[lang].title)) }).click()
      await page.getByRole('heading', { level: 1, name: topic.copy[lang].title, exact: true }).waitFor()
      await noOverflow(`${lang}:${topic.id}:index`)
      const articles = Object.entries(catalog).filter(([, meta]) => meta.topicId === topic.id)
      for (const [id, meta] of articles) {
        const copy = guides[lang][id]
        await page.getByRole('button', { name: new RegExp(`^${escape(copy.title)}`) }).click()
        await page.getByRole('heading', { level: 1, name: copy.title, exact: true }).waitFor()
        assert.equal(await page.locator('article ol li').count(), copy.steps.length)
        assert.deepEqual(await page.locator('article ol li').allTextContents(), copy.steps)
        await page.getByText(copy.evidence, { exact: true }).waitFor()
        for (const source of meta.sources) assert.equal(await page.getByRole('link', { name: sources[source].label, exact: true }).getAttribute('href'), sources[source].url)
        for (const width of [320, 390]) { await page.setViewportSize({ width, height: 844 }); await noOverflow(`${lang}:${id}:${width}`) }
        if (id === 'learning-recall') {
          await audit(`${lang}:guide`)
          await page.screenshot({ path: `${output}/${lang}-guide.png`, fullPage: true })
        }
        report.guideViews++
        await page.getByRole('button', { name: d['topic.backToTopic'], exact: true }).click()
      }
      await page.getByRole('button', { name: d['topic.back'], exact: true }).click()
    }
    await page.getByRole('button', { name: d['nav.timer'], exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: d['timer.pause'], exact: true }).waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), htmlLang[lang])
    report.languages.push({ lang, timerPreserved: true, historyPreserved: true, reload: true, guideCount: 27, markdown: true })
    console.log(`PASS: ${lang} controls, export, guides and persistence`)
    previous = lang
  }
  if (await page.evaluate(() => 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller))) {
    await context.setOffline(true)
    await page.reload()
    await page.getByRole('button', { name: dictionaries.zh['timer.pause'], exact: true }).waitFor()
    for (const lang of langs) {
      const manifest = await page.evaluate(async code => (await fetch(`/manifest-${code}.webmanifest`)).json(), lang)
      assert.equal(manifest.lang, htmlLang[lang])
    }
    await page.getByRole('button', { name: dictionaries.zh['nav.tips'], exact: true }).click()
    await page.getByRole('main').getByRole('button', { name: /学习/ }).waitFor()
    report.localizedOffline = true
    await context.setOffline(false)
  }
  assert.equal(report.guideViews, 108)
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.accessibility.flatMap(r => r.violations), [])
  report.passed = true
  console.log('PASS: four languages, 108 guide views, source links, 320/390/1440 layouts, active timer and history persistence, Markdown export, reload and 20 axe states')
} catch (failure) {
  report.failure = String(failure)
  await page?.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  throw failure
} finally {
  await writeFile(`${output}/verification.json`, JSON.stringify(report, null, 2))
  await browser?.close()
  server?.kill('SIGTERM')
}
