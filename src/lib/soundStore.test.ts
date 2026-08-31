import { describe, expect, it } from 'vitest'
import { isAudioUpload } from './soundStore'

describe('isAudioUpload', () => {
  it('accepts audio/* MIME types', () => {
    expect(isAudioUpload({ type: 'audio/mpeg', name: 'song.mp3' })).toBe(true)
    expect(isAudioUpload({ type: 'audio/x-wav', name: 'anything' })).toBe(true)
    expect(isAudioUpload({ type: 'audio/whatever-future-codec', name: 'x' })).toBe(true)
  })

  it('falls back to the extension when the type is empty', () => {
    expect(isAudioUpload({ type: '', name: 'loop.flac' })).toBe(true)
    expect(isAudioUpload({ type: '', name: 'LOOP.OGG' })).toBe(true)
  })

  it('rejects non-audio types and files', () => {
    expect(isAudioUpload({ type: 'text/html', name: 'page.html' })).toBe(false)
    expect(isAudioUpload({ type: 'application/pdf', name: 'file.mp3.pdf' })).toBe(false)
    expect(isAudioUpload({ type: '', name: 'virus.exe' })).toBe(false)
    expect(isAudioUpload({ type: '', name: 'no-extension' })).toBe(false)
    expect(isAudioUpload({ type: 'image/png', name: 'renamed.mp3' })).toBe(false)
  })
})
