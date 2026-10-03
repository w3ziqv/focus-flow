import { describe, expect, it } from 'vitest'
import { parsePairingCode } from './peer'
const encode = (sdp: string) => JSON.stringify({app:'focus-flow', version:3, description:{type:'offer',sdp}})
const fingerprint = `a=fingerprint:sha-256 ${Array(32).fill('00').join(':')}\r\n`
describe('explicit peer pairing boundary', () => {
  it('accepts fingerprint-bearing direct host pairing', () => {
    expect(parsePairingCode(encode(fingerprint+'a=candidate:1 1 udp 1 192.168.1.2 1234 typ host\r\n')).description.type).toBe('offer')
  })
  it('rejects remote relays, incompatible schemas and missing fingerprints', () => {
    for (const code of [encode('v=0'), encode(fingerprint+'a=candidate:1 1 udp 1 8.8.8.8 1234 typ host'), encode(fingerprint+'a=candidate:1 1 udp 1 1.2.3.4 1234 typ relay'), '{}', 'x'.repeat(65537)]) expect(() => parsePairingCode(code)).toThrow()
  })
})
