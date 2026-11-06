/* The English driver of the e2e suite: plays an English class or session the way a child does (the words typed with the
   letter keyboard, the options tapped, the digits of a number, the memory cards turned, «Siguiente», «Comprobar»).
   Every tap is made with element.click() after a reachability check: the element must be inside the window, or brought
   there with the «⬇ Más abajo» button (its own dispatched click). Playwright's own clicks scroll by themselves and would
   hide a button stuck below the fold, so they are not used here. */
import { expect, type Locator, type Page } from '@playwright/test'
import { settle } from './helpers'

/** What the driver needs to answer right: the memory partners (a picture and its word), the English word of each Spanish
    word, and the English words of the numbers (read from the screen, as the child would). */
export interface EnglishKit {
  partner: Map<string, string>
  words: Map<string, string>
  numbers: Map<string, string>
}

/** The buttons that move an English class or session on. */
export const ADVANCE = /^(Siguiente|Ver mi resultado|Terminar|Inténtalo otra vez|¡Ahora las preguntas!|¡Entendido, a por ello!|¡Lo he entendido!|¡Empezar la clase!|¡Empezar!|Seguir con la sesión|Volver al inicio|Continuar)/

/** What the driver met on the way (asserted by the journey). */
export interface EnglishSeen {
  grid: boolean
  typed: boolean
  numberListen: boolean
  memory: boolean
  memoryFound: number
  /** The faces the memory game has shown so far, by card position (a card face down again keeps its face here). */
  faces: Map<number, string>
  /** How many options the driver has tapped (it takes them in turn). */
  tapCount: number
}

export function newSeen(): EnglishSeen {
  return { grid: false, typed: false, numberListen: false, memory: false, memoryFound: 0, faces: new Map(), tapCount: 0 }
}

/** Fully inside the window (no part of it cut off by the viewport). */
export async function inWindow(loc: Locator): Promise<boolean> {
  return loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth
  }).catch(() => false)
}

/** Waits until the element stops moving (an entrance animation of a view, a card that grows): two equal rects 120 ms apart,
    at most 3 s. Without it a reachability check can read the element in the middle of its animation. */
export async function settleRect(loc: Locator): Promise<void> {
  const rect = () => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return `${r.top},${r.bottom},${r.left},${r.right}` }).catch(() => '')
  let last = await rect()
  for (let k = 0; k < 25; k++) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    const now = await rect()
    if (now === last) return
    last = now
  }
}

/** Taps an element that must be reachable: visible in the window, or brought there with «⬇ Más abajo». The tap is
    element.click(); when the element cannot be reached the test fails here (a stuck button is a bug, not a scroll). */
export async function tapReachable(page: Page, loc: Locator, label: string): Promise<void> {
  await loc.waitFor({ state: 'attached', timeout: 15_000 })
  await settleRect(loc)
  for (let k = 0; k < 4 && !(await inWindow(loc)); k++) {
    // «⬇ Más abajo» is checked every half second: give it a moment to show after a change of the layout.
    const more = page.getByRole('button', { name: 'Ver lo de abajo' })
    await more.waitFor({ state: 'visible', timeout: 1_200 }).catch(() => undefined)
    if (!(await more.isVisible().catch(() => false))) break
    await more.dispatchEvent('click')
    await settle(page, 500)
  }
  const rect = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), window.innerHeight, Math.round(r.left), Math.round(r.right), window.innerWidth].join(',') }).catch((e: Error) => `error ${e.message.slice(0, 120)}`)
  expect(await inWindow(loc), `${label} is visible or reachable with «⬇ Más abajo» (top,bottom,innerHeight,left,right,innerWidth: ${rect})`).toBe(true)
  await loc.evaluate((el) => (el as HTMLElement).click())
}

/** «Comprobar» when it is enabled. Returns true when it was pressed. */
async function checkIfReady(page: Page): Promise<boolean> {
  const check = page.getByRole('button', { name: /Comprobar/ }).last()
  if (!(await check.isVisible().catch(() => false)) || !(await check.isEnabled().catch(() => false))) return false
  await tapReachable(page, check, '«Comprobar»')
  return true
}

/** The advance button, when it is enabled: tapped after the reachability check. */
async function advanceOnce(page: Page): Promise<boolean> {
  const buttons = page.getByRole('button', { name: ADVANCE })
  const n = await buttons.count()
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i)
    if (await b.isVisible().catch(() => false) && await b.isEnabled().catch(() => false)) {
      const label = ((await b.innerText().catch(() => '')) ?? '').trim()
      await tapReachable(page, b, `«${label}»`)
      return true
    }
  }
  return false
}

/** A typed word: the English word the screen asks for (the number written out, or the Spanish word of the card), typed with
    the letter keyboard (the pen keyboard on a touch screen, the physical one otherwise), then «Comprobar». */
async function typeWord(page: Page, seen: EnglishSeen, kit: EnglishKit): Promise<boolean> {
  const word = page.getByRole('textbox', { name: /^Escribe (la palabra|el número) en inglés$/ })
  if (!(await word.isVisible().catch(() => false))) return false
  seen.typed = true
  // The typed text is the live region of the box (the placeholder «Escribe aquí» is a separate, hidden span).
  const current = ((await word.evaluate((el) => ('value' in el ? String((el as HTMLInputElement).value) : (el.querySelector('[aria-live]')?.textContent ?? ''))).catch(() => '')) ?? '').trim()
  if (!current) {
    const digits = ((await page.locator('[aria-label^="Número "]').first().getAttribute('aria-label').catch(() => null)) ?? '').replace('Número ', '')
    const spanish = ((await page.locator('[aria-label^="Palabra: "]').first().getAttribute('aria-label').catch(() => null)) ?? '').replace('Palabra: ', '')
    const target = (digits && kit.numbers.get(digits)) || kit.words.get(spanish) || 'ab'
    const toggle = page.getByRole('button', { name: 'Usar el teclado de letras' })
    if (await toggle.isVisible().catch(() => false)) await tapReachable(page, toggle, '«Usar el teclado de letras»')
    const pad = page.getByRole('group', { name: 'Teclado de letras' })
    if (await pad.isVisible().catch(() => false)) {
      for (const ch of target.replace(/[^a-zA-Z]/g, '').toLowerCase()) await tapReachable(page, pad.getByRole('button', { name: ch, exact: true }), `la letra «${ch}»`)
    } else {
      await word.evaluate((el) => (el as HTMLElement).focus())
      await page.keyboard.type(target.replace(/[^a-zA-Z]/g, '').toLowerCase())
    }
    await settle(page, 150)
  }
  if (!(await checkIfReady(page))) await settle(page, 200)
  return true
}

/** A digit: the number keypad (or the physical keys) takes a 2, then «Comprobar». */
async function numberAnswer(page: Page): Promise<boolean> {
  const pad = page.getByRole('group', { name: 'Teclado de números' })
  if (await pad.isVisible().catch(() => false)) {
    if (await checkIfReady(page)) return true
    await tapReachable(page, pad.getByRole('button', { name: '2', exact: true }), 'el dígito «2»')
    return true
  }
  // No keypad (a keyboard device): the digit is typed in the number box, then Enter.
  const box = page.getByRole('textbox', { name: /Número que oyes|Resultado de la operación/ })
  if (!(await box.isVisible().catch(() => false))) return false
  if (((await box.inputValue().catch(() => '')) ?? '') === '') {
    await box.evaluate((el) => (el as HTMLElement).focus())
    await page.keyboard.type('2')
    await page.keyboard.press('Enter')
  }
  return true
}

/** The options of the views that choose: the words, the pictures, the letter tiles. Each tap takes the next enabled one (in
    turn), and «Comprobar» is pressed as soon as it is enabled. */
async function optionAnswer(page: Page, seen: EnglishSeen, kit: EnglishKit): Promise<boolean> {
  // The match view (a word, then its picture): the word tapped is paired with the picture of its partner (the emoji of the
  // vocabulary), so that «Comprobar» is reached with every word paired.
  const words = page.getByRole('group', { name: 'Palabras' }).getByRole('button')
  if (await page.getByRole('group', { name: 'Dibujos' }).isVisible().catch(() => false) && (await words.count()) > 0) {
    if (await checkIfReady(page)) return true
    const picked = await words.evaluateAll((els) => els.findIndex((el) => el.getAttribute('aria-pressed') === 'true'))
    if (picked >= 0) {
      const word = ((await words.nth(picked).textContent()) ?? '').trim()
      const emoji = kit.partner.get(word) ?? ''
      const cards = page.getByRole('group', { name: 'Dibujos' }).getByRole('button')
      const card = emoji ? cards.filter({ hasText: emoji }).first() : cards.first()
      await tapReachable(page, card, `el dibujo de «${word}»`)
      return true
    }
    const free = await words.evaluateAll((els) => els.findIndex((el) => !(el.className || '').includes('paired')))
    if (free < 0) return false
    await tapReachable(page, words.nth(free), 'una palabra')
    return true
  }
  const sel = '[role="group"][aria-label="Palabras"] button, [role="group"][aria-label="Dibujos"] button, [role="group"][aria-label="Letras"] button, [role="radiogroup"] button'
  const options = page.locator(sel)
  const enabled = await options.evaluateAll((els) => els.map((el, i) => ((el as HTMLButtonElement).disabled ? -1 : i)).filter((i) => i >= 0))
  if (enabled.length === 0) return false
  if (await checkIfReady(page)) return true
  const at = enabled[seen.tapCount % enabled.length]
  seen.tapCount += 1
  await tapReachable(page, options.nth(at), 'una opción')
  await settle(page, 120)
  return true
}

/** The memory game: turns two cards at a time, and keeps the faces it has seen (a picture and its word are a pair; the
    pairs come from the vocabulary, passed in as `partner`). A card left face down is «?». */
async function memoryTurn(page: Page, partner: Map<string, string>, seen: EnglishSeen): Promise<boolean> {
  const grid = page.getByRole('group', { name: 'Cartas' })
  if (!(await grid.isVisible().catch(() => false))) return false
  seen.memory = true
  const cards = grid.getByRole('button')
  const n = await cards.count()
  const state = await cards.evaluateAll((els) => els.map((el) => ({
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), disabled: (el as HTMLButtonElement).disabled,
  })))
  seen.memoryFound = state.filter((c) => c.disabled && c.text !== '?').length / 2
  if (state.every((c) => c.disabled)) return false
  const known = seen.faces
  state.forEach((c, i) => { if (c.text !== '?') known.set(i, c.text) })
  const up = state.map((c, i) => (c.text !== '?' && !c.disabled ? i : -1)).filter((i) => i >= 0)
  const faceDown = (i: number) => !state[i].disabled && state[i].text === '?'
  const pickPartner = (x: number): number | undefined => {
    const want = partner.get(known.get(x) ?? '')
    if (!want) return undefined
    for (const [i, t] of known) if (i !== x && t === want && !state[i].disabled && faceDown(i)) return i
    return undefined
  }
  let target: number | undefined
  if (up.length === 1) target = pickPartner(up[0])
  if (target === undefined && up.length === 0) {
    // Two known faces that are a pair (both face down): turn the first now, its partner next time.
    for (const [i, t] of known) {
      if (!faceDown(i)) continue
      const want = partner.get(t)
      if (want && [...known.values()].includes(want)) { target = i; break }
    }
  }
  if (target === undefined) {
    for (let i = 0; i < n; i++) if (faceDown(i)) { target = i; break }
  }
  if (target === undefined) return false
  await tapReachable(page, cards.nth(target), `la carta ${target + 1}`)
  return true
}

/** The state of the screen for the journey: a grid, a typed word, a number to listen to, the memory cards. */
async function noteViews(page: Page, seen: EnglishSeen): Promise<void> {
  if (await page.getByRole('list', { name: /^(Palabras|Números) de hoy$/ }).isVisible().catch(() => false)) seen.grid = true
  if (await page.getByText('Escucha el número y escríbelo con cifras').isVisible().catch(() => false)) seen.numberListen = true
}

/** Plays whatever is on screen, one step at a time, until `done()`. */
export async function playEnglish(page: Page, done: () => Promise<boolean>, seen: EnglishSeen, kit: EnglishKit, maxSteps = 500): Promise<void> {
  for (let i = 0; i < maxSteps; i++) {
    if (await done()) return
    await noteViews(page, seen)
    if (await advanceOnce(page)) { await settle(page, 200); continue }
    if (await memoryTurn(page, kit.partner, seen)) { await settle(page, 200); continue }
    if (await typeWord(page, seen, kit)) { continue }
    if (await numberAnswer(page)) { await settle(page, 200); continue }
    if (await optionAnswer(page, seen, kit)) { await settle(page, 200); continue }
    await settle(page, 300)
  }
  throw new Error('the English flow did not finish')
}

/** No sideways scroll: the page is no wider than the window. */
export async function noSidewaysScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}
