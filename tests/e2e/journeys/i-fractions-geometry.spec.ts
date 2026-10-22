/* Block E (fracciones and geometría) in the development gallery (/dev/gallery?only=fractions): a child colours a fraction
   and answers a geometry item. Figures are seeded, so the same items come back on every run. */
import { expect, test } from '@playwright/test'

const gallery = (entry: string) => `/dev/gallery?only=fractions&entry=${encodeURIComponent(entry)}`

test('colours three quarters of a circle and gets the feedback', async ({ page }) => {
  await page.goto(gallery('colorear las partes (ipad)'))
  await expect(page.getByText('Colorea tres cuartos de la figura.')).toBeVisible()
  const parts = page.getByRole('button', { name: /Parte/ })
  await expect(parts).toHaveCount(4)
  await parts.nth(0).click()
  await expect(parts.nth(0)).toHaveAttribute('aria-pressed', 'true')
  await parts.nth(1).click()
  await parts.nth(2).click()
  await page.getByRole('button', { name: /Comprobar/ }).click()
  await expect(page.getByText('Has sabido ver la fracción')).toBeVisible()
})

test('answers a geometry item: a figure and its name, then the feedback appears', async ({ page }) => {
  await page.goto(gallery('nombre del polígono (ipad)'))
  await expect(page.getByText('¿Qué figura es?')).toBeVisible()
  await page.getByRole('group', { name: 'Respuestas' }).getByRole('button').first().click()
  await page.getByRole('button', { name: /Comprobar/ }).click()
  await expect(page.locator('[aria-live="polite"]').getByText(/Mira otra vez|Muy bien|¡Muy bien!/)).toBeVisible()
})

test('the fraction view fits a phone (no horizontal scroll)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(gallery('colorear (teléfono)'))
  await expect(page.getByText(/Colorea/)).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
