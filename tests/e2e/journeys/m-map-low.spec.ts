/* The world map on a low tablet (1000x490): the header and the story strip take at most 90 px, no name tag is cut
   at the top edge of the visible area when the map opens, and no two tags overlap. */
import { expect, test } from '@playwright/test'
import { createChildThroughOnboarding } from '../helpers'

test.use({ viewport: { width: 1000, height: 490 } })

test('mapa en pantalla baja: franja ≤ 90 px, nada cortado arriba, etiquetas sin solaparse', async ({ page }) => {
  await createChildThroughOnboarding(page)
  await page.goto('/play/w/w1')
  await expect(page.getByRole('button', { name: /, aquí estás/ })).toBeVisible()
  await page.waitForTimeout(1200)

  const m = await page.evaluate(() => {
    const scroll = document.querySelector<HTMLElement>('[class*="scroll_"], [class*="_scroll"]')!
    const r = scroll.getBoundingClientRect()
    const tags = [...document.querySelectorAll<HTMLElement>('[class*="_tag"]')].map((e) => e.getBoundingClientRect())
    const clipped = tags.filter((b) => b.bottom > r.top && b.top < r.top + 14).length
    let overlaps = 0
    for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i], b = tags[j]
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++
    }
    return { bandBottom: r.top, clipped, overlaps }
  })
  expect(m.bandBottom).toBeLessThanOrEqual(90)
  expect(m.clipped).toBe(0)
  expect(m.overlaps).toBe(0)
})
