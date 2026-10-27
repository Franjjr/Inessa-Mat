/* Journey N: the home's order. «Hoy» is the big button: the class of today's topic when there is one and the child has
   not done it (Lía is put on a topic with a class through the dev helper), otherwise «Mi sesión de hoy». After the class
   («Ya lo sé» answered with the e2e solvers) the home offers the session. «Repasar» only with something due; «Jugar» and
   «Mis premios» are there, «Repaso del día» and «Juego libre» are gone. On a phone the «Hoy» card fits without scrolling. */
import { devices, expect, test } from '@playwright/test'
import { CHILD_NAME, devMasterUntilTopic, driveExercises, seedDemo } from '../helpers'

const CLASS_TOPIC = 'div-con-tablas'

test.describe('Hoy and the menu', () => {
  test('«Hoy» opens the session when today\'s topic has no class (Lía: descomponer)', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play')
    await expect(page.getByRole('heading', { name: new RegExp(`¡Hola, ${CHILD_NAME}!`) })).toBeVisible()
    const hoy = page.getByRole('button', { name: /Mi sesión de hoy/ })
    await expect(hoy).toContainText('Descomponer')
    await hoy.click()
    await expect(page).toHaveURL(/\/play\/sesion$/)
  })

  test('«Hoy» opens the class of today\'s topic, and after it the home offers the session', async ({ page }) => {
    await seedDemo(page)
    await devMasterUntilTopic(page, CLASS_TOPIC)
    await page.goto('/play')
    const hoy = page.getByRole('button', { name: /Hoy aprendemos/ })
    await expect(hoy).toContainText('Dividir con las tablas')
    await expect(hoy).toContainText('¡Empezar la clase!')
    await hoy.click()
    await expect(page).toHaveURL(new RegExp(`/play/clase/${CLASS_TOPIC}$`))

    await page.getByRole('button', { name: 'Ya lo sé' }).click()
    const finished = page.getByText('¡Clase terminada!')
    await driveExercises(page, async () => {
      const terminar = page.getByRole('button', { name: 'Terminar' })
      if (await terminar.isVisible().catch(() => false)) await terminar.click()
      return finished.isVisible().catch(() => false)
    })
    await expect(finished).toBeVisible()
    await page.getByRole('button', { name: 'Volver al inicio' }).click()
    await expect(page).toHaveURL(/\/play$/)
    await expect(page.getByRole('button', { name: /Hoy aprendemos/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Mi sesión de hoy/ })).toBeVisible()
  })

  test('the tiles: Jugar and Mis premios are there, Repaso del día and Juego libre are gone', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play')
    await expect(page.getByRole('button', { name: 'Jugar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mis premios' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Repaso del día|Juego libre/ })).toHaveCount(0)
  })

  test('«Mis premios» opens the prizes with the album, the shop and no chest before the crystals', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play')
    await page.getByRole('button', { name: 'Mis premios' }).click()
    await expect(page).toHaveURL(/\/play\/premios$/)
    await expect(page.getByText('Mis premios', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Álbum/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tienda/ })).toBeVisible()
    await page.getByRole('button', { name: /Atrás|Volver|Salir/ }).first().click()
    await expect(page).toHaveURL(/\/play$/)
  })
})

test.describe('on a phone', () => {
  const { defaultBrowserType: _browser, ...pixel } = devices['Pixel 7']
  test.use(pixel)

  test('the «Hoy» card ends within the screen without scrolling', async ({ page }, info) => {
    test.skip(info.project.name !== 'android', 'one phone run is enough')
    await seedDemo(page)
    await page.goto('/play')
    const hoy = page.getByRole('button', { name: /Mi sesión de hoy|Hoy aprendemos/ })
    await expect(hoy).toBeVisible()
    const box = await hoy.boundingBox()
    expect(box && box.y + box.height, 'the card bottom is on the screen').toBeLessThanOrEqual(page.viewportSize()!.height)
  })
})
