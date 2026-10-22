#!/usr/bin/env node
/*
 Screenshot a route of the running dev server (http://localhost:5173 by default) on tablet/desktop viewports.

   node tools/shot.mjs <path> <out.png> [--device ipad|ipad-portrait|android|desktop|phone] [--wait 800]
                        [--full] [--seed] [--eval "js"] [--click "css selector"] [--base http://localhost:5173]

   --seed   calls window.__numeriaDev.seed() (dev helper from src/data) to create a demo child, then reloads
   --eval   runs JS in the page after load (e.g. to set state), then waits again
   --click  clicks a selector after load (repeatable)
 Prints console errors from the page so you notice runtime crashes.
*/
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const pos = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').match(/^--(device|wait|eval|click|base)$/))
const [route = '/', out = 'shot.png'] = pos
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const flag = (name) => args.includes(`--${name}`)
const clicks = args.flatMap((a, i) => (a === '--click' ? [args[i + 1]] : []))

const DEVICES = {
  ipad: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15' },
  'ipad-portrait': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false },
  android: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
}

const device = DEVICES[opt('device', 'ipad')] ?? DEVICES.ipad
const base = opt('base', 'http://localhost:5173')
const wait = Number(opt('wait', '900'))

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ctx = await browser.newContext({ ...device, locale: 'es-ES' })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto(base + route, { waitUntil: 'networkidle' })
if (flag('seed')) {
  await page.evaluate(async () => { await window.__numeriaDev?.seed?.() })
  await page.goto(base + route, { waitUntil: 'networkidle' })
}
const ev = opt('eval', null)
if (ev) { await page.evaluate(ev); await page.waitForTimeout(300) }
for (const sel of clicks) { await page.click(sel); await page.waitForTimeout(300) }
await page.waitForTimeout(wait)
await page.screenshot({ path: out, fullPage: flag('full') })
console.log('saved', out)
await browser.close()
