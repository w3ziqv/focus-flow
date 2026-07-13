import { dict, lang } from './i18n.js'
import { sidebarOverlay, themeBtn } from './dom.js'

export function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  const t = document.getElementById('view-'+view); if (t) t.classList.add('active')
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === view))
  closeSidebar()
}
export function openSidebar() { sidebarOverlay.classList.add('open') }
export function closeSidebar() { sidebarOverlay.classList.remove('open') }

export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('ff_theme', t)
  themeBtn.textContent = dict[lang.current][t === 'dark' ? 'theme-dark' : 'theme-light']
  document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0a0a0a' : '#ffffff')
}
