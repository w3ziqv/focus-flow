const RELOAD_MARKER = 'ff3_chunk_reload'

/** Recover a retired deployment chunk once per entry bundle, without reload loops. */
export function installChunkRecovery(
  buildId: string,
  reload: () => void = () => window.location.reload(),
): () => void {
  const recover = () => {
    if (!navigator.onLine) return
    try {
      if (sessionStorage.getItem(RELOAD_MARKER) === buildId) return
      sessionStorage.setItem(RELOAD_MARKER, buildId)
    } catch {
      // Without a durable guard, prefer the manual retry over a possible loop.
      return
    }
    // Leave the rejected import intact so the boundary can offer manual retry
    // if reloading is unavailable. Never clear application storage or SW caches.
    reload()
  }
  window.addEventListener('vite:preloadError', recover)
  return () => window.removeEventListener('vite:preloadError', recover)
}
