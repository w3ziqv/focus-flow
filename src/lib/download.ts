import { detectPlatform } from './platform'

async function nativeDownload(filename: string, content: string | Blob, mimeType: string): Promise<void> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')
  const path = await save({ defaultPath: filename })
  if (!path) return
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()))
}

/**
 * Triggers an in-memory browser file download via an ephemeral anchor element.
 */

export function triggerDownload(filename: string, content: string | Blob, mimeType: string): void {
  if (detectPlatform() === 'tauri') {
    void nativeDownload(filename, content, mimeType).catch(error => window.dispatchEvent(new CustomEvent('focus-flow:persistence', { detail: String(error) })))
    return
  }
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
