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

  test('the new topic (numbers up to 9 999) shows its worked example, then blocks the child counts and writes', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/sesion')
    await expect(page.getByText(/Hoy aprendemos/)).toBeVisible()
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    // The warm-up facts come first; the example of the new topic (blocks) opens «Lo nuevo».
    const example = page.getByRole('button', { name: /Entendido/ })
    for (let i = 0; i < 40 && (await example.count()) === 0; i++) {
      await page.keyboard.type('1')
      await page.keyboard.press('Enter')
      await settle(page, 150)
      const next = page.getByRole('button', { name: /Siguiente/ })
      if (await next.count()) await next.first().click()
    }
    await expect(page.getByText('Cuenta los bloques y escribe el número')).toBeVisible()
    await example.click()
    // The blocks item: the child counts the tiles in each class (the groups say how many) and writes the number.
    await expect(page.getByRole('textbox', { name: 'Número de los bloques' })).toBeVisible()
    const digits = await page.evaluate(() => {
      const counts = Object.fromEntries(
        [...document.querySelectorAll<HTMLElement>('[title]')]
          .map((el) => /^(\d+) (millares|centenas|decenas|unidades)$/.exec(el.title))
          .filter((m): m is RegExpExecArray => m !== null)
          .map((m) => [m[2], Number(m[1])]),
      )
      return `${counts.millares ?? 0}${counts.centenas ?? 0}${counts.decenas ?? 0}${counts.unidades ?? 0}`.replace(/^0+(?=\d)/, '')
    })
    await page.keyboard.type(digits)
    await page.getByRole('button', { name: '✓ Comprobar' }).click()
    await expect(page.getByRole("button", { name: /Siguiente/ })).toBeVisible()
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
  test('starts with twenty questions, shows no right or wrong feedback and says thanks', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/prueba')
    await expect(page.getByRole('heading', { name: 'Prueba inicial' })).toBeVisible()
    await expect(page.getByText(/· 1 de 20/)).toBeVisible()
    await settle(page, 300)
  })

  test('«No lo sé» moves on and marks the topic as one to work on', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/prueba')
    await page.getByRole('button', { name: 'No lo sé' }).click()
    await expect(page.getByText('¡Gracias!')).toBeVisible()
    await expect(page.getByRole('button', { name: 'No lo sé' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByText(/· 2 de 20/)).toBeVisible()
  })
})

test.describe('a short landscape tablet (Android with its bars)', () => {
  test.use({ viewport: { width: 1138, height: 640 } })

  test('the page scrolls down to «Siguiente» when the exercise is taller than the screen', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/sesion')
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    const example = page.getByRole('button', { name: /Entendido/ })
    for (let i = 0; i < 40 && (await example.count()) === 0; i++) {
      await page.keyboard.type('1')
      await page.keyboard.press('Enter')
      await settle(page, 150)
      const next = page.getByRole('button', { name: /Siguiente/ })
      if (await next.count()) await next.first().click()
    }
    await example.click()
    await page.getByRole('textbox', { name: 'Número de los bloques' }).focus()
    await page.keyboard.type('1234')
    await page.keyboard.press('Enter')
    const next = page.getByRole('button', { name: /Siguiente/ })
    await expect(next).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight))
    const box = await next.boundingBox()
    const height = await page.evaluate(() => window.innerHeight)
    expect(box!.y + box!.height).toBeLessThanOrEqual(height)
  })
})
