import { useCallback, useState } from 'react'

export type AppDialog = 'app' | 'shortcuts' | 'timer' | 'sound' | 'cloud'
export interface DialogStack {
  stack: AppDialog[]
  close: () => void
  openApp: () => void
  openTimer: () => void
  openSound: () => void
  openCloud: () => void
  openShortcuts: () => void
  desktopPreferences: (show: boolean) => void
}

/** Parents remain mounted so a child dialog cannot discard their local draft. */
export function useDialogStack(): DialogStack {
  const [stack, setStack] = useState<AppDialog[]>([])
  const open = useCallback((dialog: AppDialog) => {
    setStack(current => current.includes(dialog) ? current : [...current, dialog])
  }, [])
  const close = useCallback(() => setStack(current => current.slice(0, -1)), [])
  const openApp = useCallback(() => open('app'), [open])
  const openTimer = useCallback(() => open('timer'), [open])
  const openSound = useCallback(() => open('sound'), [open])
  const openCloud = useCallback(() => open('cloud'), [open])
  const openShortcuts = useCallback(() => open('shortcuts'), [open])
  const desktopPreferences = useCallback((show: boolean) => { if (show) open('app') }, [open])
  return { stack, close, openApp, openTimer, openSound, openCloud, openShortcuts, desktopPreferences }
}
