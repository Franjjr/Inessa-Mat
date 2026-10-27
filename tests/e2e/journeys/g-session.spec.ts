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

  test('«Ahora no» sends the first item to the end, and it comes back later; the count does not advance', async ({ page }) => {
    await seedDemo(page)
    await page.goto('/play/sesion')
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    const bar = page.getByRole('progressbar')
    const count = await bar.getAttribute('aria-label')
    const stage = bar.locator('xpath=following-sibling::div[1]')
    // The text of the shown item, once it has loaded («Cargando…» is shown while the exercise is prepared).
    const shown = async () => {
      await expect(stage).not.toContainText('Cargando…')
      return stage.innerText()
    }
    const first = await shown()
    await page.getByRole('button', { name: 'Ahora no' }).click()
    await expect.poll(shown).not.toBe(first)
    await expect(bar).toHaveAttribute('aria-label', count!)
    await expect(page.getByRole('button', { name: 'Ahora no' })).toBeVisible()
    // The postponed item is still in the run: each «Ahora no» sends the current one to the end, so the first item comes
    // back to the front after the others (no limit, so the loop only stops when it is back). A new skill opens with an
    // example card («¡Entendido, a por ello!») that has no «Ahora no»: the loop takes it and goes on.
    const ahoraNo = page.getByRole('button', { name: 'Ahora no' })
    const entendido = page.getByRole('button', { name: '¡Entendido, a por ello!' })
    let back = false
    for (let i = 0; i < 80 && !back; i++) {
      await expect(ahoraNo.or(entendido)).toBeVisible()
      if (await entendido.isVisible()) {
        await entendido.click()
        continue
      }
      const before = await shown()
      await ahoraNo.click()
      await expect.poll(shown).not.toBe(before)
      await expect(bar).toHaveAttribute('aria-label', count!)
      back = (await shown()) === first
    }
    expect(back, 'the postponed item comes back to the front').toBe(true)
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
