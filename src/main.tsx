import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeDesktopStorage, nativeInvoke } from './lib/desktop/runtime'
import { initializeNativeNotifications } from './lib/notifications'
import { installChunkRecovery } from './lib/chunkRecovery'
import { detectPlatform } from './lib/platform'
import { ApplicationBoundary } from './components/ApplicationBoundary'

if (detectPlatform() !== 'tauri') installChunkRecovery(import.meta.url)

// iOS Safari ignores user-scalable=no — block pinch zoom via gesture events
document.addEventListener('gesturestart', (event) => event.preventDefault())

async function mount(): Promise<void> {
  const root = document.getElementById('root')!
  try {
    await initializeDesktopStorage()
    await initializeNativeNotifications()
    const Component = new URLSearchParams(location.search).has('mini')
      ? (await import('./components/MiniDial')).default
      : (await import('./App')).default
    createRoot(root).render(<StrictMode><ApplicationBoundary><Component /></ApplicationBoundary></StrictMode>)
  } catch {
    const polish = navigator.language.startsWith('pl')
    const panel = document.createElement('div')
    panel.className = 'mx-auto max-w-xl p-8 text-ink'
    panel.setAttribute('role', 'alert')
    const heading = document.createElement('h1')
    heading.textContent = polish ? 'Nie udało się otworzyć aplikacji' : 'Could not open the application'
    const detail = document.createElement('p')
    detail.textContent = polish ? 'Zapisane dane nie zostały usunięte. Spróbuj wczytać aplikację ponownie.' : 'Your saved data has not been removed. Try reloading the application.'
    const retry = document.createElement('button')
    retry.className = 'm-2 min-h-11 rounded-full border px-5'
    retry.textContent = polish ? 'Spróbuj ponownie' : 'Try again'
    retry.onclick = () => location.reload()
    const restore = document.createElement('button')
    restore.className = retry.className
    restore.textContent = polish ? 'Przywróć ostatnią kopię' : 'Restore last backup'
    restore.onclick = () => { void nativeInvoke('restore_data').then(() => location.reload()).catch(() => { detail.textContent = polish ? 'Nie udało się przywrócić kopii. Spróbuj ponownie.' : 'Could not restore the backup. Try again.' }) }
    panel.append(heading, detail, retry)
    if (detectPlatform() === 'tauri') panel.append(restore)
    root.replaceChildren(panel)
  }
}
void mount()
