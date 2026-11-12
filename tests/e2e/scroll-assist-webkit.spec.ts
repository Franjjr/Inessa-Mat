/* The scroll assistant in WebKit (Safari, iPad). The projects of playwright.config.ts are all Chromium, and WebKit clamps the
   scroll on a forced layout of a shorter page: reading the page height without the spacer (ScrollAssist.contentHeight) made
   the page jump up every time it reached the bottom, so the end of the page (and the room the spacer keeps free under
   «⬆») was never reached (seen on the album at 1000 × 490: scrollY 74 of 84). Here a real WebKit, at 1000 × 490 with a
   finger, goes to the end of pages that scroll and must stay there; «⬇ Más abajo» must take the child there too.
   Runs once (in the desktop project, which only drives its own WebKit), skipped when Playwright's WebKit is not installed
   (npx playwright install webkit).
   Run: E2E_BASE_URL=http://localhost:<port> npx playwright test tests/e2e/scroll-assist-webkit.spec.ts --project=desktop */
import { expect, test, webkit, type Browser, type Page } from '@playwright/test'
import { devFlag, seedDemo } from './helpers'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

async function launch(): Promise<Browser | null> {
  try {
    return await webkit.launch()
  } catch {
    return null
  }
}

/** Scroll position, the largest one the page allows and whether the assistant's spacer is there. */
const where = (page: Page) => page.evaluate(() => {
  const el = document.scrollingElement ?? document.documentElement
  return { y: Math.round(window.scrollY), max: Math.round(el.scrollHeight - window.innerHeight), spacer: !!document.querySelector('[data-scroll-spacer]') }
})

/** Goes to the end of the page and checks, over several checks of the assistant (twice a second), that it stays there. */
async function staysAtTheEnd(page: Page, what: string): Promise<void> {
  const { max } = await where(page)
  expect(max, `${what}: la página no se desplaza`).toBeGreaterThan(0)
  await page.evaluate((top) => window.scrollTo(0, top), max)
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(500)
    const w = await where(page)
    expect(w.spacer, `${what}: sin espaciador`).toBe(true)
    expect(w.y, `${what}: la página saltó hacia arriba (scrollY ${w.y} de ${w.max})`).toBe(w.max)
  }
}

test.describe('ScrollAssist en WebKit (Safari, iPad)', () => {
  test('P6: al final de la página se queda al final, y «Más abajo» llega hasta allí', async ({}, info) => {
    test.skip(info.project.name !== 'desktop', 'una vez, en su propio WebKit')
    test.setTimeout(180_000)
    const browser = await launch()
    test.skip(!browser, 'WebKit de Playwright no está instalado')
    try {
      const context = await browser!.newContext({ baseURL: BASE, viewport: { width: 1000, height: 490 }, hasTouch: true, locale: 'es-ES' })
      const page = await context.newPage()
      await seedDemo(page)
      await devFlag(page, 'placement')
      await devFlag(page, 'placementLengua')

      // The album overflows the window by a little: the spacer closes the page, and taking it out shortens the page.
      await page.goto('/play/album')
      await page.waitForTimeout(1500)
      await staysAtTheEnd(page, 'álbum')

      // A long page: «⬇ Más abajo» takes the child to the end and the page stays there.
      await page.goto('/play/free')
      await page.waitForTimeout(1500)
      const down = page.getByRole('button', { name: 'Ver lo de abajo' })
      await expect(down).toBeVisible()
      const box = (await down.boundingBox())!
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      await expect.poll(async () => { const w = await where(page); return w.max - w.y }, { timeout: 5_000 }).toBe(0)
      await staysAtTheEnd(page, 'juego libre')
      await expect(down).toBeHidden()
      await context.close()
    } finally {
      await browser?.close()
    }
  })
})
