async function soundPath(id: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id))
  return `sounds/${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')}.bin`
}
export async function writeNativeSound(id: string, blob: Blob): Promise<void> {
  const { mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
  await mkdir('sounds', { baseDir: BaseDirectory.AppData, recursive: true })
  await writeFile(await soundPath(id), new Uint8Array(await blob.arrayBuffer()), { baseDir: BaseDirectory.AppData })
}
export async function readNativeSound(id: string): Promise<Blob | null> {
  const { readFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
  const path = await soundPath(id)
  if (!await exists(path, { baseDir: BaseDirectory.AppData })) return null
  return new Blob([await readFile(path, { baseDir: BaseDirectory.AppData })])
}
export async function removeNativeSound(id: string): Promise<void> {
  const { remove, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
  const path = await soundPath(id)
  if (await exists(path, { baseDir: BaseDirectory.AppData })) await remove(path, { baseDir: BaseDirectory.AppData })
}
