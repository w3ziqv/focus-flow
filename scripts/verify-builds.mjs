import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'

const web = readFileSync('dist/index.html', 'utf8')
const desktop = readFileSync('dist-desktop/index.html', 'utf8')
assert.ok(existsSync('dist/sw.js'), 'Web build must remain offline-ready')
assert.match(web, /rel="manifest"/, 'Web build must expose its PWA manifest')
assert.match(web, /registerSW/, 'Web build must register its Service Worker')
assert.doesNotMatch(desktop, /rel="manifest"|registerSW|serviceWorker/, 'Desktop HTML must not register a PWA')
assert.ok(!readdirSync('dist-desktop').some(name => /^(sw\.js|workbox-|registerSW\.js|manifest\.webmanifest)/.test(name)), 'Desktop build must not ship PWA artifacts')
for (const html of [web, desktop]) {
  assert.match(html, /rel="preload" as="font"/, 'Each target must preload its own dial font')
  assert.match(html, /src="[^\"]*assets\/[^\"]+\.js"/, 'Each target must load the application')
}
const sw = readFileSync('dist/sw.js', 'utf8')
for (const sound of ['rain', 'waves']) {
  const file = `sounds/moodist/${sound}.mp3`
  assert.ok(statSync(`dist/${file}`).size < 2 * 1024 * 1024, `${sound} must fit the PWA precache budget`)
  assert.deepEqual(readFileSync(`dist/${file}`), readFileSync(`dist-desktop/${file}`), `${sound} must ship in both targets`)
  assert.ok(sw.includes(file), `${sound} must be precached for offline playback`)
}
assert.ok(sw.includes('sounds/moodist/NOTICE.txt'), 'Recording attribution must remain available offline')
console.log('Web PWA and desktop build isolation verified.')
