import type { JSX } from 'react'

interface A11yLiveAnnouncerProps {
  message: string | null
}

/**
 * Screen-reader-only live region for non-visual polite announcements
 * of timer state changes, interval transitions, and round advances.
 */
export function A11yLiveAnnouncer({ message }: A11yLiveAnnouncerProps): JSX.Element {
  return (
    <div
      id="a11y-live-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message ?? ''}
    </div>
  )
}
