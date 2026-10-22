/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

/** Addresses that may use the dev TTS route (the Azure key is billed to the owner). */
const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/** Dev only: serves /api/tts with the same handler Vercel runs, reading the Azure key from .env.local.
    Only answers requests whose TCP peer is this machine. `npm run dev` passes --host 0.0.0.0 so phones and tablets
    on the Wi-Fi can open the app, which exposes the whole dev server to that network: the route still refuses them
    (they get the device voice), so the Azure key is not spent by other devices on the LAN. Do not remove that check. */
function ttsDevApi(): Plugin {
  return {
    name: 'repasitos-tts-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), 'AZURE_')
      server.middlewares.use('/api/tts', async (req, res) => {
        if (!LOCAL_ADDRESSES.has(req.socket.remoteAddress ?? '')) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Forbidden')
          return
        }
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

const WELCOME_TITLE = 'Repasitos: repasar tablas y operaciones de 7 a 9 años'
const WELCOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'Repasitos', url: 'https://repasitos.es/', inLanguage: 'es-ES' },
    {
      '@type': ['SoftwareApplication', 'EducationalApplication'],
      name: 'Repasitos',
      url: 'https://repasitos.es/welcome',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, iPadOS, Android',
      inLanguage: 'es-ES',
      description: 'Juego de aventuras para que los niños de 7 a 9 años repasen las tablas de multiplicar, sumas, restas y divisiones.',
      audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'Niños de 7 a 9 años' },
      educationalLevel: 'Educación Primaria',
    },
  ],
}

/** Build only: writes welcome.html, the landing with its text already in the HTML (from welcome.static.html), its own
    title and canonical, and structured data, so search engines and AI crawlers that do not run JavaScript read it.
    Vercel serves it for /welcome (vercel.json). With JavaScript the static copy is hidden and React replaces it. */
function prerenderWelcome(): Plugin {
  return {
    name: 'repasitos-prerender-welcome',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') return
      const body = readFileSync(fileURLToPath(new URL('./src/adult/welcome/welcome.static.html', import.meta.url)), 'utf8')
      const html = String(index.source)
        .replace(/<title>[^<]*<\/title>/, `<title>${WELCOME_TITLE}</title>
    <link rel="canonical" href="https://repasitos.es/welcome" />
    <script>document.documentElement.classList.add('js')</script>
    <style>.js .prerender{display:none}.prerender{max-width:760px;margin:0 auto;padding:24px 16px;font:18px/1.5 system-ui,sans-serif;color:#2e1a47}.prerender img{max-width:100%;height:auto}</style>
    <script type="application/ld+json">${JSON.stringify(WELCOME_JSON_LD)}</script>`)
        .replace(/(<div id="root">)/, `$1${body}`)
      this.emitFile({ type: 'asset', fileName: 'welcome.html', source: html })
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
    prerenderWelcome(),
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
        // The link-preview image is for social networks, not for the app: no need to download it with the app.
        globIgnores: ['og/**', '404.html'],
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
