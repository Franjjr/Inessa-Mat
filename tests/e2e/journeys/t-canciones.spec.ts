/* Canciones de las tablas: Jugar → «La canción del 7» → ¡A cantar! → ¡Ir a mi turno! → the right bubbles → a star.
   The demo child Lía (3.º). Headless Chromium has no voices: the voice resolves quickly, the song still runs. */
import { expect, test, type Page } from '@playwright/test'
import { seedDemo, settle } from '../helpers'

async function singTheSeven(page: Page) {
  await page.goto('/play/free')
  await expect(page.getByRole('heading', { name: 'Canciones' })).toBeVisible()
  await page.getByRole('button', { name: /^La canción del 7,/ }).click()
  await page.getByRole('button', { name: /¡A cantar!/ }).click()
  await page.getByRole('button', { name: '¡Ir a mi turno!' }).click()
  const done = page.getByText('¡Tabla del 7 cantada!')
  for (let i = 0; i < 12 && !(await done.isVisible()); i++) {
    const ask = page.getByTestId('song-ask')
    await expect(ask.or(done)).toBeVisible({ timeout: 30_000 })
    if (await done.isVisible()) break
    const m = /(\d+) × (\d+)/.exec((await ask.textContent()) ?? '')!
    const bubble = page.getByRole('group', { name: 'Elige el resultado' }).getByRole('button', { name: String(Number(m[1]) * Number(m[2])), exact: true })
    await expect(bubble).toBeInViewport()
    await bubble.click()
    await expect(ask).toBeHidden({ timeout: 30_000 }).catch(() => undefined)
  }
  await expect(done).toBeVisible({ timeout: 30_000 })
}

test.describe('Canciones de las tablas', () => {
  test.setTimeout(180_000)

  test('sing the 7: the right bubbles give a star', async ({ page }) => {
    await seedDemo(page)
    await singTheSeven(page)
    await expect(page.getByRole('img', { name: /1 de 3 estrellas/ }).or(page.getByLabel('1 de 3 estrellas'))).toBeVisible()
    await page.getByRole('button', { name: 'Seguir' }).click()
    await expect(page.getByRole('button', { name: /^La canción del 7, 1 de 3 estrellas/ })).toBeVisible()
    await settle(page, 200)
  })

  test('on a small phone both rounds fit without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await seedDemo(page)
    await page.goto('/play/cancion/7')
    await page.getByRole('button', { name: /¡A cantar!/ }).click()
    const noScroll = async () => {
      const over = await page.evaluate(() => {
        const els = [document.scrollingElement!, ...document.querySelectorAll<HTMLElement>('*')]
        return els.filter((el) => {
          const st = el === document.scrollingElement ? null : getComputedStyle(el)
          const scrolls = !st || /(auto|scroll)/.test(st.overflowY)
          return scrolls && el.scrollHeight > el.clientHeight + 1
        }).length
      })
      expect(over).toBe(0)
    }
    // Round 1: the verse sounding is on screen and nothing scrolls, even late in the song (5 verses at a time).
    const now = page.locator('li[data-state="now"]')
    await expect(now).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('7 × 4 = 28')).toBeVisible({ timeout: 60_000 })
    await expect(now).toBeInViewport({ ratio: 0.98 })
    await noScroll()
    // Round 2: the question and the three bubbles, too.
    await page.getByRole('button', { name: '¡Ir a mi turno!' }).click()
    const group = page.getByRole('group', { name: 'Elige el resultado' })
    await expect(group).toBeVisible({ timeout: 60_000 })
    for (const b of await group.getByRole('button').all()) await expect(b).toBeInViewport({ ratio: 0.98 })
    await expect(page.getByTestId('song-ask')).toBeInViewport({ ratio: 0.98 })
    await expect(now).toBeInViewport({ ratio: 0.98 })
    await noScroll()
  })
})
