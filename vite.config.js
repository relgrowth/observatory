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
        name: 'Story Shack Observatory',
        short_name: 'Observatory',
        description: 'See your story as a living constellation.',
        id: '/', start_url: '/', scope: '/', display: 'standalone', orientation: 'any',
        theme_color: '#ffffff', background_color: '#ffffff', lang: 'en',
        categories: ['productivity', 'education', 'entertainment'],
        icons: [72, 96, 128, 144, 152, 180, 192, 384, 512].map((size) => ({ src: `icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })).concat([
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-mono-512.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
        ]),
        shortcuts: [{ name: 'New observatory', short_name: 'New', url: '/?create=true', icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }] }],
        screenshots: [
          { src: 'screenshots/observatory-basic-1440x900.jpg', sizes: '1440x900', type: 'image/jpeg', form_factor: 'wide', label: 'Arrange story ideas as a connected constellation.' },
          { src: 'screenshots/observatory-charcoal-1440x900.jpg', sizes: '1440x900', type: 'image/jpeg', form_factor: 'wide', label: 'Explore story flow in Observatory’s Charcoal workspace.' },
          { src: 'screenshots/observatory-mobile-390x844.jpg', sizes: '390x844', type: 'image/jpeg', form_factor: 'narrow', label: 'Review and edit story elements on mobile.' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'],
        navigateFallback: '/index.html', skipWaiting: false, clientsClaim: false, cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { preserveSymlinks: true, alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true, port: 5182 },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.js'], include: ['tests/unit/**/*.test.js'] },
  build: { rollupOptions: { output: { manualChunks: { vue: ['vue','pinia','vue-router','vue-i18n'], canvas: ['@vue-flow/core','@vue-flow/background','@vue-flow/controls','@vue-flow/minimap'], export: ['jszip','dom-to-image-more'], validation: ['ajv'] } } } },
})
