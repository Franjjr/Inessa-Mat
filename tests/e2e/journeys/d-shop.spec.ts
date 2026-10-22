/* Journey D: the shop. The child has stars (granted through the dev data layer), buys an accessory, puts it on
   the companion and takes it off again. */
import { expect, test } from '@playwright/test'
import { createChildThroughOnboarding, devEditProgress } from '../helpers'

test.describe('D · tienda de accesorios', () => {
  test('comprar con estrellas, ponerse el accesorio y quitárselo', async ({ page }) => {
    await createChildThroughOnboarding(page)
    await devEditProgress(page, { kind: 'stars', amount: 20 })

    await page.goto('/play/shop')
    await expect(page.getByLabel('Tienes 20 estrellas para gastar')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Accesorios' })).toBeVisible()

    await page.getByRole('button', { name: /Piruleta/ }).first().click()
    await page.getByRole('button', { name: 'Comprar por 5 estrellas' }).click()
    await expect(page.getByText('Te costará 5 estrellas. Te quedarán 15.')).toBeVisible()
    await page.getByRole('button', { name: 'Sí, comprar' }).click()

    // The piece stays selected after buying (tiles toggle their selection), so 'Ponérselo' is already offered.
    await expect(page.getByLabel('Tienes 15 estrellas para gastar')).toBeVisible()
    await page.getByRole('button', { name: 'Ponérselo' }).click()
    await expect(page.getByRole('button', { name: 'Quitármelo' })).toBeVisible()

    // Equipped state survives a reload (it is stored with the profile).
    await page.reload()
    await page.getByRole('button', { name: /Piruleta/ }).first().click()
    await expect(page.getByRole('button', { name: 'Quitármelo' })).toBeVisible()
    await page.getByRole('button', { name: 'Quitármelo' }).click()
    await expect(page.getByRole('button', { name: 'Ponérselo' })).toBeVisible()
  })
})
