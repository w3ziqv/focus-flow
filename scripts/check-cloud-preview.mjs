// Read-only preflight: no sign-in, Firestore writes or administrative changes.
const target = process.env.FOCUS_FLOW_TEST_URL
let origin
try {
  const url = new URL(target)
  if (url.protocol !== 'https:' || url.search || url.hash) throw Error()
  origin = url
} catch {
  console.error('Set FOCUS_FLOW_TEST_URL to the HTTPS preview URL without access parameters.')
  process.exit(1)
}
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_AUTH_DOMAIN']
const missing = required.filter(key => !process.env[key]?.trim())
if (missing.length) {
  console.error(`Missing public Firebase configuration: ${missing.join(', ')}`)
  process.exit(1)
}
try {
  const endpoint = new URL('https://identitytoolkit.googleapis.com/v1/projects')
  endpoint.searchParams.set('key', process.env.VITE_FIREBASE_API_KEY)
  const response = await fetch(endpoint, {signal: AbortSignal.timeout(15000)})
  if (!response.ok) {
    console.error(`Firebase Auth configuration request failed: HTTP ${response.status}. Check key restrictions and the enabled service.`)
    process.exit(1)
  }
  const config = await response.json()
  if (!Array.isArray(config.authorizedDomains) || !config.authorizedDomains.includes(origin.hostname)) {
    console.error(`BLOCKED: ${origin.hostname} is absent from Firebase Authentication authorized domains.`)
    console.error('Add only this exact host in the intended Firebase project, then repeat this check.')
    process.exit(1)
  }
  console.log(`PASS: Firebase Auth responds and authorizes ${origin.hostname}.`)
  console.log('This is a configuration check; real Google login and two-profile synchronization still require acceptance.')
} catch {
  console.error('Could not reach Firebase Auth within the preflight deadline. Check network access and retry.')
  process.exit(1)
}
