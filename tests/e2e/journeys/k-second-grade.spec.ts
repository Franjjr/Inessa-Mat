/* Journey K: a 2.º child plays the 2.º adventure (same maps, 2.º stops) and the daily session of the 2.º temario. */
import { expect, test } from '@playwright/test'
import { createChildThroughOnboarding } from '../helpers'

test('a 2.º child gets the 2.º session and the 2.º stops of the forest', async ({ page }) => {
  await createChildThroughOnboarding(page, 'Lía', 2)
  await expect(page.getByText('Contar de 2 en 2, de 5 en 5 y de 10 en 10')).toBeVisible()
  await page.goto('/play/w/w1')
  await expect(page.getByRole('heading', { name: 'El Bosque de los Grupos' })).toBeVisible()
  await expect(page.getByText('Grupos de diez')).toBeVisible()
  await expect(page.getByText('Los collares de las hadas')).toBeVisible()
})
