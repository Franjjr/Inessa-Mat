/* Todo el ancho (Task 6b): on a wide screen the child screens use the width that is available, minus the page gutter
   (48 px at 1920). On a phone nothing scrolls sideways. Only the desktop project runs the wide checks. */
import { expect, test, type Page } from '@playwright/test'
import { seedDemo, settle } from '../helpers'

const GUTTER = 48

/** Horizontal span of the page body: from the left edge of the leftmost to the right edge of the rightmost visible
 *  text, control or panel (a box with a border or a background, narrower than the screen) in main, below the page title.
 *  Fixed or sticky bars (the world bar), the title row and the contents of sideways-scrolling strips are left out, so
 *  they cannot make a narrow body look wide. The session's progress bar is not content either. */
async function contentSpan(page: Page): Promise<number> {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return 0
    const ancestorsWithin = (el: HTMLElement) => {
      const list: HTMLElement[] = []
      for (let n: HTMLElement | null = el.parentElement; n && n !== main; n = n.parentElement) list.push(n)
      return list
    }
    const pinned = (el: HTMLElement) =>
      ancestorsWithin(el).some((n) => ['fixed', 'sticky'].includes(getComputedStyle(n).position))
    const sideScroll = (el: HTMLElement) =>
      ancestorsWithin(el).some((n) => n.scrollWidth > n.clientWidth + 1 && /auto|scroll|hidden/.test(getComputedStyle(n).overflowX))
    const title = main.querySelector('h1')?.getBoundingClientRect()
    const top = title ? title.bottom : 0
    let left = Infinity
    let right = -Infinity
    const panel = (el: HTMLElement) => {
      const cs = getComputedStyle(el)
      return parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')
    }
    for (const el of main.querySelectorAll<HTMLElement>('h2,h3,p,button,a,li,img,div,section,article,ol,ul')) {
      const r = el.getBoundingClientRect()
      const isPanel = el.matches('div,section,article,ol,ul') && panel(el) && r.width < window.innerWidth - 2
      if (el.matches('div,section,article,ol,ul') && !isPanel) continue
      if (r.width === 0 || r.height === 0 || r.top < top || pinned(el) || sideScroll(el) || el.closest('[role=progressbar]')) continue
      left = Math.min(left, r.left)
      right = Math.max(right, r.right)
    }
    return right - left
  })
}

const LIST_ROUTES = ['/play', '/play/free', '/play/premios', '/play/album', '/play/shop', '/kids']

test.describe('wide screens use the full width', () => {
  test.describe('1920 × 1080', () => {
    test.use({ viewport: { width: 1920, height: 1080 } })
    test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'wide checks run on the desktop project only'))

    for (const route of LIST_ROUTES) {
      test(`${route} fills the width`, async ({ page }) => {
        await seedDemo(page)
        await page.goto(route)
        await settle(page, 400)
        // Mis premios: the prize grid is the full-width container (its tiles are capped and centred), so measure the grid.
        const width = route === '/play/premios'
          ? await page.locator('main > div').first().evaluate((el) => el.getBoundingClientRect().width)
          : await contentSpan(page)
        expect(width).toBeGreaterThanOrEqual(1920 - 2 * GUTTER - 2)
      })
    }

    test('/play/sesion: the intro fills the width', async ({ page }) => {
      await seedDemo(page)
      await page.goto('/play/sesion')
      await expect(page.getByText(/Hoy aprendemos/)).toBeVisible()
      expect(await contentSpan(page)).toBeGreaterThanOrEqual(1920 - 2 * GUTTER - 2)
    })

    test('/play/sesion: the first exercise fills the width', async ({ page }) => {
      await seedDemo(page)
      await page.goto('/play/sesion')
      await page.getByRole('button', { name: '¡Empezar!' }).click()
      await expect(page.getByText('Calentamiento', { exact: true })).toBeVisible()
      await settle(page, 400)
      expect(await contentSpan(page)).toBeGreaterThanOrEqual(1920 - 2 * GUTTER - 2)
    })
  })

  test.describe('390 × 844', () => {
    test.use({ viewport: { width: 390, height: 844 } })
    test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'run on the desktop project only'))

    for (const route of [...LIST_ROUTES, '/play/sesion']) {
      test(`${route} does not scroll sideways`, async ({ page }) => {
        await seedDemo(page)
        await page.goto(route)
        await settle(page, 400)
        const { scroll, width } = await page.evaluate(() => ({
          scroll: document.scrollingElement!.scrollWidth,
          width: document.documentElement.clientWidth,
        }))
        expect(scroll).toBe(width)
      })
    }
  })
})
