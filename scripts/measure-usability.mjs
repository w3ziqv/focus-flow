import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

// Two already-built releases, sequential fresh contexts on the same machine.
// Input-to-two-animation-frames is a local paint proxy, not field INP.
const urls = process.argv.slice(2)
assert.equal(urls.length, 2, 'Pass baseline and candidate preview URLs')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: process.env.CHROMIUM_NO_SANDBOX ? ['--no-sandbox'] : [] })
const runs = []
try {
  for (const url of urls) for (let sample=0; sample<5; sample++) {
    const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block',reducedMotion:'reduce'})
    await context.addInitScript(()=>{
      localStorage.setItem('ff2_onboardingDone','true')
      localStorage.setItem('ff2_lang','en')
      window.__paint=[]
      new PerformanceObserver(list=>{window.__lcp=list.getEntries().at(-1)?.startTime}).observe({type:'largest-contentful-paint',buffered:true})
      for(const name of ['input','click']) document.addEventListener(name,()=>{
        const start=performance.now()
        requestAnimationFrame(()=>requestAnimationFrame(()=>window.__paint.push({name,ms:performance.now()-start})))
      },true)
    })
    const page=await context.newPage()
    await page.goto(url)
    await page.getByRole('button',{name:'Start',exact:true}).waitFor()
    await page.evaluate(()=>document.fonts.ready)
    await page.waitForTimeout(900)
    await page.getByRole('textbox',{name:'What are you working on?'}).fill('Measure input response')
    await page.getByRole('button',{name:'Start',exact:true}).click()
    await page.getByRole('button',{name:'Pause',exact:true}).waitFor()
    await page.waitForFunction(()=>window.__paint.length>=2)
    runs.push({url,sample,...await page.evaluate(()=>({lcpMs:window.__lcp,paint:window.__paint,jsBytes:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).reduce((sum,r)=>sum+r.decodedBodySize,0)}))})
    await context.close()
  }
  await mkdir('test-artifacts/v3.1',{recursive:true})
  await writeFile('test-artifacts/v3.1/input-response.json',JSON.stringify({chromium:browser.version(),viewport:'393x852',serviceWorkers:'blocked',reducedMotion:true,method:'input/click dispatch to two animation frames, not field INP',runs},null,2))
  console.log('PASS: five fresh contexts per release; startup, transfer and input paint proxies captured')
} finally {await browser.close()}
