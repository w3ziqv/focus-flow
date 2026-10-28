import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeDesktopStorage, nativeInvoke } from './lib/desktop/runtime'
import { initializeNativeNotifications } from './lib/notifications'
import { installChunkRecovery } from './lib/chunkRecovery'
import { detectPlatform } from './lib/platform'
import { ApplicationBoundary } from './app/ApplicationBoundary'
import { recoveryLanguage } from './lib/recoveryLanguage'
import { translate } from './lib/translations'
import { LANGUAGE_META } from './domain/language'

if (detectPlatform() !== 'tauri') installChunkRecovery(import.meta.url)

async function mount(): Promise<void> {
  const root = document.getElementById('root')!
  try {
    await initializeDesktopStorage()
    await initializeNativeNotifications()
    const Component = new URLSearchParams(location.search).has('mini')
      ? (await import('./features/desktop/MiniDial')).default
      : (await import('./App')).default
    createRoot(root).render(<StrictMode><ApplicationBoundary><Component /></ApplicationBoundary></StrictMode>)
  } catch {
    const lang = recoveryLanguage()
    document.documentElement.lang = LANGUAGE_META[lang].htmlLang
    const panel = document.createElement('div')
    panel.className = 'mx-auto max-w-xl p-8 text-ink'
    panel.setAttribute('role', 'alert')
    const heading = document.createElement('h1')
    heading.textContent = translate(lang, 'recovery.appTitle')
    const detail = document.createElement('p')
    detail.textContent = translate(lang, 'recovery.appDetail')
    const retry = document.createElement('button')
    retry.className = 'm-2 min-h-11 rounded-full border px-5'
    retry.textContent = translate(lang, 'recovery.retry')
    retry.onclick = () => location.reload()
    const restore = document.createElement('button')
    restore.className = retry.className
    restore.textContent = translate(lang, 'recovery.restore')
    restore.onclick = () => { void nativeInvoke('restore_data').then(() => location.reload()).catch(() => { detail.textContent = translate(lang, 'recovery.restoreFailed') }) }
    panel.append(heading, detail, retry)
    if (detectPlatform() === 'tauri') panel.append(restore)
    root.replaceChildren(panel)
  }
}
void mount()
