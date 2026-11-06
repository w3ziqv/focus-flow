import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {setTimeout as delay} from 'node:timers/promises'
import {chromium} from 'playwright-core'

const url=process.env.FOCUS_FLOW_TEST_URL ?? 'http://127.0.0.1:4180'
const server=process.env.FOCUS_FLOW_TEST_URL ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4180','--strictPort'],{stdio:'pipe'})
const output='test-artifacts/security-3.1'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:process.env.CHROMIUM_NO_SANDBOX?['--no-sandbox']:[]})
const report={history:1000,startPauseCycles:40,viewCycles:30,audioChanges:30,quotaRollback:false,errors:[]}
try {
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break}catch{};if(i===99)throw Error('Build the app before running the security browser suite');await delay(100)}
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',serviceWorkers:'block'})
 await context.addInitScript(()=>{
  const now=new Date(),monday=new Date(now);monday.setDate(now.getDate()-((now.getDay()+6)%7))
  localStorage.setItem('ff2_onboardingDone','true');localStorage.setItem('ff2_lang',JSON.stringify('en'))
  localStorage.setItem('ff2_sessions',JSON.stringify(Array.from({length:1000},(_,i)=>({id:`stress-${i}`,date:now.toISOString(),minutes:1,task:i%5===0?'=1+1':i%5===1?'<img src=x onerror="globalThis.__injected=1">':`Synthetic task ${i}`}))))
  localStorage.setItem('ff2_stats',JSON.stringify({today:1000,week:1000,minutes:1000,streak:1,date:now.toDateString(),weekStart:monday.toDateString(),lastDate:now.toDateString(),history:{[now.toDateString()]:1000}}))
  localStorage.setItem('unrelated_secret','DO-NOT-EXPORT')
  window.__securityAudio={contexts:0,active:new Set()};window.__securityUrls=new Set()
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
  URL.createObjectURL=value=>{const u=create(value);window.__securityUrls.add(u);return u}
  URL.revokeObjectURL=u=>{window.__securityUrls.delete(u);revoke(u)}
  const Native=window.AudioContext
  window.AudioContext=class extends Native {constructor(...args){super(...args);window.__securityAudio.contexts++;for(const method of ['createBufferSource','createOscillator']){const make=this[method].bind(this);this[method]=(...args)=>{const node=make(...args),start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...args)=>{window.__securityAudio.active.add(node);return start(...args)};node.stop=(...args)=>{window.__securityAudio.active.delete(node);return stop(...args)};return node}}}}
 })
 const page=await context.newPage();page.setDefaultTimeout(15000)
 page.on('pageerror',e=>report.errors.push(e.message))
 await page.goto(url);await page.getByRole('button',{name:'Start',exact:true}).waitFor()
 await page.getByRole('button',{name:'Sound settings',exact:true}).click()
 await page.getByRole('button',{name:'Brown noise',exact:true}).click();await page.keyboard.press('Escape')
 for(let i=0;i<40;i++){await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click()}
 console.log('PASS: 40 start/pause cycles with audio')
 await page.getByRole('button',{name:'Start',exact:true}).click()
 const deadline=await page.evaluate(()=>JSON.parse(localStorage.getItem('ff2_session')))
 for(let i=0;i<30;i++){
  await page.getByRole('button',{name:'Statistics',exact:true}).click()
  await page.getByRole('heading',{name:'Statistics',exact:true}).waitFor()
  assert.ok(await page.getByRole('button',{name:'Edit task name',exact:true}).count()<=50,'History exceeded its visible page bound')
  await page.getByRole('button',{name:'Guides',exact:true}).click()
  await page.locator('main > div:not([hidden]) button.group').first().waitFor()
  await page.getByRole('button',{name:'Timer',exact:true}).click()
 }
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ff2_session')))
 assert.equal(after.id,deadline.id);assert.equal(after.endTs,deadline.endTs)
 await page.getByRole('button',{name:'Pause',exact:true}).click()
 for(let i=0;i<30;i++){
  await page.getByRole('button',{name:'Sound settings',exact:true}).click()
  await page.getByRole('dialog').getByRole('button',{name:i%2?'Brown noise':'Pink noise',exact:true}).click()
  await page.keyboard.press('Escape')
 }
 await page.getByRole('button',{name:'Sound settings',exact:true}).click()
 await page.getByRole('group',{name:'Ambient sounds',exact:true}).getByRole('button',{name:'Off',exact:true}).click();await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'Statistics',exact:true}).click()
 await page.getByRole('searchbox').fill('Synthetic task 999')
 assert.equal(await page.getByRole('button',{name:'Edit task name',exact:true}).count(),1)
 await page.getByRole('searchbox').fill('')
 assert.equal(await page.evaluate(()=>window.__injected),undefined)
 // Local guide covers remain mounted in hidden views; inspect the visible history.
 assert.equal(await page.locator('main > div:not([hidden])').locator('img, script').count(),0)
 assert.equal(await page.locator('main script').count(),0)
 console.log('PASS: 30 view cycles preserve deadline; history remains bounded and text stays inert')
 await page.getByRole('button',{name:'Export backup',exact:true}).click()
 const csvPromise=page.waitForEvent('download')
 await page.getByRole('dialog').getByRole('button',{name:'Spreadsheet CSV (.csv)',exact:true}).click()
 const csv=await csvPromise
 assert.ok((await readFile(await csv.path(),'utf8')).includes('"\'=1+1"'))
 const jsonPromise=page.waitForEvent('download')
 await page.getByRole('button',{name:'Full JSON Backup',exact:true}).click()
 const json=await jsonPromise;const text=await readFile(await json.path(),'utf8');const backup=JSON.parse(text)
 assert.equal(backup.data.sessions.length,1000);assert.equal(text.includes('DO-NOT-EXPORT'),false)
 backup.data.settings.focus=45;backup.data.sessions[0].task='Quota rollback probe'
 await page.waitForTimeout(300)
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
 await page.evaluate(()=>{window.__securitySetItem=Storage.prototype.setItem;let failed=false;Storage.prototype.setItem=function(k,v){if(k==='ff2_sessions'&&!failed){failed=true;throw new DOMException('Synthetic quota failure','QuotaExceededError')}return window.__securitySetItem.call(this,k,v)}})
 await page.getByTestId('backup-file-input').setInputFiles({name:'quota-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))})
 await page.getByRole('alert').getByText(/could not be fully saved/i).waitFor()
 assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),before)
 await page.evaluate(()=>{Storage.prototype.setItem=window.__securitySetItem})
 report.quotaRollback=true
 await page.setViewportSize({width:320,height:740})
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await page.waitForTimeout(1500)
 const audio=await page.evaluate(()=>({contexts:window.__securityAudio.contexts,activeSources:window.__securityAudio.active.size,liveObjectUrls:window.__securityUrls.size}))
 assert.ok(audio.contexts<=2,`Audio contexts leaked: ${audio.contexts}`)
 assert.equal(audio.activeSources,0);assert.equal(audio.liveObjectUrls,0)
 report.resources=audio
 assert.deepEqual(report.errors,[])
 await page.screenshot({path:`${output}/quota-error-320.png`,fullPage:true})
 console.log('PASS: CSV/JSON export, real browser quota rollback, no leftover audio sources or object URLs')
} finally {await writeFile(`${output}/browser-stress.json`,JSON.stringify(report,null,2));await browser.close();server?.kill()}
