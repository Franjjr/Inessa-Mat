/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/** Dev only: serves /api/tts with the same handler Vercel runs, reading the Azure key from .env.local. */
function ttsDevApi(): Plugin {
  return {
    name: 'repasitos-tts-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), 'AZURE_')
      server.middlewares.use('/api/tts', async (req, res) => {
        const { handler } = await server.ssrLoadModule('/api/tts.ts')
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
        const response: Response = await handler(new Request(`http://localhost${req.originalUrl ?? req.url}`, { headers }), env)
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    ttsDevApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'models/**/*', 'icons/*'],
      manifest: {
        name: 'Repasitos · Aventuras matemáticas',
        short_name: 'Repasitos',
        description: 'Aprende las tablas, sumas, restas, multiplicaciones y divisiones jugando.',
        lang: 'es',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#faf5ff',
        theme_color: '#7c3aed',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,bin,mp3,ogg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/dev\//, /^\/api\//],
        // Every natural-voice clip heard is kept, so it plays offline later (immutable per text and character).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/api/tts',
            handler: 'CacheFirst',
            options: {
              cacheName: 'repasitos-voice',
              expiration: { maxEntries: 3000, maxAgeSeconds: 365 * 24 * 3600 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
  },
})
