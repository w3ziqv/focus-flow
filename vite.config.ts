/// <reference types="vitest/config" />
import fs from 'node:fs'
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

const config: UserConfigExport = defineConfig(({ mode }): UserConfig => {
  const desktop = mode === 'desktop'
  const outDir = desktop ? 'dist-desktop' : 'dist'
  return {
    build: { outDir },
    server: desktop ? { port: 1420, strictPort: true } : undefined,
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
      !desktop && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
        manifest: {
          name: 'Focus Flow',
          short_name: 'Focus Flow',
          description: 'A quiet Pomodoro focus timer with ambient sound, stats, and a warm editorial interface.',
          theme_color: '#f5f4ed',
          background_color: '#f5f4ed',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          start_url: '/',
          id: '/',
          lang: 'pl',
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          screenshots: [
            {
              src: 'screenshots/desktop.png',
              sizes: '1280x800',
              type: 'image/png',
              form_factor: 'wide',
              label: 'The Focus Flow dial on desktop',
            },
            {
              src: 'screenshots/mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'The Focus Flow dial on a phone',
            },
          ],
          shortcuts: [
            { name: 'Start Focus', short_name: 'Focus', url: '/?start=focus', description: 'Start a focus session right away' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}', 'sounds/moodist/*.{mp3,txt,json}'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      // Audio stress suites allocate large buffers; bound workers on many-core hosts.
      maxWorkers: 4,
    },
  }
})

export default config
