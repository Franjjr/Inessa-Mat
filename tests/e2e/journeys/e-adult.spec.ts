/* Journey E: the grown-ups' area. First use asks for a PIN (created in the gate), the family home lists the
   profile, the child report shows the times-table heatmap, and the settings open. Seeded data gives the report
   something to show. */
import { expect, test } from '@playwright/test'
import { seedDemo } from '../helpers'

test.describe('E · zona de adultos', () => {
  test('crear el PIN → informe con mapa de calor → ajustes', async ({ page }) => {
    await seedDemo(page, '/adult')

    // Gate: first use asks for a new PIN.
    await expect(page.getByRole('heading', { name: 'Crea tu PIN' })).toBeVisible()
    const pad = page.getByRole('group', { name: 'Teclado numérico' })
    const digits = async (value: string) => {
      for (const d of value) await pad.getByRole('button', { name: d, exact: true }).click()
    }
    await digits('4812')
    await page.getByRole('button', { name: 'Seguir' }).click()
    await expect(page.getByRole('heading', { name: 'Crea tu PIN' })).toBeVisible()
    await digits('4812')
    await page.getByRole('button', { name: 'Confirmar' }).click()

    // Family home: the demo profile and its report.
    await expect(page.getByRole('heading', { name: 'Zona de adultos' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Perfiles' })).toBeVisible()
    await page.getByRole('button', { name: 'Ver informe' }).first().click()
    await expect(page).toHaveURL(/\/adult\/child\//)

    // Report: the times-table heatmap and the most frequent errors.
    await expect(page.getByRole('heading', { name: 'Tablas de multiplicar' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Errores más frecuentes' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Datos y privacidad' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Descargar sus datos (JSON)' })).toBeVisible()

    // Settings.
    await page.goto('/adult/settings')
    // A reload locks the grown-up area again: enter the PIN once more.
    const gate = page.getByText('Escribe el PIN para continuar.')
    const settings = page.getByRole('heading', { name: 'PIN de la zona de adultos' })
    await expect(gate.or(settings)).toBeVisible()
    if (await gate.isVisible()) {
      await digits('4812')
      await page.getByRole('button', { name: 'Entrar' }).click()
    }
    await expect(page.getByRole('heading', { name: 'PIN de la zona de adultos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sonido y voz' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Leer la política de privacidad' })).toBeVisible()
  })
})
