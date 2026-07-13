import { dict, lang } from './i18n.js'
import { state, defaults, saveStats, getWeekStart } from './state.js'
import { timerDisplay, timerRound, focusTimerDisplay, focusTimerRound, timerStart, focusStart, taskInput, taskDone, taskDoneText, timerTip, timerTipIcon, timerTipText, timerTipSource, focusTip } from './dom.js'
import { beep } from './audio.js'
import { updateStats, renderChart } from './stats.js'

export function formatTime(sec) { return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}` }
export function updateDisplay(display, roundEl) {
  display.textContent = formatTime(state.timeLeft)
  roundEl.textContent = dict[lang.current]['round-count'].replace('0',state.round).replace('4',state.settings.rounds)
}
export function getTipText(tip) { return (tip && tip[lang.current]) ? tip[lang.current].title : tip }

export function startTimer() {
  if (state.running) return
  const val = taskInput.value.trim()
  if (val) { state.task = val; taskInput.value = val; taskInput.style.display = 'none'; taskDone.style.display = 'none' }
  state.running = true
  timerStart.textContent = dict[lang.current]['timer-running']
  focusStart.textContent = dict[lang.current]['timer-running']
  state.timer = setInterval(() => {
    state.timeLeft--
    if (state.timeLeft <= 0) { clearInterval(state.timer); state.running = false; onSessionComplete(); return }
    updateDisplay(timerDisplay, timerRound)
    if (state.focusOpen) updateDisplay(focusTimerDisplay, focusTimerRound)
  }, 1000)
}

export function pauseTimer() {
  if (!state.running) return
  clearInterval(state.timer); state.timer = null; state.running = false
  timerStart.textContent = dict[lang.current]['timer-start']
  focusStart.textContent = dict[lang.current]['timer-start']
}

export function resetTimer() {
  clearInterval(state.timer); state.timer = null; state.running = false
  timerStart.textContent = dict[lang.current]['timer-start']
  focusStart.textContent = dict[lang.current]['timer-start']
  const mins = state.settings[state.mode]
  state.timeLeft = mins * 60; state.total = mins * 60
  updateDisplay(timerDisplay, timerRound)
  if (state.focusOpen) updateDisplay(focusTimerDisplay, focusTimerRound)
  taskInput.style.display = ''
  if (state.task) { taskInput.value = state.task; taskDone.style.display = ''; taskDoneText.textContent = state.task }
  else taskDone.style.display = 'none'
}

export function onSessionComplete() {
  beep()
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(dict[lang.current]['session-complete']) } catch {}
  }
  state.stats.today++; state.stats.week++; state.stats.minutes += state.settings.focus
  const today = new Date().toDateString()
  if (state.stats.lastDate) {
    const diff = (new Date(today) - new Date(state.stats.lastDate)) / 86400000
    if (diff === 1) state.stats.streak++
    else if (diff > 1) state.stats.streak = 1
  } else state.stats.streak = 1
  state.stats.lastDate = today; state.stats.date = today; state.stats.weekStart = getWeekStart()
  if (!state.stats.history) state.stats.history = {}
  state.stats.history[today] = (state.stats.history[today] || 0) + state.settings.focus
  saveStats(); updateStats(); renderChart()

  if (state.task) {
    taskDone.style.display = ''; taskDoneText.textContent = state.task
    taskInput.style.display = 'none'
  }

  state.round++
  const auto = state.settings.autoStart
  if (state.mode === 'focus') {
    if (state.round >= state.settings.rounds) { state.round = 0; switchMode('long', auto) }
    else switchMode('short', auto)
  } else switchMode('focus', auto)
  if (state.mode !== 'focus') showBreakTip()
}

export function showBreakTip() {
  const allTips = [...state.tips.przerwa, ...state.tips.jedzenie]
  const tip = allTips[Math.floor(Math.random() * allTips.length)]
  timerTip.classList.add('visible')
  timerTipIcon.textContent = state.mode === 'short' ? '☕' : '🌿'
  timerTipText.textContent = getTipText(tip)
  timerTipSource.textContent = `— ${dict[lang.current][state.mode === 'short' ? 'mode-short' : 'mode-long']}`
  setTimeout(() => timerTip.classList.remove('visible'), 8000)
}

export function switchMode(mode, autoStart) {
  state.mode = mode
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode)
    t.setAttribute('aria-selected', t.dataset.mode === mode)
  })
  const mins = state.settings[mode === 'focus' ? 'focus' : mode === 'short' ? 'short' : 'long']
  state.timeLeft = mins * 60; state.total = mins * 60
  state.running = false; clearInterval(state.timer); state.timer = null
  timerStart.textContent = dict[lang.current]['timer-start']
  focusStart.textContent = dict[lang.current]['timer-start']
  updateDisplay(timerDisplay, timerRound)
  if (state.focusOpen) updateDisplay(focusTimerDisplay, focusTimerRound)
  if (mode === 'focus') { timerTip.classList.remove('visible'); focusTip.classList.remove('visible') }
  if (autoStart && mode !== 'focus') startTimer()
}
