import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {readdir, writeFile} from 'node:fs/promises'
import {join, relative} from 'node:path'
const root = process.argv[2] ?? 'src-tauri/target/release/bundle'
async function files(dir) {
  const entries = await readdir(dir, {withFileTypes: true})
  const result = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await files(path))
    else if (/\.(deb|AppImage|exe|msi|dmg)$/.test(entry.name)) result.push(path)
  }
  return result
}
const installers = (await files(root)).sort()
if (!installers.length) throw Error('No installers were built; refusing an empty checksum manifest')
const lines = []
for (const path of installers) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  lines.push(`${hash.digest('hex')}  ${relative(root, path).replaceAll('\\', '/')}`)
}
await writeFile(join(root, 'SHA256SUMS.txt'), lines.join('\n') + '\n')
console.log(`SHA-256 manifest generated for ${installers.length} installer(s). Publisher signatures are not provided.`)
