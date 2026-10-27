/** Local calendar boundaries; no storage, browser or framework dependencies. */
export function weekStartOf(date: Date = new Date()): string {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1))
  return start.toDateString()
}

export function calendarDayNumber(date: Date): number {
  // Civil days, rather than elapsed hours, stay consecutive across DST changes.
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
}
