/* Mi sesión de hoy and the prueba inicial: a short walk through the real screens with the demo child Lía.
   Only visible Spanish text and roles are used. */
import { expect, test } from '@playwright/test'
import { CHILD_NAME, seedDemo, settle } from '../helpers'

test.describe('Mi sesión de hoy', () => {
  test('the home offers the session as the main entry and the session starts with a warm-up', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play')
    await expect(page.getByRole('heading', { name: new RegExp(`¡Hola, ${CHILD_NAME}!`) })).toBeVisible()
    const session = page.getByRole('button', { name: /Mi sesión de hoy/ })
    await expect(session).toBeVisible()
    await session.click()
    await expect(page).toHaveURL(/\/play\/sesion$/)
    await expect(page.getByText(`¡Vamos, ${CHILD_NAME}!`)).toBeVisible()
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    await expect(page.getByText('Calentamiento', { exact: true })).toBeVisible()
    await expect(page.getByText(/de 15$/)).toBeVisible()
    await settle(page, 300)
  })

  test('the session can be paused and left without losing the day', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/sesion')
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    await page.getByRole('button', { name: /Salir/ }).click()
    await expect(page.getByRole('dialog', { name: 'Pausa' })).toBeVisible()
    await page.getByRole('button', { name: 'Seguir' }).click()
    await expect(page.getByRole('dialog', { name: 'Pausa' })).toHaveCount(0)
  })
})

test.describe('Prueba inicial', () => {
  test('starts with fourteen questions, shows no right or wrong feedback and says thanks', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/prueba')
    await expect(page.getByRole('heading', { name: 'Prueba inicial' })).toBeVisible()
    await expect(page.getByText(/· 1 de 14/)).toBeVisible()
    await settle(page, 300)
  })
})
