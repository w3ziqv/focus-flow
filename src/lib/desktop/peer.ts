import { LocalReplica } from './replica'
export type PeerStatus = 'disconnected' | 'pairing' | 'connected' | 'syncing' | 'synced' | 'error'
interface PairingCode { app: 'focus-flow'; version: 3; description: RTCSessionDescriptionInit }
const MAX_TRANSFER = 2 * 1024 * 1024
const CHUNK = 12 * 1024

export function parsePairingCode(code: string): PairingCode {
  if (code.length > 64 * 1024) throw Error('Pairing code too large')
  const raw = JSON.parse(code) as PairingCode
  const description = raw?.description
  if (raw?.app !== 'focus-flow' || raw.version !== 3 || !description || !['offer','answer'].includes(description.type) || typeof description.sdp !== 'string' || !description.sdp.split(/\r?\n/).some(line => /^a=fingerprint:sha-256 (?:[0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(line))) throw Error('Invalid pairing code')
  // No relay/STUN candidates: pairing and data stay on direct host paths.
  for (const line of description.sdp.split(/\r?\n/)) {
    if (line.startsWith('a=candidate:')) {
      const address = line.split(/\s+/)[4]?.toLowerCase() ?? ''
      const octets = address.split('.').map(Number)
      const privateV4 = octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
        (octets[0] === 10 || octets[0] === 127 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 169 && octets[1] === 254))
      const privateV6 = address === '::1' || /^(fc|fd|fe[89ab])[0-9a-f]*:/.test(address)
      if (!/ typ host(?: |$)/.test(line) || !(privateV4 || privateV6 || /^[a-z0-9-]+\.local$/.test(address))) throw Error('Only local host candidates are supported')
    }
  }
  return raw
}
export class LocalPeer {
  private connection: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private replica: LocalReplica
  private received = ''
  private expected = 0
  private transferTimer: ReturnType<typeof setTimeout> | null = null
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private sendQueue: Promise<void> = Promise.resolve()
  private disposeStorage: (() => void) | null = null
  public status: PeerStatus = 'disconnected'
  public error: string | null = null
  constructor(private readonly onChange: () => void) { this.replica = new LocalReplica() }
  private statusChanged(status: PeerStatus): void { this.status = status; this.onChange() }
  private fail(error: unknown): void { this.error = String(error); this.statusChanged('error') }
  private createConnection(): RTCPeerConnection {
    this.disconnect()
    if (typeof RTCPeerConnection === 'undefined') throw Error('WebRTC is unavailable in this WebView')
    const connection = new RTCPeerConnection({iceServers: [], iceTransportPolicy: 'all'})
    this.connection = connection
    connection.ondatachannel = event => { if (event.channel.label !== 'focus-flow-v3') { event.channel.close(); return }; this.attach(event.channel) }
    connection.onconnectionstatechange = () => {
      if (connection !== this.connection) return
      if (connection.connectionState === 'failed') this.fail('Local connection failed. Re-pair the devices.')
      if (connection.connectionState === 'disconnected' || connection.connectionState === 'closed') this.statusChanged('disconnected')
    }
    this.error = null
    this.statusChanged('pairing')
    return connection
  }
  private attach(channel: RTCDataChannel): void {
    if (this.channel && this.channel !== channel) { channel.close(); return }
    this.channel = channel
    channel.onopen = () => {
      if (channel !== this.channel) return
      this.statusChanged('connected')
      const changed = () => {
        if (this.syncTimer) clearTimeout(this.syncTimer)
        this.syncTimer = setTimeout(() => { void this.sync().catch(error => this.fail(error)) }, 300)
      }
      window.addEventListener('focus-flow:storage', changed)
      this.disposeStorage = () => window.removeEventListener('focus-flow:storage', changed)
      void this.sync().catch(error => this.fail(error))
    }
    channel.onmessage = event => {
      try {
        if (typeof event.data !== 'string' || event.data.length > CHUNK + 256) throw Error('Invalid peer frame')
        const frame = JSON.parse(event.data) as {type: string; size?: number; data?: string}
        if (frame.type === 'begin') {
          if (this.expected || !Number.isSafeInteger(frame.size) || frame.size! <= 0 || frame.size! > MAX_TRANSFER) throw Error('Invalid peer transfer size')
          this.expected = frame.size!; this.received = ''
          this.transferTimer = setTimeout(() => { this.fail('Peer transfer timed out'); this.disconnect(false) }, 30_000)
          this.statusChanged('syncing')
        } else if (frame.type === 'chunk') {
          if (!this.expected || typeof frame.data !== 'string' || frame.data.length > CHUNK || this.received.length + frame.data.length > this.expected) throw Error('Invalid peer chunk')
          this.received += frame.data
        } else if (frame.type === 'end') {
          if (!this.expected || this.received.length !== this.expected) throw Error('Incomplete peer transfer')
          const value: unknown = JSON.parse(this.received)
          this.replica.merge(value)
          this.received = ''; this.expected = 0
          if (this.transferTimer) clearTimeout(this.transferTimer)
          this.transferTimer = null
          this.statusChanged('synced')
        } else throw Error('Unsupported peer frame')
      } catch (error) { this.fail(error); this.disconnect(false) }
    }
    channel.onclose = () => { if (channel === this.channel) this.disconnect() }
    channel.onerror = () => this.fail('Peer data channel failed')
  }
  private async waitIce(connection: RTCPeerConnection): Promise<string> {
    if (connection.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(Error('Local address discovery timed out')) }, 15_000)
      const changed = () => { if (connection.iceGatheringState === 'complete') { cleanup(); resolve() } }
      const cleanup = () => { clearTimeout(timeout); connection.removeEventListener('icegatheringstatechange', changed) }
      connection.addEventListener('icegatheringstatechange', changed)
    })
    if (connection !== this.connection || !connection.localDescription) throw Error('Pairing was cancelled')
    return JSON.stringify({app:'focus-flow', version:3, description: connection.localDescription.toJSON()})
  }
  async offer(): Promise<string> {
    const connection = this.createConnection()
    this.attach(connection.createDataChannel('focus-flow-v3', {ordered: true}))
    await connection.setLocalDescription(await connection.createOffer())
    return this.waitIce(connection)
  }
  async accept(code: string): Promise<string | null> {
    const pairing = parsePairingCode(code)
    if (pairing.description.type === 'offer') {
      const connection = this.createConnection()
      await connection.setRemoteDescription(pairing.description)
      await connection.setLocalDescription(await connection.createAnswer())
      return this.waitIce(connection)
    }
    if (!this.connection || this.connection.signalingState !== 'have-local-offer') throw Error('Create an offer before accepting an answer')
    await this.connection.setRemoteDescription(pairing.description)
    return null
  }
  async sync(): Promise<void> {
    const channel = this.channel
    if (!channel || channel.readyState !== 'open') throw Error('Devices are not connected')
    const data = JSON.stringify(this.replica.capture())
    if (data.length > MAX_TRANSFER) throw Error('Peer archive exceeds transfer limit')
    this.sendQueue = this.sendQueue.catch(() => {}).then(async () => {
      const send = async (frame: unknown) => {
        const started = Date.now()
        while (channel.bufferedAmount > 128 * 1024) {
          if (Date.now() - started > 30_000) throw Error('Peer send timed out')
          if (channel.readyState !== 'open') throw Error('Peer disconnected')
          await new Promise(resolve => setTimeout(resolve, 20))
        }
        if (channel.readyState !== 'open') throw Error('Peer disconnected')
        channel.send(JSON.stringify(frame))
      }
      await send({type:'begin', size:data.length})
      for (let i=0; i<data.length; i+=CHUNK) await send({type:'chunk', data:data.slice(i,i+CHUNK)})
      await send({type:'end'})
    })
    await this.sendQueue
  }
  disconnect(resetStatus = true): void {
    this.disposeStorage?.(); this.disposeStorage = null
    if (this.transferTimer) clearTimeout(this.transferTimer)
    if (this.syncTimer) clearTimeout(this.syncTimer)
    this.transferTimer = null; this.syncTimer = null; this.expected = 0; this.received = ''
    const channel = this.channel; this.channel = null
    if (channel) { channel.onclose = null; channel.close() }
    const connection = this.connection; this.connection = null
    connection?.close()
    if (resetStatus) this.statusChanged('disconnected')
  }
}
