/* The Lengua driver of the e2e suite: plays a Lengua session the way a child does (the words typed or tapped, the options
   tapped one after another, «Comprobar», «Siguiente»), until the session is over. Shared by the Lengua journey and the
   caligrafía journey. The driver answers whatever is on screen, so that the flow goes on; the answers are not checked here. */
import type { Locator, Page } from '@playwright/test'
import { settle } from './helpers'

export const CONTINUE = /^(Siguiente|Ver mi resultado|Terminar|Inténtalo otra vez|¡Ahora las preguntas!|¡Entendido, a por ello!|¡Lo he entendido!)/

/** On a touch screen the word starts with the pen: «Usar el teclado de letras» brings the letter keyboard up. */
export async function openLetterKeyboard(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Usar el teclado de letras' })
  if (await toggle.isVisible().catch(() => false)) await toggle.click()
}

/** The letters of a typed word: the on-screen letter keyboard when the device shows it, the physical keyboard otherwise. */
export async function typeLetters(page: Page, box: Locator, letters: string): Promise<void> {
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
export async function check(page: Page): Promise<boolean> {
  const button = page.getByRole('button', { name: /Comprobar/ }).last()
  if (!(await button.isEnabled().catch(() => false))) return false
  await button.click()
  return true
}

/** Answers the exercise on screen with whatever the view takes, so that the flow goes on: a typed word with the letter
    keyboard; the options tapped one after another (an ordering view takes every event); the empty number boxes filled with
    a 2 from the number keypad. Then «Comprobar» when it is enabled. Returns true when it acted. */
export async function answerAnything(page: Page): Promise<boolean> {
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
export async function advance(page: Page): Promise<boolean> {
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
export async function playUntil(page: Page, done: () => Promise<boolean>, maxSteps = 400): Promise<void> {
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

export const sessionEnded = (page: Page) => page.getByText('Sesión terminada', { exact: true }).isVisible().catch(() => false)
