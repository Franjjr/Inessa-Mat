/* Journey L: a child on a phone (handwritten cells are too small there) answers with the on-screen keypad. The first
   question of the placement test is a column sum: the keypad shows from the start, typing fills units, tens and
   hundreds (the optional carry boxes are skipped) and the keypad fits under the sum. Runs once, as a Pixel 7. */
import { devices, expect, test } from '@playwright/test'
import { createChildThroughOnboarding, tapButton } from '../helpers'

const { defaultBrowserType: _browser, ...pixel } = devices['Pixel 7']
test.use(pixel)

test('on a phone the column sum is answered with the on-screen keypad', async ({ page }, info) => {
  test.skip(info.project.name !== 'android', 'one phone run is enough')
  await createChildThroughOnboarding(page, 'Lía', 3)
  await tapButton(page, '¡Hacer la prueba!')
  const pad = page.getByRole('group', { name: 'Teclado de números' })
  await expect(pad).toBeVisible()
  await expect(page.getByRole('button', { name: 'Usar el teclado de números' })).toHaveCount(0)

  const box = await pad.boundingBox()
  expect(box && box.y + box.height, 'the keypad fits on the screen').toBeLessThanOrEqual(page.viewportSize()!.height)

  for (const k of ['6', '7', '8']) await pad.getByRole('button', { name: k, exact: true }).tap()
  await expect(page.getByRole('textbox', { name: 'unidades del resultado' })).toHaveText(/6/)
  await expect(page.getByRole('textbox', { name: 'decenas del resultado' })).toHaveText(/7/)
  await expect(page.getByRole('textbox', { name: 'centenas del resultado' })).toHaveText(/8/)
  await expect(page.getByRole('textbox', { name: 'llevada de decenas (opcional)' })).not.toHaveText(/\d/)
})

test.describe('a small phone with its browser bars (375 × 548)', () => {
  test.use({ viewport: { width: 375, height: 548 } })

  test('the keypad comes into view by itself under a tall column sum', async ({ page }, info) => {
    test.skip(info.project.name !== 'android', 'one phone run is enough')
    await createChildThroughOnboarding(page, 'Lía', 3)
    await tapButton(page, '¡Hacer la prueba!')
    const pad = page.getByRole('group', { name: 'Teclado de números' })
    await expect(pad).toBeVisible()
    await expect.poll(async () => {
      const box = await pad.boundingBox()
      return box ? box.y + box.height : Infinity
    }).toBeLessThanOrEqual(549) // sub-pixel rounding
  })
})
