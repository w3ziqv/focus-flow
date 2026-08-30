import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if (import.meta.env.DEV) {
  void import('react-scan').then(({ scan }) => {
    scan({ enabled: true })
  })
}

// iOS Safari ignores user-scalable=no — block pinch zoom via gesture events
document.addEventListener('gesturestart', (event) => event.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
