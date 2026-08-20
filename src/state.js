import { defaultTips } from './tips.js'

export const defaults = { focus: 25, short: 5, long: 15, rounds: 4, autoStart: false }

export function loadTips() {
  try { const s = localStorage.getItem('ff_tips'); if (s) return JSON.parse(s) } catch {}
  return JSON.parse(JSON.stringify(defaultTips))
}
export function saveTips() { localStorage.setItem('ff_tips', JSON.stringify(state.tips)) }

export function loadStats() {
  try {
    const s = localStorage.getItem('ff_stats')
    if (s) {
      const d = JSON.parse(s); const today = new Date().toDateString()
      if (d.date !== today) {
        d.today = 0; d.date = today
        const ws = getWeekStart()
        if (d.weekStart !== ws) { d.week = 0; d.weekStart = ws }
      }
      return d
    }
  } catch {}
  return { today:0, week:0, streak:0, minutes:0, date:new Date().toDateString(), weekStart:getWeekStart(), lastDate:null, history:{} }
}
export function getWeekStart() {
  const d = new Date(); const day = d.getDay()
  const diff = d.getDate() - day + (day===0?-6:1)
  return new Date(d.setDate(diff)).toDateString()
}
export function saveStats() { localStorage.setItem('ff_stats', JSON.stringify(state.stats)) }

export function loadSettings() {
  try {
    const s = localStorage.getItem('ff_settings')
    if (s) { state.settings = { ...defaults, ...JSON.parse(s) }; return }
  } catch {}
  state.settings = { ...defaults }
}
export function saveSettings() { localStorage.setItem('ff_settings', JSON.stringify(state.settings)) }

export const MAX_SOUND_SIZE = 4 * 1024 * 1024

export function loadCustomSounds() {
  try {
    const s = localStorage.getItem('ff_custom_sounds')
    if (s) {
      const d = JSON.parse(s)
      if (Array.isArray(d)) return d.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.dataUrl === 'string')
    }
  } catch {}
  return []
}
export function saveCustomSounds() { localStorage.setItem('ff_custom_sounds', JSON.stringify(state.customSounds)) }

export function loadTheme() {
  const t = localStorage.getItem('ff_theme')
  if (t === 'dark' || t === 'light') { document.documentElement.setAttribute('data-theme', t); return t }
  const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', sys)
  return sys
}

export let state = {
  mode: 'focus', running: false, timeLeft: defaults.focus * 60, total: defaults.focus * 60,
  round: 0, settings: { ...defaults }, tips: loadTips(), stats: loadStats(),
  timer: null, focusOpen: false, task: '', sound: 'none', soundCtx: null, soundNode: null,
  customSounds: loadCustomSounds(), customAudio: null,
}
