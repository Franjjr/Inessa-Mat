/* Journey A: a new device goes to /kids, creates a child through onboarding (calibration skipped), watches the
   prologue and lands on the home screen. */
import { expect, test } from '@playwright/test'
import { CHILD_NAME, createChildThroughOnboarding, tapStoryUntil } from '../helpers'

test.describe('A · alta del primer perfil', () => {
  test('nuevo dispositivo → /kids → onboarding → prólogo → inicio', async ({ page }) => {
    await page.goto('/kids')
    await expect(page.getByRole('heading', { name: '¿Quién juega hoy?' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Jugar como/ })).toHaveCount(0)

    await page.getByRole('button', { name: /nuev|añadir/i }).first().click()
    await expect(page).toHaveURL(/\/kids\/new$/)

    await page.getByRole('textbox', { name: 'Tu nombre' }).fill(CHILD_NAME)
    await page.getByRole('button', { name: 'Siguiente ›' }).click()
    await expect(page.getByText('Encantada de conocerte')).toBeVisible()
    await page.getByRole('button', { name: 'Como a una niña' }).click()
    await page.getByRole('button', { name: 'No lo sé' }).click()
    await page.getByRole('group', { name: 'Compañeros' }).getByRole('button').first().click()
    await page.getByRole('group', { name: 'Colores' }).getByRole('button').first().click()
    await page.getByRole('textbox', { name: 'Nombre del compañero' }).fill('Luna')
    await page.getByRole('button', { name: 'Siguiente ›' }).click()
    await page.getByRole('button', { name: 'Es una niña' }).click()
    await expect(page.getByRole('button', { name: '¡Vamos!' })).toBeVisible()
    await page.getByRole('button', { name: '¡Vamos!' }).click()

    // Handwriting calibration is offered and can be skipped.
    await expect(page.getByRole('button', { name: 'Ahora no' })).toBeVisible()
    await page.getByRole('button', { name: 'Ahora no' }).click()

    // Prologue: tap through the story until the home screen.
    await tapStoryUntil(page, /\/play$/)
    await expect(page.getByRole('button', { name: 'Familia' })).toBeVisible()
    await expect(page.getByText(CHILD_NAME, { exact: false }).first()).toBeVisible()
  })

  test('el perfil creado aparece en /kids y se puede volver a entrar', async ({ page }) => {
    await createChildThroughOnboarding(page, CHILD_NAME)
    await page.goto('/kids')
    await expect(page.getByRole('button', { name: `Jugar como ${CHILD_NAME}` })).toBeVisible()
    await page.getByRole('button', { name: `Jugar como ${CHILD_NAME}` }).click()
    await expect(page).toHaveURL(/\/play$/)
  })
})
