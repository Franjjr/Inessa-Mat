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
    const scroll = document.querySelector<HTMLElement>('[class*="_scroll_"]')!
    const r = scroll.getBoundingClientRect()
    const tags = [...document.querySelectorAll<HTMLElement>('[class*="_tag"]')].map((e) => e.getBoundingClientRect())
    const clipped = tags.filter((b) => b.bottom > r.top && b.top < r.top + 14).length
    let overlaps = 0
    for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i], b = tags[j]
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++
    }
    // Tags against icons, and touching the centre of a name must land inside a stop button.
    const badges = [...document.querySelectorAll<HTMLElement>('[class*="_badge_"]')].map((e) => e.getBoundingClientRect())
    let tagOnIcon = 0
    for (const a of tags) for (const b of badges) {
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) tagOnIcon++
    }
    let untouchable = 0
    for (const e of document.querySelectorAll<HTMLElement>('[class*="_tag"]')) {
      const b = e.getBoundingClientRect()
      const cx = b.left + b.width / 2
      const cy = b.top + b.height / 2
      if (cy < r.top || cy > r.bottom) continue
      if (!document.elementFromPoint(cx, cy)?.closest('button')) untouchable++
    }
    return { bandBottom: r.top, clipped, overlaps, tagOnIcon, untouchable }
  })
  expect(m.bandBottom).toBeLessThanOrEqual(90)
  expect(m.clipped).toBe(0)
  expect(m.overlaps).toBe(0)
  expect(m.tagOnIcon).toBe(0)
  expect(m.untouchable).toBe(0)
})
