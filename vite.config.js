import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'Observatory',
        short_name: 'Observatory',
        description: 'Build dungeons, villages, wilderness, and world maps one tile at a time.',
        id: '/', start_url: '/', scope: '/', display: 'standalone', orientation: 'any',
        theme_color: '#ffffff', background_color: '#ffffff', lang: 'en',
        categories: ['productivity', 'education', 'entertainment'],
        icons: [72, 96, 128, 144, 152, 180, 192, 384, 512].map((size) => ({ src: `icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })).concat([
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-mono-512.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
        ]),
        shortcuts: [{ name: 'New map', short_name: 'New', url: '/?create=true', icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }] }],
        screenshots: [
          { src: 'screenshots/observatory-basic-1440x900.jpg', sizes: '1440x900', type: 'image/jpeg', form_factor: 'wide', label: 'A lone tower rises from a dense hand-painted forest.' },
          { src: 'screenshots/observatory-charcoal-1440x900.jpg', sizes: '1440x900', type: 'image/jpeg', form_factor: 'wide', label: 'Explore the abandoned tower map in the Charcoal workspace.' },
          { src: 'screenshots/observatory-mobile-390x844.jpg', sizes: '390x844', type: 'image/jpeg', form_factor: 'narrow', label: 'Edit the forest tower map on mobile.' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,webp,svg,woff2}'],
        navigateFallback: '/index.html', skipWaiting: false, clientsClaim: false, cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { preserveSymlinks: true, alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true, port: 5182 },
  test: {
    environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.js'], include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8', reporter: ['text','html'], include: ['src/{constants,data,services,stores}/**/*.js'],
      thresholds: { statements: 65, branches: 60, functions: 60, lines: 65 },
    },
  },
  build: { rollupOptions: { output: { manualChunks: { vue: ['vue','pinia','vue-router','vue-i18n'], export: ['jszip'], validation: ['ajv'] } } } },
})
