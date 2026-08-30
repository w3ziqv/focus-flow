/// <reference types="vitest/config" />
import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }

const fontPreload = (): Plugin => ({
  name: 'font-preload',
  apply: 'build',
  closeBundle() {
    const htmlPath = 'dist/index.html'
    const fonts = fs
      .readdirSync('dist/assets')
      .filter((f) => f.endsWith('.woff2') && f.startsWith('fraunces-latin-wght'))
    if (fonts.length === 0) return
    const links = fonts
      .map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`)
      .join('')
    const html = fs.readFileSync(htmlPath, 'utf8').replace('</title>', `</title>${links}`)
    fs.writeFileSync(htmlPath, html)
  },
})

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    fontPreload(),
    VitePWA({
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
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,m4a}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
})

