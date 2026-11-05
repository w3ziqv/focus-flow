import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalPeer } from './peer'
import { LocalReplica } from './replica'
import { loadSessions, saveSessions } from '../storage'

const channels: RTCDataChannel[] = []
const rtcConnections: { ondatachannel: ((event: RTCDataChannelEvent) => void) | null }[] = []
const connections: LocalPeer[] = []
const fixture = () => {
  saveSessions(Array.from({ length: 100 }, (_, i) => ({ id: `quoted-${i}`, date: '2026-11-04T12:00:00Z', minutes: 1, task: '"'.repeat(200) })))
  const data = JSON.stringify(new LocalReplica().capture())
  localStorage.clear()
  return data
}
const frames = (data: string) => {
  const result = [JSON.stringify({ type: 'begin', size: data.length })]
  for (let i = 0; i < data.length; i += 12 * 1024) result.push(JSON.stringify({ type: 'chunk', data: data.slice(i, i + 12 * 1024) }))
  result.push(JSON.stringify({ type: 'end' }))
  return result
}
beforeEach(() => {
  localStorage.clear()
  channels.length = 0
  rtcConnections.length = 0
  vi.stubGlobal('RTCPeerConnection', class {
    ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null
    constructor() { rtcConnections.push(this) }
    iceGatheringState = 'complete'
    localDescription = { toJSON: () => ({ type: 'offer', sdp: '' }) }
    createDataChannel() {
      const channel = { label: 'focus-flow-v3', readyState: 'open', bufferedAmount: 0, send: vi.fn(), close: vi.fn() } as unknown as RTCDataChannel
      channels.push(channel)
      return channel
    }
    async createOffer() { return { type: 'offer', sdp: '' } }
    async setLocalDescription() {}
    close() {}
  })
})
afterEach(() => {
  connections.splice(0).forEach(peer => peer.disconnect())
  vi.unstubAllGlobals()
})
async function open() {
  const peer = new LocalPeer(() => {})
  connections.push(peer)
  await peer.offer()
  return { peer, channel: channels.at(-1)! }
}

describe('peer transfer boundaries', () => {
  it('accepts valid chunks even when JSON quoting expands the wire frame', async () => {
    const data = fixture()
    const encoded = frames(data)
    expect(encoded.some(frame => frame.length > 12 * 1024 + 256)).toBe(true)
    const { peer, channel } = await open()
    for (const frame of encoded) channel.onmessage?.call(channel, { data: frame } as MessageEvent)
    expect(peer.status).toBe('synced')
    expect(loadSessions()).toHaveLength(100)
    expect(loadSessions().every(s => s.task === '"'.repeat(200))).toBe(true)
  })
  it('ignores an already queued message callback after disconnect', async () => {
    const remote = JSON.parse(fixture())
    const first = Object.entries(remote.records).slice(0, 1)
    remote.records = Object.fromEntries(first)
    const data = JSON.stringify(remote)
    const { peer, channel } = await open()
    const queued = channel.onmessage!
    peer.disconnect()
    for (const frame of frames(data)) queued.call(channel, { data: frame } as MessageEvent)
    expect(peer.status).toBe('disconnected')
    expect(loadSessions()).toHaveLength(0)
  })
  it('rejects a queued data channel from a disconnected connection', async () => {
    const data = fixture()
    const { peer, channel } = await open()
    const queued = rtcConnections.at(-1)!.ondatachannel!
    const incoming = { ...channel, close: vi.fn() } as unknown as RTCDataChannel
    peer.disconnect()
    queued({ channel: incoming } as RTCDataChannelEvent)
    for (const frame of frames(data)) incoming.onmessage?.call(incoming, { data: frame } as MessageEvent)
    expect(peer.status).toBe('disconnected')
    expect(loadSessions()).toHaveLength(0)
    expect(incoming.close).toHaveBeenCalledOnce()
  })
  it('rejects oversized decoded chunks without altering stored history', async () => {
    const { peer, channel } = await open()
    channel.onmessage?.call(channel, { data: JSON.stringify({ type: 'begin', size: 100000 }) } as MessageEvent)
    channel.onmessage?.call(channel, { data: JSON.stringify({ type: 'chunk', data: 'x'.repeat(12 * 1024 + 1) }) } as MessageEvent)
    expect(peer.status).toBe('error')
    expect(loadSessions()).toHaveLength(0)
  })
})
