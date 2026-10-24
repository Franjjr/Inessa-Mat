/* Journey M: the last 4.º column operations, played in the development gallery at phone width with the on-screen keypad.
   23 × 14 in partial rows (92, then 230 with its zero already written). The decimal sum 3,45 + 1,80 is not in the journey yet:
   its keypad does not move from the whole-part box to the tenths box (see the report).
   Only visible Spanish text, roles and the gallery's own labels are used. */
import { expect, test, type Page } from '@playwright/test'

const gallery = (page: Page, entry: string) => page.goto(`/dev/gallery?only=grade4&entry=${encodeURIComponent(entry)}`)

test.describe('on a phone', () => {
// A phone: the keypad is on the screen from the start, below the working.
test.use({ viewport: { width: 390, height: 844 } })

test('23 × 14 in columns: the partial rows and the total are typed with the keypad and checked', async ({ page }) => {
  await gallery(page, 'Multiplicar 23 × 14 en columna')
  const view = page.locator('[data-kind="long-mul"]')
  await expect(view).toBeVisible()
  const pad = page.getByRole('group', { name: 'Teclado de números' })
  await expect(pad).toBeVisible()

  // The partial rows are optional working cells: typing skips them, so the child taps each one before writing.
  // First partial row: 23 × 4 = 92, written from the units.
  await page.getByRole('textbox', { name: 'parcial 1, unidades' }).click()
  await pad.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('textbox', { name: 'parcial 1, decenas' }).click()
  await pad.getByRole('button', { name: '9', exact: true }).click()
  // Second partial row: 23 × 10 = 230; its units zero is already written, so the child writes 3 and 2.
  await page.getByRole('textbox', { name: 'parcial 2, decenas' }).click()
  await pad.getByRole('button', { name: '3', exact: true }).click()
  await page.getByRole('textbox', { name: 'parcial 2, centenas' }).click()
  await pad.getByRole('button', { name: '2', exact: true }).click()
  // Total: 92 + 230 = 322, written from the units (the total is a required cell, so typing goes there).
  await page.getByRole('textbox', { name: 'unidades del resultado' }).click()
  for (const k of ['2', '2', '3']) await pad.getByRole('button', { name: k, exact: true }).click()

  await expect(page.getByRole('textbox', { name: 'parcial 1, unidades' })).toHaveText(/2/)
  await expect(page.getByRole('textbox', { name: 'parcial 1, decenas' })).toHaveText(/9/)
  await expect(page.getByRole('textbox', { name: 'parcial 2, decenas' })).toHaveText(/3/)
  await expect(page.getByRole('textbox', { name: 'parcial 2, centenas' })).toHaveText(/2/)
  await expect(page.getByRole('textbox', { name: 'centenas del resultado' })).toHaveText(/3/)

  await page.getByRole('button', { name: /Comprobar/ }).last().click()
  await expect(view).toHaveAttribute('data-status', 'correct')
})
})
