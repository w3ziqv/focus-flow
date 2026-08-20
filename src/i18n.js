import { themeBtn } from './dom.js'

export const lang = { current: localStorage.getItem('ff_lang') || 'pl' }

export const dict = {
  pl: {
    skip:'Przejdź do timera','nav-timer':'Timer','nav-tips':'Wskazówki','nav-github':'GitHub','nav-github-aria':'GitHub (nowa karta)',
    'sidebar-settings':'Ustawienia','sidebar-theme':'Motyw','sidebar-lang':'Język',
    'theme-light':'Jasny','theme-dark':'Ciemny',
    'lang-btn':'EN',
    'app-name':'Focus Flow',
    'task-placeholder':'Co robisz w tej sesji?',
    'mode-focus':'Focus','mode-short':'Short Break','mode-long':'Long Break',
    'round-count':'Runda 0 / 4',
    'timer-start':'Start','timer-reset':'Reset','timer-settings':'Ustawienia',
    'sound-none':'Wyłącz','sound-rain':'Deszcz','sound-noise':'Szum',
    'sound-upload':'Dodaj dźwięk','sound-choose':'Wybierz plik dźwiękowy (maks. 4 MB)','sound-too-large':'Plik jest za duży. Maksymalny rozmiar to 4 MB.','sound-loaded':'Dodano: {name}','sound-remove':'Usuń {name}','sound-unnamed':'Mój dźwięk',
    'focus-enter':'Wejdź w tryb Focus','focus-exit':'Wyjście',
    'stat-today':'dzisiaj','stat-week':'w tym tygodniu','stat-streak':'dni z rzędu','stat-minutes':'minut focusu',
    'chart-label':'Minuty focusu',
    'tips-label':'Wskazówki','tips-desc':'Praktyczne porady podzielone na kategorie. Kliknij kategorię, aby rozwinąć.',
    'tip-category-nauka':'🧠 Nauka','tip-category-przerwa':'☕ Przerwa','tip-category-sen':'😴 Sen','tip-category-jedzenie':'🥗 Jedzenie','tip-category-produktywnosc':'⚡ Produktywność',
    'settings-title':'Ustawienia timera','settings-focus':'Czas Focus (min)','settings-short':'Short Break (min)','settings-long':'Long Break (min)','settings-rounds':'Rund do Long Break','settings-autostart':'Auto-start kolejnej rundy','settings-save':'Zapisz',
    'stat-streak-none':'—','timer-running':'Pauza','session-complete':'Runda zakończona!','break-tip':'Wskazówka',
  },
  en: {
    skip:'Skip to timer','nav-timer':'Timer','nav-tips':'Tips','nav-github':'GitHub','nav-github-aria':'GitHub (opens in new tab)',
    'sidebar-settings':'Settings','sidebar-theme':'Theme','sidebar-lang':'Language',
    'theme-light':'Light','theme-dark':'Dark',
    'lang-btn':'PL',
    'app-name':'Focus Flow',
    'task-placeholder':'What are you working on?',
    'mode-focus':'Focus','mode-short':'Short Break','mode-long':'Long Break',
    'round-count':'Round 0 / 4',
    'timer-start':'Start','timer-reset':'Reset','timer-settings':'Settings',
    'sound-none':'Off','sound-rain':'Rain','sound-noise':'Noise',
    'sound-upload':'Add sound','sound-choose':'Choose an audio file (max 4 MB)','sound-too-large':'File is too large. Maximum size is 4 MB.','sound-loaded':'Added: {name}','sound-remove':'Remove {name}','sound-unnamed':'My sound',
    'focus-enter':'Enter Focus Mode','focus-exit':'Exit',
    'stat-today':'today','stat-week':'this week','stat-streak':'day streak','stat-minutes':'focus minutes',
    'chart-label':'Focus minutes',
    'tips-label':'Tips','tips-desc':'Practical advice organised by category. Click a category to expand.',
    'tip-category-nauka':'🧠 Learning','tip-category-przerwa':'☕ Break','tip-category-sen':'😴 Sleep','tip-category-jedzenie':'🥗 Food','tip-category-produktywnosc':'⚡ Productivity',
    'settings-title':'Timer Settings','settings-focus':'Focus Time (min)','settings-short':'Short Break (min)','settings-long':'Long Break (min)','settings-rounds':'Rounds until Long Break','settings-autostart':'Auto-start next round','settings-save':'Save',
    'stat-streak-none':'—','timer-running':'Pause','session-complete':'Session complete!','break-tip':'Tip',
  }
}

export function apply(l) {
  lang.current = l; document.documentElement.lang = l; localStorage.setItem('ff_lang', l)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n; if (dict[l][k]) el.textContent = dict[l][k]
  })
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const k = el.dataset.i18nAria; if (dict[l][k]) el.setAttribute('aria-label', dict[l][k])
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.dataset.i18nPlaceholder; if (dict[l][k]) el.setAttribute('placeholder', dict[l][k])
  })
  const curTheme = document.documentElement.getAttribute('data-theme') || 'light'
  themeBtn.textContent = dict[l][curTheme === 'dark' ? 'theme-dark' : 'theme-light']
}
