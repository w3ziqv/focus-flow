import { lang, dict, apply } from './i18n.js'
import { state, defaults, loadSettings, saveSettings, loadTheme, saveCustomSounds, MAX_SOUND_SIZE } from './state.js'
import { timerDisplay, timerRound, focusTimerDisplay, focusTimerRound, timerStart, focusStart, themeBtn, hamburger, sidebarClose, sidebarOverlay, sidebarLang, taskInput, taskDone, taskDoneText, settingsModal, settingsClose, settingsFocus, settingsShort, settingsLong, settingsRounds, settingsAutoStart, settingsSave, focusBtn, focusOverlay, focusResetBtn, focusExit, timerSettings, timerResetBtn, timerTip, timerTipIcon, timerTipText, timerTipSource, focusTip, focusTipIcon, focusTipText, focusTipSource, soundUpload, soundFile, customSoundsWrap, soundMsg } from './dom.js'
import { updateDisplay, startTimer, pauseTimer, resetTimer, switchMode } from './timer.js'
import { setSound } from './audio.js'
import { updateStats, renderChart } from './stats.js'
import { renderTips } from './tips.js'
import { switchView, openSidebar, closeSidebar, setTheme } from './ui.js'

function applyFull(l) {
  apply(l)
  updateDisplay(timerDisplay, timerRound)
  if (state.focusOpen) updateDisplay(focusTimerDisplay, focusTimerRound)
  if (state.running) { timerStart.textContent = dict[l]['timer-running']; focusStart.textContent = dict[l]['timer-running'] }
  renderTips(); updateStats(); renderChart(); renderCustomSounds()
}

function showMsg(key, name) {
  let t = dict[lang.current][key] || ''
  if (name) t = t.replace('{name}', name)
  soundMsg.textContent = t
  soundMsg.classList.add('visible')
  clearTimeout(showMsg._t)
  showMsg._t = setTimeout(() => { soundMsg.classList.remove('visible'); soundMsg.textContent = '' }, 4000)
}

function renderCustomSounds() {
  customSoundsWrap.innerHTML = ''
  state.customSounds.forEach(rec => {
    const wrap = document.createElement('div')
    wrap.className = 'sound-custom'
    wrap.dataset.sound = 'custom:' + rec.id
    const btn = document.createElement('button')
    btn.className = 'sound-btn' + (state.sound === 'custom:' + rec.id ? ' active' : '')
    btn.dataset.sound = 'custom:' + rec.id
    btn.type = 'button'
    btn.textContent = rec.name
    btn.addEventListener('click', () => setSound(btn.dataset.sound))
    const rm = document.createElement('button')
    rm.className = 'sound-remove'
    rm.type = 'button'
    rm.setAttribute('aria-label', (dict[lang.current]['sound-remove'] || '').replace('{name}', rec.name))
    rm.textContent = '×'
    rm.addEventListener('click', () => removeCustomSound(rec.id))
    wrap.append(btn, rm)
    customSoundsWrap.appendChild(wrap)
  })
}

function removeCustomSound(id) {
  const i = state.customSounds.findIndex(r => r.id === id)
  if (i === -1) return
  const wasActive = state.sound === 'custom:' + id
  state.customSounds.splice(i, 1)
  try { saveCustomSounds() } catch {}
  if (wasActive) setSound('none')
  renderCustomSounds()
}

const savedTheme = loadTheme()
loadSettings()
state.mode = 'focus'
state.timeLeft = state.settings.focus * 60
state.total = state.settings.focus * 60
updateDisplay(timerDisplay, timerRound)
updateStats()
renderTips()
renderChart()
applyFull(lang.current)
setTheme(savedTheme)

if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()

hamburger.addEventListener('click', openSidebar)
sidebarClose.addEventListener('click', closeSidebar)
sidebarOverlay.addEventListener('click', e => { if (e.target === sidebarOverlay) closeSidebar() })

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => switchView(link.dataset.view))
  link.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchView(link.dataset.view) } })
})

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => { if (state.running) pauseTimer(); switchMode(tab.dataset.mode) })
})

timerStart.addEventListener('click', () => state.running ? pauseTimer() : startTimer())
timerResetBtn.addEventListener('click', resetTimer)

taskInput.addEventListener('change', () => {
  if (taskInput.value.trim()) { state.task = taskInput.value.trim() }
})

timerSettings.addEventListener('click', () => {
  settingsFocus.value = state.settings.focus
  settingsShort.value = state.settings.short
  settingsLong.value = state.settings.long
  settingsRounds.value = state.settings.rounds
  settingsAutoStart.checked = state.settings.autoStart
  settingsModal.classList.add('open')
})
settingsClose.addEventListener('click', () => settingsModal.classList.remove('open'))
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.remove('open') })
settingsSave.addEventListener('click', () => {
  state.settings.focus = parseInt(settingsFocus.value) || defaults.focus
  state.settings.short = parseInt(settingsShort.value) || defaults.short
  state.settings.long = parseInt(settingsLong.value) || defaults.long
  state.settings.rounds = parseInt(settingsRounds.value) || defaults.rounds
  state.settings.autoStart = settingsAutoStart.checked
  saveSettings()
  settingsModal.classList.remove('open')
  resetTimer()
  updateDisplay(timerDisplay, timerRound)
  if (state.focusOpen) updateDisplay(focusTimerDisplay, focusTimerRound)
})

document.querySelectorAll('.sound-btn').forEach(b => {
  if (b.dataset.sound) b.addEventListener('click', () => setSound(b.dataset.sound))
})

soundUpload.addEventListener('click', () => soundFile.click())
soundFile.addEventListener('change', () => {
  const file = soundFile.files && soundFile.files[0]
  soundFile.value = ''
  if (!file) return
  if (file.size > MAX_SOUND_SIZE) { showMsg('sound-too-large'); return }
  const reader = new FileReader()
  reader.onload = () => {
    const name = (file.name.replace(/\.[^.]+$/, '').trim() || dict[lang.current]['sound-unnamed']).slice(0, 40) || dict[lang.current]['sound-unnamed']
    const rec = { id: 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name, dataUrl: reader.result }
    state.customSounds.push(rec)
    try { saveCustomSounds() } catch { state.customSounds.pop(); showMsg('sound-too-large'); return }
    renderCustomSounds()
    setSound('custom:' + rec.id)
    showMsg('sound-loaded', name)
  }
  reader.readAsDataURL(file)
})

focusBtn.addEventListener('click', () => {
  state.focusOpen = true; focusOverlay.classList.add('open')
  updateDisplay(focusTimerDisplay, focusTimerRound)
  if (state.running) focusStart.textContent = dict[lang.current]['timer-running']
  if (timerTip.classList.contains('visible')) {
    focusTip.classList.add('visible'); focusTipIcon.textContent = timerTipIcon.textContent
    focusTipText.textContent = timerTipText.textContent; focusTipSource.textContent = timerTipSource.textContent
  }
})
focusExit.addEventListener('click', () => { state.focusOpen = false; focusOverlay.classList.remove('open') })
focusStart.addEventListener('click', () => state.running ? pauseTimer() : startTimer())
focusResetBtn.addEventListener('click', resetTimer)

themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme')
  setTheme(cur === 'dark' ? 'light' : 'dark')
})

sidebarLang.addEventListener('click', () => applyFull(lang.current === 'pl' ? 'en' : 'pl'))

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return
  if (e.key === ' ') { e.preventDefault(); state.running ? pauseTimer() : startTimer() }
  if (e.key === 'r' || e.key === 'R') resetTimer()
  if ((e.key === 'f' || e.key === 'F') && !state.focusOpen) focusBtn.click()
  if (e.key === 'Escape') {
    if (state.focusOpen) focusExit.click()
    else if (settingsModal.classList.contains('open')) settingsModal.classList.remove('open')
    else if (sidebarOverlay.classList.contains('open')) closeSidebar()
  }
})
