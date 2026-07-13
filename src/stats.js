import { dict, lang } from './i18n.js'
import { state } from './state.js'
import { statToday, statWeek, statStreak, statMinutes, chart, chartLabels } from './dom.js'

export function updateStats() {
  statToday.textContent = state.stats.today
  statWeek.textContent = state.stats.week
  statStreak.textContent = state.stats.streak || dict[lang.current]['stat-streak-none']
  statMinutes.textContent = state.stats.minutes
}

export function renderChart() {
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    const min = (state.stats.history && state.stats.history[key]) || 0
    days.push({ label: d.toLocaleDateString(lang.current === 'pl' ? 'pl' : 'en', { weekday:'short' }), val: min })
  }
  const max = Math.max(...days.map(d => d.val), 1)
  chart.innerHTML = days.map(d => `<div class="chart-bar ${d.val > 0 ? 'fill' : ''}" style="height:${Math.max(2, (d.val/max)*56)}px"></div>`).join('')
  chartLabels.innerHTML = days.map(d => `<span>${d.label}</span>`).join('')
}
