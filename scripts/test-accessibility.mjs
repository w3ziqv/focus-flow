import assert from 'node:assert/strict'
import {mkdir, writeFile} from 'node:fs/promises'
import {chromium} from 'playwright-core'
import axe from 'axe-core'
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : []})
const directory = process.env.FOCUS_FLOW_A11Y_OUTPUT ?? '/tmp/focus-flow-ux-audit'
await mkdir(directory, {recursive: true})
const context = await browser.newContext({locale: 'pl-PL', viewport: {width: 1280, height: 900}})
const page = await context.newPage()
const reports = []
async function audit(name) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))
  })
  await page.evaluate(axe.source)
  const results = await page.evaluate(async () => window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']}}))
  reports.push({name, violations: results.violations.map(item => ({id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({target: node.target, summary: node.failureSummary}))})), incomplete: results.incomplete.map(item => item.id)})
  await page.screenshot({path: `${directory}/3.0-${name}.png`, fullPage: true})
}
try {
  await page.goto(process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:1420')
  await page.getByRole('button', {name: 'Zamknij', exact: true}).click()
  await audit('timer-pl')
  await page.getByRole('button', {name: /Statystyki/}).click()
  await page.getByRole('button', {name: 'Rozpocznij pierwszą sesję'}).waitFor()
  await audit('empty-statistics-pl')
  await page.getByRole('button', {name: 'Rozpocznij pierwszą sesję'}).click()
  const cloud = page.getByRole('button', {name: /^Synchronizacja w chmurze:/})
  await cloud.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {name: 'Synchronizacja w chmurze'})
  await dialog.waitFor()
  await page.getByRole('button', {name: 'Chmura niedostępna w tym wydaniu'}).waitFor()
  assert.ok(await page.getByRole('button', {name: 'Chmura niedostępna w tym wydaniu'}).isDisabled())
  await page.waitForFunction(() => document.querySelector('[role=dialog]').contains(document.activeElement))
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)), true, 'Focus escaped cloud dialog')
  }
  await audit('cloud-pl')
  await page.keyboard.press('Escape')
  await dialog.waitFor({state: 'hidden'})
  assert.equal(await cloud.evaluate(button => button === document.activeElement), true, 'Focus did not return to cloud trigger')
  // A CSS zoom check exercises the real layout at 200%; it does not certify
  // every browser's page-zoom implementation or replace a screen reader test.
  await page.evaluate(() => {document.documentElement.style.zoom = '2'})
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '200% timer layout overflows')
  await audit('zoom-200-pl')
  await writeFile(`${directory}/accessibility-results.json`, JSON.stringify(reports, null, 2))
  assert.deepEqual(reports.flatMap(report => report.violations), [], 'Automated accessibility violations; inspect accessibility-results.json')
  console.log('PASS: Polish timer/statistics/cloud, axe WCAG A/AA checks, modal keyboard trap/restore, 200% CSS zoom. Screen-reader acceptance remains manual.')
} finally {
  await writeFile(`${directory}/accessibility-results.json`, JSON.stringify(reports, null, 2))
  await browser.close()
}
