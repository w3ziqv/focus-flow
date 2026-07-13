import { state } from './state.js'

export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880; osc.type = 'sine'; gain.gain.value = 0.3
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export function stopSound() {
  if (state.soundNodes) { state.soundNodes.forEach(n => { try { n.stop() } catch {} }); state.soundNodes = null }
  if (state.soundCtx) { try { state.soundCtx.close() } catch {}; state.soundCtx = null }
}
export function createNoiseBuffer(ctx) {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}
export function makeSource(ctx, buf) {
  const s = ctx.createBufferSource()
  s.buffer = buf; s.loop = true; s.start()
  return s
}
export function playRain(ctx) {
  const buf = createNoiseBuffer(ctx)
  const nodes = []

  const s1 = makeSource(ctx, buf)
  const lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass'; lp1.frequency.value = 600
  const g1 = ctx.createGain(); g1.gain.value = 0.08
  s1.connect(lp1); lp1.connect(g1); g1.connect(ctx.destination)
  nodes.push(s1)

  const buf2 = createNoiseBuffer(ctx)
  const s2 = makeSource(ctx, buf2)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.8
  const g2 = ctx.createGain(); g2.gain.value = 0.06
  s2.connect(bp); bp.connect(g2); g2.connect(ctx.destination)
  nodes.push(s2)

  const buf3 = createNoiseBuffer(ctx)
  const s3 = makeSource(ctx, buf3)
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000
  const g3 = ctx.createGain(); g3.gain.value = 0.03
  s3.connect(hp); hp.connect(g3); g3.connect(ctx.destination)
  nodes.push(s3)

  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15; lfo.type = 'sine'
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.015
  lfo.connect(lfoGain); lfoGain.connect(g2.gain)
  const lfoG2 = ctx.createGain(); lfoG2.gain.value = 0.01
  lfo.connect(lfoG2); lfoG2.connect(g3.gain)
  lfo.start()
  nodes.push(lfo)

  return nodes
}
export function playNoise(ctx) {
  const buf = createNoiseBuffer(ctx)
  const nodes = []

  const s = makeSource(ctx, buf)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000
  const g = ctx.createGain(); g.gain.value = 0.035
  s.connect(lp); lp.connect(g); g.connect(ctx.destination)
  nodes.push(s)

  return nodes
}
export function setSound(s) {
  stopSound()
  state.sound = s
  document.querySelectorAll('.sound-btn').forEach(b => b.classList.toggle('active', b.dataset.sound === s))
  if (s === 'none') return
  try {
    state.soundCtx = new (window.AudioContext || window.webkitAudioContext)()
    state.soundNodes = []
    if (s === 'rain') state.soundNodes = playRain(state.soundCtx)
    else if (s === 'noise') state.soundNodes = playNoise(state.soundCtx)
  } catch {}
}
