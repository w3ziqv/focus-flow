import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'
import axe from 'axe-core'
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
import { readConstant } from './read-typescript-constant.mjs'

const topics = await readConstant('src/lib/topics.ts', 'TOPICS')
const catalog = await readConstant('src/lib/guides/catalog.ts', 'catalog')
const featuredArticles = Object.entries(catalog).filter(([, meta]) => meta.topicId === topics[0].id)

const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1456'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1456', '--strictPort'], { stdio: 'pipe' })
const output = 'test-artifacts/v3.1.2/guides-interface'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const results = []
const audits = []
const errors = []
let currentCase
let page
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (attempt === 99) throw Error('Guide interface test server did not start')
    await delay(100)
  }
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  await context.addInitScript(() => { localStorage.setItem('ff2_onboardingDone', 'true') })
  page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(error.message))
  const settle = () => page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))
  })
  const audit = async name => {
    await settle()
    await page.evaluate(axe.source)
    const report = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
    audits.push({ name, violations: report.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), incomplete: report.incomplete.map(item => item.id) })
  }
  for (const lang of ['pl', 'en', 'es', 'zh']) {
    const source = await readFile(`src/lib/locales/${lang}.ts`, 'utf8')
    const t = JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1))
    const guides = await readConstant(`src/lib/guides/${lang}.ts`, lang)
    for (const theme of ['light', 'dark', 'obsidian', 'sage', 'eink']) {
      console.log(`Checking ${lang}/${theme}`)
      await page.goto(url)
      await page.evaluate(({ lang, theme }) => {
        localStorage.setItem('ff2_lang', JSON.stringify(lang))
        localStorage.setItem('ff2_theme', JSON.stringify(theme))
      }, { lang, theme })
      await page.reload()
      for (const [width, height, top, bottom] of [[320, 740, 0, 0], [393, 852, 59, 34], [768, 1024, 0, 0], [1440, 1000, 0, 0]]) {
        currentCase = { lang, theme, width, height }
        await page.setViewportSize({ width, height })
        await page.evaluate(({ top, bottom }) => {
          document.documentElement.style.setProperty('--safe-top', `${top}px`)
          document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`)
        }, { top, bottom })
        await page.getByRole('button', { name: t['nav.tips'], exact: true }).click()
        while (await page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) }).isVisible()) {
          await page.getByRole('button', { name: new RegExp(`^${escape(t['topic.back'])}: `) }).click()
        }
        await page.locator('.guide-library h1').waitFor()
        await settle()
        assert.equal(await page.locator('.guide-library button').count(), topics.length, 'Every catalog category must remain reachable')
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${lang}/${theme}/${width}: library overflow`)
        assert.ok(await page.locator('.guide-library img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'All category covers must load')
        if (lang === 'pl' && [393, 768, 1440].includes(width)) await page.screenshot({ path: `${output}/${theme}-${width}-library.png`, fullPage: true })
        await page.locator('.guide-feature').click()
        await page.locator('.guide-category h1').waitFor()
        assert.equal(await page.locator('.guide-article-row').count(), featuredArticles.length)
        await page.locator('.guide-article-row').last().click()
        await page.locator('.guide-article h1').waitFor()
        await settle()
        const articleTitle = await page.locator('.guide-article h1').textContent()
        const heading = await page.locator('.guide-article h1').boundingBox()
        const header = await page.locator('.app-header').boundingBox()
        assert.ok(heading.y - (header.y + header.height) < 160, 'Article heading has excessive blank space above it')
        assert.equal(await page.locator('article ol li').count(), guides[featuredArticles.at(-1)[0]].steps.length)
        assert.ok(await page.locator('article a[target="_blank"]').count() > 0)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${lang}/${theme}/${width}: article overflow`)
        if (lang === 'pl' && [393, 1440].includes(width)) {
          await page.screenshot({ path: `${output}/${theme}-${width}-article.png`, fullPage: true })
          await audit(`${theme}-${width}-article`)
        }
        await page.evaluate(() => window.scrollTo(0, 500))
        const back = await page.locator('article .guide-back').boundingBox()
        assert.ok(back.y >= top && back.y + back.height < height - bottom, 'Sticky article return is outside the safe area')
        await page.getByRole('button', { name: t['nav.timer'], exact: true }).click()
        await page.getByRole('button', { name: t['nav.tips'], exact: true }).click()
        await page.locator('.guide-article h1').waitFor()
        assert.equal(await page.locator('.guide-article h1').textContent(), articleTitle, 'Reading route must survive switching views')
        await page.keyboard.press('Escape')
        await page.locator('.guide-category h1').waitFor()
        await page.keyboard.press('Escape')
        await page.locator('.guide-library h1').waitFor()
        if (lang === 'pl' && [393, 1440].includes(width)) await audit(`${theme}-${width}-library`)
        const trigger = page.getByRole('button', { name: t['settings.app'], exact: true })
        await trigger.click()
        await page.locator('.settings-overview').waitFor()
        const dialog = page.locator('.settings-panel')
        const bounds = await dialog.boundingBox()
        assert.ok(bounds.y >= top && bounds.y + bounds.height <= height - bottom + 1, 'Settings outside safe area')
        if (lang === 'pl' && [393, 1440].includes(width)) {
          await settle()
          await page.screenshot({ path: `${output}/${theme}-${width}-settings.png` })
          await audit(`${theme}-${width}-settings`)
        }
        await dialog.getByRole('button', { name: new RegExp(t['settings.theme']) }).click()
        await dialog.getByRole('radiogroup').waitFor()
        assert.equal(await dialog.getByRole('radio').count(), 5)
        await dialog.getByRole('button', { name: t['common.back'], exact: true }).click()
        await dialog.getByRole('button', { name: new RegExp(t['settings.language']) }).click()
        assert.equal(await dialog.locator('button[lang]').count(), 4)
        await page.keyboard.press('Escape')
        await dialog.waitFor({ state: 'hidden' })
        assert.ok(await trigger.evaluate(button => button === document.activeElement), 'Settings must restore focus to its trigger')
        results.push({ lang, theme, width, height, safeArea: { top, bottom }, passed: true })
      }
    }
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ results, audits, errors, physicalDevice: false }, null, 2))
  assert.deepEqual(errors, [])
  assert.deepEqual(audits.filter(item => item.violations.length), [], 'Guides/settings have accessibility violations')
  console.log(`PASS: ${results.length} language/theme/viewport cases; ${audits.length} WCAG A/AA audits; category covers, compact reader, safe areas, retained routes, settings navigation and focus restoration`)
} catch (error) {
  await page?.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  await writeFile(`${output}/failure.json`, JSON.stringify({ currentCase, message: String(error), errors, completed: results, audits }, null, 2))
  throw error
} finally { await browser.close(); server?.kill() }
