import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const directory = process.env.FOCUS_FLOW_MEASURE_OUTPUT ?? 'test-artifacts/modernization/history'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const runs = []
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: {width:390,height:844}, serviceWorkers:'block' })
    await context.addInitScript(() => {
      const now = new Date()
      const sessions = Array.from({length:1000}, (_, i) => ({id:`TEST-${i}`,date:now.toISOString(),minutes:1,task:`TEST task ${i}`}))
      localStorage.setItem('ff2_onboardingDone','true')
      localStorage.setItem('ff2_sessions',JSON.stringify(sessions))
      localStorage.setItem('ff2_stats',JSON.stringify({today:1000,week:1000,minutes:1000,streak:1,date:now.toDateString(),weekStart:now.toDateString(),lastDate:now.toDateString(),history:{[now.toDateString()]:1000}}))
      window.__writes=[]
      const original=Storage.prototype.setItem
      Storage.prototype.setItem=function(key,value){const start=performance.now();const result=original.call(this,key,value);window.__writes.push({key,ms:performance.now()-start});return result}
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
    await cdp.send('Performance.enable')
    await page.goto(process.env.FOCUS_FLOW_MEASURE_URL ?? 'http://127.0.0.1:4173')
    await page.getByRole('button',{name:'Start',exact:true}).click()
    const started = performance.now()
    await page.getByRole('button',{name:'Statistics',exact:true}).click()
    await page.getByRole('heading',{name:'Statistics',exact:true}).waitFor()
    await page.getByRole('button',{name:'Edit task name',exact:true}).first().waitFor({state:'attached'})
    const navigationMs=performance.now()-started
    await page.waitForTimeout(1000)
    const before=(await cdp.send('Performance.getMetrics')).metrics
    await page.waitForTimeout(5000)
    const after=(await cdp.send('Performance.getMetrics')).metrics
    const value=(rows,name)=>rows.find(row=>row.name===name)?.value??0
    const result={run,navigationMs,renderedSessions:await page.getByRole('button',{name:'Edit task name',exact:true}).count(),mainThreadMs:(value(after,'TaskDuration')-value(before,'TaskDuration'))*1000,scriptMs:(value(after,'ScriptDuration')-value(before,'ScriptDuration'))*1000}
    await page.getByRole('button',{name:'Timer',exact:true}).click()
    await page.getByRole('button',{name:'Pause',exact:true}).click()
    await page.getByRole('button',{name:'Statistics',exact:true}).click()
    await page.getByRole('button',{name:'Edit task name',exact:true}).first().click()
    await page.evaluate(()=>{window.__writes=[]})
    await page.locator('main input[maxlength="200"]').fill('TEST edited history')
    await page.locator('main input[maxlength="200"]').press('Enter')
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ff2_sessions'))[0].task==='TEST edited history')
    result.storageWrites=await page.evaluate(()=>window.__writes)
    runs.push(result)
    await context.close()
  }
} finally {
  await writeFile(join(directory,'history.json'),JSON.stringify({chromium:browser.version(),cpuThrottle:4,viewport:'390x844',sessions:1000,sampleMs:5000,runs},null,2))
  await browser.close()
}
