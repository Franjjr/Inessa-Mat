/* Journey M: the 4.º column operations on a phone, in the development gallery, with the on-screen keypad.
   23 × 14 in partial rows (92, then 230) and the decimal sum 3,45 + 1,80 in a column. Only visible Spanish text,
   roles and the gallery's own labels are used. */
import { expect, test, type Page } from '@playwright/test'

const gallery = (page: Page, entry: string) => page.goto(`/dev/gallery?only=grade4&entry=${encodeURIComponent(entry)}`)

// A phone: the keypad is on the screen from the start, below the working.
test.use({ viewport: { width: 390, height: 844 } })

test.describe('on a phone', () => {
  test('23 × 14 in columns: the partial rows and the total are typed in turn with the keypad, and checked', async ({ page }) => {
    await gallery(page, 'Multiplicar 23 × 14 en columna')
    const view = page.locator('[data-kind="long-mul"]')
    await expect(view).toBeVisible()
    const pad = page.getByRole('group', { name: 'Teclado de números' })
    await expect(pad).toBeVisible()

    // Row 1 (× 4 = 92) from the units, then row 2 (× 1 decena = 230) and the total (322): one digit after another.
    for (const k of ['2', '9', '3', '2', '2', '2', '3']) await pad.getByRole('button', { name: k, exact: true }).click()

    await expect(page.getByRole('textbox', { name: 'parcial 1, unidades' })).toHaveText(/2/)
    await expect(page.getByRole('textbox', { name: 'parcial 1, decenas' })).toHaveText(/9/)
    await expect(page.getByRole('textbox', { name: 'parcial 2, decenas' })).toHaveText(/3/)
    await expect(page.getByRole('textbox', { name: 'parcial 2, centenas' })).toHaveText(/2/)
    await expect(page.getByRole('textbox', { name: 'centenas del resultado' })).toHaveText(/3/)

    await pad.getByRole('button', { name: 'Comprobar', exact: true }).click()
    await expect(view).toHaveAttribute('data-status', 'correct')
  })

  test('the decimal sum 3,45 + 1,80 fits the phone, is typed box by box with the keypad, and is checked', async ({ page }) => {
    await gallery(page, 'Sumar 3,45 + 1,80 en columna (teléfono)')
    const view = page.locator('[data-kind="decimal-op"]')
    await expect(view).toBeVisible()
    const pad = page.getByRole('group', { name: 'Teclado de números' })
    await expect(pad).toBeVisible()

    // The operation is inside the screen, and the page does not scroll sideways.
    const box = await view.boundingBox()
    expect(box && box.x + box.width, 'the column fits the screen').toBeLessThanOrEqual(390)
    const scrollsSideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(scrollsSideways).toBe(false)

    // The whole part, then the tenths and the hundredths of 3,45 + 1,80 = 5,25: a tap on each box moves the keypad.
    await page.getByRole('textbox', { name: 'Parte entera del resultado' }).click()
    await pad.getByRole('button', { name: '5', exact: true }).click()
    await page.getByRole('textbox', { name: 'Décimas del resultado' }).click()
    await pad.getByRole('button', { name: '2', exact: true }).click()
    await page.getByRole('textbox', { name: 'Centésimas del resultado' }).click()
    await pad.getByRole('button', { name: '5', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Décimas del resultado' })).toHaveText(/2/)

    // The keypad's check grades the column.
    await pad.getByRole('button', { name: 'Comprobar', exact: true }).click()
    await expect(view).toHaveAttribute('data-status', 'correct')
  })
})
