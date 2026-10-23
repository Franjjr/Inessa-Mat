/* E2E for dinero and medida in the dev gallery (/dev/gallery?only=moneyMeasure): a money exercise is paid with taps on
   the purse and checked; a measure exercise is read on the ruler, typed with the keyboard and checked. No audio is
   played (the Playwright config mutes it). Run with the dev server up:
     npx playwright test tests/e2e/journeys/i-dinero-medida.spec.ts   (E2E_BASE_URL to override) */
import { expect, test } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const GALLERY = `${BASE}/dev/gallery?only=moneyMeasure`

test.describe('dinero y medida', () => {
  test('paga 8 € con monedas y billetes de la bandeja y lo comprueba', async ({ page }) => {
    await page.goto(GALLERY)
    const frame = page.locator('[data-gallery="Dinero: pagar con la bandeja (ipad)"]')
    await expect(frame.getByLabel('Precio: 8 €')).toBeVisible()
    await frame.getByRole('button', { name: 'Añadir 5 €' }).click()
    await frame.getByRole('button', { name: 'Añadir 2 €' }).click()
    await frame.getByRole('button', { name: 'Añadir 1 €' }).click()
    await frame.getByRole('button', { name: '✓ Comprobar' }).click()
    await expect(frame.getByText('¡Muy bien! Has pagado justo.')).toBeVisible()
  })

  test('lee la regla (el objeto no empieza en 0) y escribe la medida', async ({ page }) => {
    await page.goto(GALLERY)
    const frame = page.locator('[data-gallery="Medida: la regla (ipad)"]')
    const ruler = frame.getByRole('img', { name: /Regla de 30 centímetros/ })
    const label = (await ruler.getAttribute('aria-label')) ?? ''
    const [, start, end] = label.match(/empieza en (\d+) y acaba en (\d+)/) ?? []
    expect(start).toBeTruthy()
    const answer = String(Number(end) - Number(start))
    // Focus the writing pad, then the keyboard fills it.
    await frame.getByRole('textbox', { name: 'Centímetros', exact: true }).click()
    for (const digit of answer) await page.keyboard.press(digit)
    await frame.getByRole('button', { name: '✓ Comprobar' }).click()
    await expect(frame.getByText('¡Muy bien! Has medido bien.')).toBeVisible()
  })
})
