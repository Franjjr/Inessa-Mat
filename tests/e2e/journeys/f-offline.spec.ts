/* Journey F: the production build (vite preview) installs its service worker, then the device goes offline. After a
   reload the child can still open the home screen, the world map and a story node. Runs against the built app, so
   it is skipped when E2E_BASE_URL points elsewhere without E2E_OFFLINE_BASE. */
import { expect, test } from '@playwright/test'
import { createChildThroughOnboarding } from '../helpers'

const OFFLINE_BASE = process.env.E2E_OFFLINE_BASE ?? 'http://localhost:4173'
const external = !!process.env.E2E_BASE_URL && !process.env.E2E_OFFLINE_BASE

test.describe('F · sin conexión (build de producción)', () => {
  test.skip(external, 'offline journey needs the production build on E2E_OFFLINE_BASE (see playwright.config.ts)')
  test.use({ baseURL: OFFLINE_BASE })

  test('tras cargar una vez, el juego sigue funcionando sin conexión', async ({ page, context }) => {
    test.setTimeout(240_000)
    await createChildThroughOnboarding(page)

    // Wait until the service worker controls the page (it precaches the app shell on install).
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 60_000 }).toBe(true)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Familia' })).toBeVisible()

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Familia' })).toBeVisible({ timeout: 30_000 })

    // Still playable: the world map and its first node open from the cache and local data.
    await page.getByRole('button', { name: /^Bosque/ }).first().click()
    await expect(page).toHaveURL(/\/play\/w\/w1$/)
    await expect(page.getByRole('button', { name: /Las lianas de las hadas/ })).toBeVisible()
    await page.getByRole('button', { name: /Las lianas de las hadas/ }).click()
    await expect(page.getByRole('button', { name: 'Seguir la historia' })).toBeVisible({ timeout: 15_000 })
    await context.setOffline(false)
  })
})
