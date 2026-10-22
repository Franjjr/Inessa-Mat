/* Journey B: a new child opens world 1 from home, plays the first nodes (a story, a lesson, an activity answered
   with the keyboard), collects the reward and sees progress on the map (done nodes and stars). */
import { expect, test, type Page } from '@playwright/test'
import {
  answerFor, continueFromReward, createChildThroughOnboarding, settle, tapButton, tapStoryUntilButton, typeAnswer, UNCOUNTED,
} from '../helpers'

/** Plays a lesson from its first step to the end. Plain steps advance with "Siguiente ›"; "try it yourself" steps
 *  are answered the way a child would: tap every object to count it, then write the total on the keyboard. */
async function playLesson(page: Page): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const last = page.getByRole('button', { name: '¡Lo he entendido!' })
    if (await last.isVisible().catch(() => false)) {
      await last.click()
      return
    }
    const next = page.getByRole('button', { name: 'Siguiente ›' })
    if (await next.isEnabled().catch(() => false)) {
      await next.click()
      await settle(page, 350)
      continue
    }
    const toCount = page.locator(UNCOUNTED)
    const total = await toCount.count()
    if (total > 0) {
      for (let k = 0; k < total; k++) {
        await page.locator(UNCOUNTED).first().click()
        await settle(page, 120)
      }
      const field = page.getByRole('textbox').first()
      if (await field.isVisible().catch(() => false)) await typeAnswer(page, field, total)
      await settle(page, 500)
      continue
    }
    const inline = page.getByRole('button', { name: 'Siguiente →' })
    if (await inline.isVisible().catch(() => false)) {
      await inline.click()
      await settle(page, 350)
      continue
    }
    await settle(page, 600)
  }
  throw new Error('lesson did not finish')
}

/** Plays the groups activity (six rounds) to its reward. Each round: tap the objects into groups, press
 *  "¡Ya están!", write the total on the keyboard (the number of groups times the objects per group), "Siguiente →". */
async function playGroupsActivity(page: Page): Promise<void> {
  for (let i = 0; i < 400; i++) {
    if (await page.getByRole('button', { name: '¡Seguir!' }).isVisible().catch(() => false)) return
    const inline = page.getByRole('button', { name: 'Siguiente →' })
    if (await inline.isVisible().catch(() => false)) {
      await inline.click()
      await settle(page, 300)
      continue
    }
    const token = page.locator('button[aria-label$="sin colocar"]').first()
    if (await token.isVisible().catch(() => false)) {
      await token.click()
      await settle(page, 100)
      continue
    }
    const done = page.getByRole('button', { name: /Ya están/ })
    if (await done.isVisible().catch(() => false)) {
      await done.click()
      await settle(page, 200)
      continue
    }
    const counted = page.locator(UNCOUNTED).first()
    if (await counted.isVisible().catch(() => false)) {
      await counted.click()
      await settle(page, 100)
      continue
    }
    const field = page.getByRole('textbox').first()
    if (await field.isVisible().catch(() => false) && (await field.inputValue().catch(() => '')) === '' ) {
      const text = (await page.locator('p').filter({ hasText: /grupos de|Producto|total/i }).first().textContent().catch(() => '')) ?? ''
      const m = text.match(/(\d+) grupos de (\d+)/)
      const aria = (await field.getAttribute('aria-label')) ?? ''
      const value = m ? Number(m[1]) * Number(m[2]) : answerFor(aria)
      if (value === null) throw new Error(`cannot solve the groups prompt: "${text}" / "${aria}"`)
      await typeAnswer(page, field, value)
      await settle(page, 300)
      continue
    }
    await settle(page, 300)
  }
  throw new Error('groups activity did not reach the reward')
}

test.describe('B · primeros nodos del Bosque de los Grupos', () => {
  test('historia, lección y actividad con teclado → recompensa → el mapa muestra progreso', async ({ page }) => {
    await createChildThroughOnboarding(page)

    // Home → world 1 map.
    await page.getByRole('button', { name: /^Bosque/ }).first().click()
    await expect(page).toHaveURL(/\/play\/w\/w1$/)
    await expect(page.getByRole('button', { name: /Las lianas de las hadas/ })).toBeVisible()

    // Node 1: story.
    await page.getByRole('button', { name: /Las lianas de las hadas/ }).click()
    await expect(page).toHaveURL(/\/play\/w\/w1\/arrival$/)
    await tapStoryUntilButton(page, '¡Seguir!')
    await continueFromReward(page)
    await expect(page).toHaveURL(/\/play\/w\/w1$/)
    await expect(page.getByRole('button', { name: /Las lianas de las hadas, hecho/ })).toBeVisible()

    // Node 2: lesson.
    await page.getByRole('button', { name: /¿Qué es multiplicar\?/ }).click()
    await expect(page).toHaveURL(/\/play\/w\/w1\/lesson-groups$/)
    await playLesson(page)
    await tapStoryUntilButton(page, '¡Seguir!').catch(() => undefined)
    await continueFromReward(page)
    await expect(page).toHaveURL(/\/play\/w\/w1$/)

    // Node 3: activity. The child builds the equal groups by tapping, then writes the answer on the keyboard.
    await page.getByRole('button', { name: /Cuenta los grupos de las hadas/ }).click()
    await expect(page).toHaveURL(/\/play\/w\/w1\/groups$/)
    await playGroupsActivity(page)

    await continueFromReward(page)

    // Map: progress and stars are shown.
    await expect(page).toHaveURL(/\/play\/w\/w1$/)
    await expect(page.getByRole('button', { name: /Cuenta los grupos de las hadas, hecho/ })).toBeVisible()
    // Stars are SVG icons with data-filled (aria-hidden): every finished node shows at least one filled star.
    const arrival = page.getByRole('button', { name: /Las lianas de las hadas, hecho/ })
    await expect(arrival).toBeVisible()
    await expect(arrival.locator('svg[data-filled="true"]').first()).toBeVisible()
    const groups = page.getByRole('button', { name: /Cuenta los grupos de las hadas, hecho/ })
    await expect(groups.locator('svg[data-filled="true"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Filas de flores, aquí estás/ })).toBeVisible()
  })
})
