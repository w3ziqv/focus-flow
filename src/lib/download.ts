/**
 * Client-Side Zero-Network File Download Trigger (v2.4)
 *
 * Triggers an instant in-memory browser download via an ephemeral anchor element.
 * Adheres strictly to the Local-First Data Sovereignty Doctrine (ADR-005).
 */

export function triggerDownload(filename: string, content: string | Blob, mimeType: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Delay revoke to allow browser time to initiate the download stream
  window.setTimeout(() => {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url)
    }
  }, 1000)
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  triggerDownload(filename, blob, blob.type || 'application/octet-stream')
}

export function triggerTextDownload(content: string, filename: string, mimeType: string): void {
  triggerDownload(filename, content, mimeType)
}
