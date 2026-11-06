import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'
import axe from 'axe-core'

const url = process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1457'
const server = process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'test', '--host', '127.0.0.1', '--port', '1457', '--strictPort'], { stdio: 'pipe' })
const output = 'test-artifacts/v3.1.2/motion'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const results = []
const errors = []
let page
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(url)).ok) break } catch {}
    if (attempt === 99) throw Error('Motion test server did not start')
    await delay(100)
  }
  for (const width of [320, 393, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 852 }, reducedMotion: 'no-preference' })
    await context.addInitScript(() => {
      localStorage.setItem('ff2_onboardingDone', 'true')
      localStorage.setItem('ff2_lang', '"en"')
      localStorage.setItem('ff2_sessions', JSON.stringify([{ id: 'motion-fixture', date: new Date().toISOString(), minutes: 25, task: 'Completed work' }]))
      window.motionRuns = []
      const original = Element.prototype.animate
      Element.prototype.animate = function (frames, options) {
        const animation = original.call(this, frames, options)
        window.motionRuns.push({ animation, frames, options, copy: !!this.closest('[data-motion-copy]') })
        return animation
      }
    })
    page = await context.newPage()
    page.setDefaultTimeout(12000)
    page.on('pageerror', error => errors.push(error.message))
    const settle = async () => {
      await page.waitForFunction(() => !document.querySelector('[data-motion-running], [data-motion-copy]') && !window.motionRuns.some(({ animation }) => ['running', 'paused'].includes(animation.playState)))
      await page.evaluate(() => document.fonts.ready)
    }
    const clickNow = selector => page.evaluate(selector => document.querySelector(selector).click(), selector)
    const pause = async time => {
      await page.waitForFunction(() => window.motionRuns.some(({ animation }) => animation.playState === 'running'))
      await page.evaluate(time => window.motionRuns.forEach(({ animation }) => { if (animation.playState === 'running') { animation.pause(); animation.currentTime = time } }), time)
    }
    const finish = () => page.evaluate(() => window.motionRuns.forEach(({ animation }) => { if (['running', 'paused'].includes(animation.playState)) animation.finish() }))
    const resetRuns = () => page.evaluate(() => { window.motionRuns = [] })
    const runs = () => page.evaluate(() => window.motionRuns.map(({ frames, options, copy }) => ({ frames, options, copy })))
    await page.goto(url)
    await settle()
    await page.getByRole('textbox', { name: 'What are you working on?' }).fill('Retain this session')
    await page.getByRole('button', { name: 'Add micro-step', exact: true }).click()
    await page.getByPlaceholder('Next small step...').fill('Retain this checklist')
    await page.getByPlaceholder('Next small step...').press('Enter')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
    const sessionBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.includes('session'))))
    await resetRuns()
    await page.getByRole('button', { name: 'Guides', exact: true }).click()
    await page.locator('.guide-library h1').waitFor()
    await settle()
    assert.ok((await runs()).some(run => run.options.duration === 320), 'Main views use the tab duration')
    assert.equal(await page.locator('main [role="status"]').count(), 0, 'The destination must render before its transition')
    const header = await page.locator('.app-header').boundingBox()
    const nav = await page.locator('nav').boundingBox()
    await resetRuns()
    await clickNow('.guide-feature')
    await pause(140)
    const forward = await runs()
    assert.ok(forward.some(run => !run.copy && run.options.duration === 440 && run.frames[0].transform.includes('translateX(')), 'Category navigation must move the live screen')
    assert.ok(await page.locator('[data-motion-copy]').evaluateAll(copies => copies.every(copy => copy.inert && copy.getAttribute('aria-hidden') === 'true')), 'Outgoing screens must be inert and hidden from accessibility')
    assert.deepEqual(await page.locator('.app-header').boundingBox(), header, 'Navigation must leave the header in place')
    assert.deepEqual(await page.locator('nav').boundingBox(), nav, 'Navigation must leave the navigation bar in place')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Moving screens must not cause horizontal overflow')
    await page.screenshot({ path: `${output}/${width}-forward.png` })
    // Reverse the transition while it is still running.
    await page.keyboard.press('Escape')
    await finish()
    await settle()
    assert.equal(await page.locator('.guide-library').count(), 1)
    assert.equal(await page.locator('[data-motion-copy]').count(), 0, 'Interrupted screens must be removed')
    await page.locator('.guide-feature').click()
    await settle()
    await page.evaluate(() => window.scrollTo(0, 350))
    await page.locator('.guide-article-row').first().click()
    await page.locator('.guide-article h1').waitFor()
    await pause(100)
    assert.equal(await page.evaluate(() => scrollY), 0, 'A new article starts at the top')
    await page.evaluate(() => window.scrollTo(0, 420))
    const sticky = await page.locator('article .guide-back').boundingBox()
    assert.ok(sticky.y >= 0 && sticky.y < 100, 'Article return must stay sticky during motion')
    await finish(); await settle()
    const readingPosition = await page.evaluate(() => scrollY)
    // Programmatic activation keeps desktop automation from scrolling the header first.
    await page.evaluate(() => [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Timer').click())
    await settle()
    assert.ok(await page.getByText('Retain this session', { exact: true }).isVisible())
    assert.ok(await page.getByRole('checkbox', { name: 'Retain this checklist', exact: true }).isVisible())
    assert.ok(await page.getByRole('button', { name: 'Pause', exact: true }).isVisible(), 'Timer must remain running')
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.includes('session')))), sessionBefore, 'Transitions must not replace a running session')
    await page.evaluate(() => [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Guides').click())
    await settle()
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - readingPosition) < 2, 'Returning to reading must restore its scroll position')
    await page.keyboard.press('Escape'); await settle()
    await page.keyboard.press('Escape'); await settle()
    // Exercise repeated input before previous frames complete.
    await page.evaluate(async () => {
      const nav = name => [...document.querySelectorAll('nav button')].find(button => button.textContent === name).click()
      for (let i = 0; i < 8; i++) {
        nav(i % 2 ? 'Guides' : 'Timer')
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
    })
    await settle()
    assert.ok(await page.locator('.guide-library').isVisible())
    assert.equal(await page.locator('[data-motion-copy]').count(), 0)
    // A dialog opened during view movement must still cover the viewport and navigation.
    await page.evaluate(() => [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Statistics').click())
    await page.getByRole('button', { name: 'Export card', exact: true }).waitFor()
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Export card').click())
    await settle()
    const exportDialog = page.getByRole('dialog')
    assert.equal(await exportDialog.count(), 1)
    assert.ok(await exportDialog.evaluate(dialog => {
      const nav = document.querySelector('nav').getBoundingClientRect()
      const top = document.elementFromPoint(nav.left + nav.width / 2, nav.top + nav.height / 2)
      return !!top?.closest('[data-dialog-root]') && !!dialog.closest('[data-dialog-root]')
    }), 'Export dialog must cover navigation outside the moving view')
    await page.keyboard.press('Escape'); await settle()
    await page.getByRole('button', { name: 'Guides', exact: true }).click(); await settle()
    // Modal entrance, height changes, nested focus and exit.
    const settings = page.getByRole('button', { name: 'App', exact: true })
    await settings.click()
    await page.locator('.settings-overview').waitFor()
    await settle()
    await resetRuns()
    const dialog = page.getByRole('dialog', { name: 'App settings', exact: true })
    await dialog.getByRole('button', { name: /Theme/ }).click()
    await settle()
    assert.ok((await runs()).some(run => run.frames.some(frame => 'height' in frame)), 'Settings height changes must animate')
    await page.getByRole('radio', { name: /Obsidian/ }).click()
    await settle()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await settle()
    await page.getByRole('button', { name: /Shortcuts/ }).click()
    await settle()
    const child = page.getByRole('dialog', { name: 'Keyboard Shortcuts', exact: true })
    await child.waitFor()
    assert.ok(await page.locator('.settings-panel').evaluate(panel => !!panel.closest('[inert]')))
    await page.keyboard.press('Escape')
    await settle()
    assert.equal(await page.getByRole('dialog').count(), 1)
    assert.ok(await page.getByRole('button', { name: /Shortcuts/ }).evaluate(button => button === document.activeElement), 'Nested dialogs must restore focus')
    await resetRuns()
    await page.keyboard.press('Escape')
    await pause(80)
    assert.equal(await page.getByRole('dialog').count(), 0, 'The closing visual must release modal semantics immediately')
    assert.ok((await runs()).some(run => run.options.duration === 260), 'Closing a dialog uses the shorter duration')
    assert.ok(await settings.evaluate(button => button === document.activeElement), 'Closing must restore focus immediately')
    await finish(); await settle()
    await settings.click(); await page.locator('.settings-overview').waitFor(); await settle()
    await page.getByRole('button', { name: /Accessibility/ }).click(); await settle()
    await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
    await settle()
    await resetRuns()
    await page.getByRole('button', { name: 'Back', exact: true }).click(); await settle()
    await page.keyboard.press('Escape'); await settle()
    await page.locator('.guide-feature').click(); await settle()
    const reduced = await runs()
    assert.ok(reduced.length > 0 && reduced.every(run => run.options.duration <= 100), 'Manual reduced motion uses short fades')
    assert.ok(reduced.every(run => run.frames.every(frame => !frame.transform || frame.transform === 'translateX(0px)' || frame.transform === 'translateX(0)')), 'Reduced motion must remove displacement')
    await page.evaluate(axe.source)
    const audit = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
    assert.deepEqual(audit.violations.map(violation => violation.id), [], 'Motion must preserve accessibility')
    // OS preference overrides the manual setting and can change in flight.
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem('ff2_interface'))
      prefs.reduceMotion = false
      localStorage.setItem('ff2_interface', JSON.stringify(prefs))
      window.dispatchEvent(new CustomEvent('focus-flow:storage', { detail: 'ff2_interface' }))
    })
    await page.waitForFunction(() => !document.documentElement.classList.contains('reduce-motion'))
    await resetRuns()
    await clickNow('.guide-article-row')
    await pause(100)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await settle()
    assert.equal(await page.locator('[data-motion-copy]').count(), 0, 'An OS preference change must finish existing movement')
    await resetRuns()
    await page.keyboard.press('Escape'); await settle()
    assert.ok((await runs()).every(run => run.options.duration <= 100), 'OS reduced motion must override the application preference')
    await page.getByRole('button', { name: 'Timer', exact: true }).click(); await settle()
    await page.getByRole('button', { name: 'Focus mode', exact: true }).click(); await settle()
    assert.ok(await page.getByRole('dialog', { name: 'Focus mode', exact: true }).isVisible())
    await page.keyboard.press('Escape'); await settle()
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    results.push({ width, forward: 440, tab: 320, exit: 260, reduced: 100, retainedState: true, accessibilityViolations: 0 })
    console.log(`PASS: ${width}px motion, interruption, state, scroll, dialogs and reduced motion`)
    await context.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, physicalDevice: false }, null, 2))
} catch (error) {
  await page?.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), errors, results }, null, 2))
  throw error
} finally { await browser.close(); server?.kill() }
