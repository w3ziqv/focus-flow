import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, collection, setDoc, getDoc, getDocs, deleteDoc, query, limit, updateDoc } from 'firebase/firestore'

const address = process.env.FIRESTORE_EMULATOR_HOST
if (!address || !/^(127\.0\.0\.1|localhost):\d+$/.test(address)) {
  throw Error('Run against a loopback emulator: firebase emulators:exec --only firestore --project demo-focus-flow-security "npm run test:rules"')
}
const [host, port] = address.split(':')
const env = await initializeTestEnvironment({ projectId: 'demo-focus-flow-security', firestore: { host, port: Number(port), rules: readFileSync('src/lib/sync/firestore.rules', 'utf8') } })
const owner = env.authenticatedContext('alice').firestore()
const outsider = env.authenticatedContext('bob').firestore()
const anonymous = env.unauthenticatedContext().firestore()
const date = '2026-10-03T12:00:00.000Z'
const session = { id: 'session-1', date, minutes: 25, task: 'Private', checklist: [{ id: 'item-1', text: 'Read', completed: false }], schemaVersion: 2 }
let passed = 0
async function check(name, task) { await task(); passed++; console.log(`PASS ${name}`) }
try {
  await env.clearFirestore()
  const ref = doc(owner, 'users/alice/sessions/session-1')
  await check('owner creates valid session', () => assertSucceeds(setDoc(ref, session)))
  await check('owner reads own session', () => assertSucceeds(getDoc(ref)))
  for (const [label, db] of [['other account', outsider], ['anonymous', anonymous]]) {
    await check(`${label} cannot read`, () => assertFails(getDoc(doc(db, ref.path))))
    await check(`${label} cannot write`, () => assertFails(setDoc(doc(db, ref.path), session)))
    await check(`${label} cannot delete`, () => assertFails(deleteDoc(doc(db, ref.path))))
    await check(`${label} cannot list`, () => assertFails(getDocs(query(collection(db, 'users/alice/sessions'), limit(10)))))
  }
  for (const [label, change] of Object.entries({
    'foreign body ID': { id: 'another' }, 'oversized minutes': { minutes: 121 },
    'nested checklist map': { checklist: [{ id: 'item-1', text: { injected: true } }] },
    'unknown checklist field': { checklist: [{ id: 'item-1', text: 'Read', admin: true }] },
    'oversized checklist': { checklist: Array(4).fill(session.checklist[0]) },
    'invalid optional duration': { durationMinutes: 'unbounded' },
    'unknown schema': { schemaVersion: 999 }, 'unknown top-level field': { admin: true },
  })) await check(`reject ${label}`, () => assertFails(setDoc(ref, { ...session, ...change })))
  await check('update cannot introduce a malformed checklist', () => assertFails(updateDoc(ref, { checklist: [{ id: 'a', text: 'Read', completed: 1 }] })))
  await check('bounded session query succeeds', () => assertSucceeds(getDocs(query(collection(owner, 'users/alice/sessions'), limit(400)))))
  await check('unbounded session query fails', () => assertFails(getDocs(collection(owner, 'users/alice/sessions'))))
  await check('oversized session query fails', () => assertFails(getDocs(query(collection(owner, 'users/alice/sessions'), limit(1001)))))
  const settings = { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false, schemaVersion: 2 }
  const settingsRef = doc(owner, 'users/alice/settings/current')
  await check('current settings schema succeeds', () => assertSucceeds(setDoc(settingsRef, settings)))
  await check('legacy break names succeed', () => assertSucceeds(setDoc(settingsRef, { focus: 25, shortBreak: 5, longBreak: 15, rounds: 4, autoStart: false })))
  await check('singleton ID enforced', () => assertFails(setDoc(doc(owner, 'users/alice/settings/arbitrary'), settings)))
  await check('opaque nested settings rejected', () => assertFails(setDoc(settingsRef, { ...settings, interface: { arbitrary: Array(100).fill('junk') } })))
  const stats = { minutes: 25, today: 1, week: 1, streak: 1, milestones: [], goals: { enabled: true, dailyTargetMinutes: 60 }, schemaVersion: 3 }
  const statsRef = doc(owner, 'users/alice/stats/summary')
  await check('valid stats succeed', () => assertSucceeds(setDoc(statsRef, stats)))
  const dailyRef = doc(owner, 'users/alice/daily_history/2026-10-03')
  const daily = {date: '2026-10-03', minutes: 25, schemaVersion: 3}
  await check('daily history succeeds', () => assertSucceeds(setDoc(dailyRef, daily)))
  await check('legacy arbitrary history rejected', () => assertFails(setDoc(statsRef, {...stats, history: {bad: 'unsafe'}})))
  await check('invalid calendar date rejected', () => assertFails(setDoc(doc(owner, 'users/alice/daily_history/2026-02-31'), {...daily, date: '2026-02-31'})))
  await check('non-leap February rejected', () => assertFails(setDoc(doc(owner, 'users/alice/daily_history/1900-02-29'), {...daily, date: '1900-02-29'})))
  await check('leap February accepted', () => assertSucceeds(setDoc(doc(owner, 'users/alice/daily_history/2000-02-29'), {...daily, date: '2000-02-29'})))
  await check('daily negative rejected', () => assertFails(setDoc(dailyRef, {...daily, minutes: -1})))
  await check('daily fractional rejected', () => assertFails(setDoc(dailyRef, {...daily, minutes: 0.5})))
  await check('daily excessive rejected', () => assertFails(setDoc(dailyRef, {...daily, minutes: 10000001})))
  await check('daily mismatch rejected', () => assertFails(setDoc(dailyRef, {...daily, date: '2026-10-04'})))
  await check('daily foreign account rejected', () => assertFails(setDoc(doc(outsider, 'users/alice/daily_history/2026-10-03'), daily)))
  await check('malformed goals rejected', () => assertFails(setDoc(statsRef, { ...stats, goals: { enabled: 'yes', dailyTargetMinutes: 60 } })))
  await check('malformed milestone rejected', () => assertFails(setDoc(statsRef, { ...stats, milestones: [{ id: 'first', unlockedAt: date, seen: 'yes' }] })))
  await check('oversized history rejected', () => assertFails(setDoc(statsRef, { ...stats, history: Object.fromEntries(Array.from({ length: 1001 }, (_, i) => [`day${i}`, 25])) })))
  await check('sound preferences accept schema', () => assertSucceeds(setDoc(doc(owner, 'users/alice/sound_prefs/current'), { baseTexture: 'brown', binauralMode: 'off', volume: 0.5, toneWarmthCutoff: 800 })))
  await check('opaque sound preference rejected', () => assertFails(setDoc(doc(owner, 'users/alice/sound_prefs/current'), { baseTexture: { attack: true } })))
  await check('opaque interface preference rejected', () => assertFails(setDoc(doc(owner, 'users/alice/interface/current'), { shortcuts: { attack: true } })))
  await check('oversized platform rejected', () => assertFails(setDoc(doc(owner, 'users/alice/metadata/sync'), { clientPlatform: 'x'.repeat(513) })))
  await check('root document denied', () => assertFails(setDoc(doc(owner, 'users/alice'), { admin: true })))
  await check('unknown collection denied', () => assertFails(setDoc(doc(owner, 'admin/config'), { admin: true })))
  await check('owner creates permanent deletion', () => assertSucceeds(setDoc(doc(owner, 'users/alice/tombstones/session-1'), {id: 'session-1', deletedAt: '2020-01-01T12:00:00Z'})))
  await check('deleted ID cannot be overwritten', () => assertFails(setDoc(ref, session)))
  await check('owner can delete a session', () => assertSucceeds(deleteDoc(ref)))
  await check('deleted ID cannot be recreated after years offline', () => assertFails(setDoc(ref, session)))
  console.log(`${passed} real Firestore authorization checks passed`)
} finally { await env.cleanup() }
