/* Journey P: Lengua de 3.º in the app. Lía (3.º) has Lengua switched on: «Hoy» is her maths session first, then
   «Ahora, Lengua»: the class of the topic, a typed word with the letter keyboard, a story with its questions, and the stars.
   The answers are not checked here (the planner and the views have their own tests): the driver answers whatever is on
   screen, so that the flow goes on. Typed answers are checked at 390 × 844 and at 1180 × 820. No audio is played: the
   lesson narration is off in these tests (voice: false), the dictation is never planned here, and the «Escuchar» button of
   a passage speaks only on an explicit press, which these tests never make (R16). */
import { expect, test } from '@playwright/test'
import { devFlag, devMasterUntilTopic, devSettings, seedDemo } from '../helpers'
import { check, openLetterKeyboard, playUntil, sessionEnded, typeLetters } from '../lengua-driver'

const READING_TITLE = 'El camaleón que quería parecer otro'
const CLASS_TITLE = 'Letras, sílabas y palabras'

test.describe('Lengua de 3.º', () => {
  test('Lía does her maths session, then Lengua: the class, the story with its questions, and the stars', async ({ page }, info) => {
    test.setTimeout(480_000)
    await seedDemo(page)
    await devSettings(page, { subjects: ['math', 'language'], voice: false, storyVoice: false })
    await page.goto('/play')

    // Maths first: «Hoy» is the maths session until it is done.
    await page.getByRole('button', { name: /Mi sesión de hoy/ }).click()
    await expect(page).toHaveURL(/\/play\/sesion$/)
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    await playUntil(page, () => sessionEnded(page), 600)
    await page.getByRole('button', { name: 'Volver al inicio' }).click()
    await expect(page).toHaveURL(/\/play$/)

    // Then Lengua: the big button is now «Ahora, Lengua» with the class of its first topic.
    const hoy = page.getByRole('button', { name: /Hoy aprendemos/ })
    await expect(hoy).toContainText(CLASS_TITLE)
    // The Lengua view has no maths pieces: no adventure card and no world bar.
    await expect(page.getByRole('button', { name: /Mi aventura/ })).toHaveCount(0)
    await expect(page.getByLabel('Mundos')).toHaveCount(0)
    await page.screenshot({ path: `${process.env.E2E_SHOTS ?? 'test-results'}/lengua-hoy-${info.project.name}.png` })
    await hoy.click()
    await expect(page).toHaveURL(/\/play\/clase\/lng-silabas$/)
    await page.getByRole('button', { name: '¡Empezar la clase!' }).click()
    await playUntil(page, () => page.getByText('¡Clase terminada!').isVisible().catch(() => false))
    await page.getByRole('button', { name: 'Seguir con la sesión' }).click()
    await expect(page).toHaveURL(/\/play\/lengua$/)

    // The Lengua session: its intro, then the story (its text first, then its questions), and the closing with the stars.
    await expect(page.getByRole('heading', { name: 'Mi sesión de Lengua' })).toBeVisible()
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    let sawStory = false
    await playUntil(page, async () => {
      if (!sawStory && await page.getByRole('heading', { name: READING_TITLE }).isVisible().catch(() => false)) sawStory = true
      return sessionEnded(page)
    })
    expect(sawStory, 'the story of the session was shown with its text').toBe(true)
    await expect(page.getByText('+3 estrellas para tu cuerno')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Volver al inicio' }).click()
    await expect(page).toHaveURL(/\/play$/)
  })

  for (const viewport of [{ width: 390, height: 844 }, { width: 1180, height: 820 }]) {
    test(`a typed word with the letter keyboard fits the screen at ${viewport.width} × ${viewport.height}`, async ({ page }, info) => {
      test.setTimeout(300_000)
      await page.setViewportSize(viewport)
      await seedDemo(page)
      await devSettings(page, { subjects: ['math', 'language'], voice: false, storyVoice: false })
      // Lía has the earlier topics learnt, so the spelling of the mix is typed (box 2 and up), and the class is done.
      await devMasterUntilTopic(page, 'lng-c-qu')
      await devFlag(page, 'clase:lng-c-qu')
      await page.goto('/play/lengua')
      await page.getByRole('button', { name: '¡Empezar!' }).click()

      let typed = false
      await playUntil(page, async () => {
        const word = page.getByRole('textbox', { name: 'Escribe la palabra completa' })
        if (!(await word.isVisible().catch(() => false))) return false
        await openLetterKeyboard(page)
        const pad = page.getByRole('group', { name: 'Teclado de letras' })
        if (info.project.use.hasTouch) {
          await expect(pad).toBeVisible()
          const box = await pad.boundingBox()
          expect(box && box.x >= 0 && box.x + box.width <= viewport.width, 'the letter keyboard fits the width').toBe(true)
        }
        await typeLetters(page, word, 'ab')
        await expect(word).toContainText('ab')
        await page.screenshot({ path: `${process.env.E2E_SHOTS ?? 'test-results'}/lengua-tecleo-${viewport.width}x${viewport.height}-${info.project.name}.png` })
        await expect.poll(() => check(page)).toBe(true)
        typed = true
        return true
      }, 400)
      expect(typed, 'a typed word came up in the session').toBe(true)
      const scrolls = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      expect(scrolls, 'no horizontal scroll').toBe(true)
    })
  }
})
