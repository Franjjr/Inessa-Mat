/* Journey P: Lengua de 3.º in the app. Lía (3.º) has Lengua switched on: «Hoy» is her maths session first, then
   «Ahora, Lengua»: the class of the topic, a typed word with the letter keyboard, a story with its questions, and the stars.
   The answers are not checked here (the planner and the views have their own tests): the driver answers whatever is on
   screen, so that the flow goes on. Typed answers are checked at 390 × 844 and at 1180 × 820. No audio is played: the
   lesson narration is off in these tests (voice: false), the dictation is never planned here, and the «Escuchar» button of
   a passage speaks only on an explicit press, which these tests never make (R16). */
import { expect, test, type Locator, type Page } from '@playwright/test'
import { devFlag, devMasterUntilTopic, devSettings, seedDemo, settle } from '../helpers'

const READING_TITLE = 'El camaleón que quería parecer otro'
const CLASS_TITLE = 'Letras, sílabas y palabras'
const CONTINUE = /^(Siguiente|Ver mi resultado|Terminar|Inténtalo otra vez|¡Ahora las preguntas!|¡Entendido, a por ello!|¡Lo he entendido!)/

/** On a touch screen the word starts with the pen: «Usar el teclado de letras» brings the letter keyboard up. */
async function openLetterKeyboard(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Usar el teclado de letras' })
  if (await toggle.isVisible().catch(() => false)) await toggle.click()
}

/** The letters of a typed word: the on-screen letter keyboard when the device shows it, the physical keyboard otherwise. */
async function typeLetters(page: Page, box: Locator, letters: string): Promise<void> {
  await openLetterKeyboard(page)
  await box.click()
  const pad = page.getByRole('group', { name: 'Teclado de letras' })
  if (await pad.isVisible().catch(() => false)) {
    for (const ch of letters) await pad.getByRole('button', { name: ch, exact: true }).click()
  } else {
    await page.keyboard.type(letters)
  }
}

/** Presses «✓ Comprobar» of the answer bar when it is enabled (the last one on the page: the letter keyboard has its own,
    earlier in the DOM). Returns false when it is not enabled yet. */
async function check(page: Page): Promise<boolean> {
  const button = page.getByRole('button', { name: /Comprobar/ }).last()
  if (!(await button.isEnabled().catch(() => false))) return false
  await button.click()
  return true
}

/** Answers the exercise on screen with whatever the view takes, so that the flow goes on: a typed word with the letter
    keyboard; the options tapped one after another (an ordering view takes every event); the empty number boxes filled with
    a 2 from the number keypad. Then «Comprobar» when it is enabled. Returns true when it acted. */
async function answerAnything(page: Page): Promise<boolean> {
  const word = page.getByRole('textbox', { name: 'Escribe la palabra completa' })
  if (await word.isVisible().catch(() => false)) {
    await typeLetters(page, word, 'ab')
    await check(page)
    return true
  }
  const optionSel = '[role="group"]:not([aria-label="Teclado de letras"]):not([aria-label="Teclado de números"]) button[aria-pressed="false"], [role="radiogroup"] button'
  const options = page.locator(optionSel)
  if (await options.first().isVisible().catch(() => false)) {
    for (let k = 0; k < 8; k++) {
      if (await check(page)) return true
      const next = page.locator(optionSel).first()
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
      await settle(page, 120)
    }
    await check(page)
    return true
  }
  // Number boxes still empty (a «?» or the placeholder): each one takes a 2 from the keypad or the physical keyboard.
  const boxes = page.getByRole('textbox').and(page.locator(':not([aria-label="Escribe la palabra completa"])'))
  let acted = false
  const n = await boxes.count()
  for (let i = 0; i < n; i++) {
    const box = boxes.nth(i)
    if (!(await box.isVisible().catch(() => false))) continue
    if (/\d/.test(((await box.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' '))) continue
    await box.click()
    const pad = page.getByRole('group', { name: 'Teclado de números' })
    if (await pad.isVisible().catch(() => false)) await pad.getByRole('button', { name: '2', exact: true }).click()
    else await page.keyboard.type('2')
    acted = true
  }
  if (!acted) return false
  await check(page)
  return true
}

/** Presses the first enabled button that moves the flow on (the reading, the feedback, the next item). */
async function advance(page: Page): Promise<boolean> {
  const buttons = page.getByRole('button', { name: CONTINUE })
  const n = await buttons.count()
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i)
    if (await b.isVisible().catch(() => false) && await b.isEnabled().catch(() => false)) {
      await b.click()
      return true
    }
  }
  return false
}

/** Plays whatever is on screen until `done()` is true. A view that does not move on (a drag and drop of the maths problems)
    is given up with «No lo sé», which the runs take as an answer too. The page text without its digits (the clock) says
    whether the view changed. */
async function playUntil(page: Page, done: () => Promise<boolean>, maxSteps = 400): Promise<void> {
  let lastView = ''
  let same = 0
  for (let i = 0; i < maxSteps; i++) {
    if (await done()) return
    if (await advance(page) || await answerAnything(page)) {
      await settle(page, 150)
    }
    const view = ((await page.locator('main').first().innerText().catch(() => '')) ?? '').replace(/[\d:\s]+/g, ' ')
    same = view === lastView ? same + 1 : 0
    lastView = view
    const dontKnow = page.getByRole('button', { name: 'No lo sé' })
    if (same >= 4 && await dontKnow.isVisible().catch(() => false)) {
      await dontKnow.click()
      same = 0
    }
    await settle(page, 200)
  }
  throw new Error('the flow did not finish')
}

const sessionEnded = (page: Page) => page.getByText('Sesión terminada', { exact: true }).isVisible().catch(() => false)

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
