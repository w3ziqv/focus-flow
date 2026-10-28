/// <reference types="vitest/config" />
import fs from 'node:fs'
import { LANGUAGE_CODES, isLang } from './src/domain/language'
import { manifestForLanguage } from './src/lib/pwaManifest'
import { defineConfig, type Plugin, type UserConfig, type UserConfigExport } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }

const fontPreload = (outDir: string): Plugin => ({
  name: 'font-preload',
  apply: 'build',
  closeBundle() {
    const htmlPath = `${outDir}/index.html`
    const fonts = fs
      .readdirSync(`${outDir}/assets`)
      .filter((f) => f.endsWith('.woff2') && f.startsWith('fraunces-latin-wght'))
    if (fonts.length === 0) return
    const links = fonts
      .map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`)
      .join('')
    const html = fs.readFileSync(htmlPath, 'utf8').replace('</title>', `</title>${links}`)
    fs.writeFileSync(htmlPath, html)
  },
})

const localizedManifests = (): Plugin => ({
  name: 'localized-manifests',
  generateBundle() {
    for (const lang of LANGUAGE_CODES) this.emitFile({ type: 'asset', fileName: `manifest-${lang}.webmanifest`, source: JSON.stringify(manifestForLanguage(lang)) })
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const match = /^\/manifest-([a-z]+)\.webmanifest$/.exec(req.url ?? '')
      if (!match || !isLang(match[1])) { next(); return }
      res.setHeader('Content-Type', 'application/manifest+json')
      res.end(JSON.stringify(manifestForLanguage(match[1])))
    })
  },
})

const config: UserConfigExport = defineConfig(({ mode }): UserConfig => {
  const desktop = mode === 'desktop'
  const outDir = desktop ? 'dist-desktop' : 'dist'
  return {
    build: { outDir },
    server: {
      ...(desktop ? { port: 1420, strictPort: true } : {}),
      // The other build target and test evidence must not reload an active app.
      watch: { ignored: ['**/dist/**', '**/dist-desktop/**', '**/src-tauri/target/**', '**/test-artifacts/**'] },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      desktop && {
        name: 'desktop-csp',
        transformIndexHtml: (html: string) => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, ''),
      },
      tailwindcss(),
      fontPreload(outDir),
      !desktop && localizedManifests(),
      !desktop && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
        manifest: manifestForLanguage('en'),
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}', 'sounds/moodist/*.{mp3,txt,json}'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    test: {
      // Keep local evidence and old acceptance scripts out of automatic discovery.
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      // Audio stress suites allocate large buffers; bound workers on many-core hosts.
      maxWorkers: 4,
    },
  }
})

export default config
