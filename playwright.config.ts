/* Playwright config for the Numeria end-to-end suite (tests/e2e/**).

   Run:          npx playwright test                 (reuses the dev server on :5173 when it is up)
   Other host:   E2E_BASE_URL=https://staging.example npx playwright test   (no web servers are started)
   Offline spec: served from a production build on :4173 (E2E_OFFLINE_BASE overrides it).

   Projects mirror the target devices: iPad landscape/portrait (touch), Android tablet (mobile, touch) and desktop. */
import { defineConfig } from '@playwright/test'

const external = !!process.env.E2E_BASE_URL
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const OFFLINE_BASE = process.env.E2E_OFFLINE_BASE ?? 'http://localhost:4173'
const executablePath = process.env.CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 180_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: BASE,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: executablePath ? { executablePath } : {},
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'ipad',
      use: {
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
        isMobile: false,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'ipad-portrait',
      use: {
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
        isMobile: false,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'android',
      use: {
        viewport: { width: 1280, height: 800 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1.5,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    },
    {
      name: 'desktop',
      use: {
        viewport: { width: 1440, height: 900 },
        hasTouch: false,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: external
    ? undefined
    : [
        {
          command: 'npx vite --port 5173 --strictPort',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'npx vite build && npx vite preview --port 4173 --strictPort',
          url: OFFLINE_BASE,
          reuseExistingServer: true,
          timeout: 300_000,
        },
      ],
})
