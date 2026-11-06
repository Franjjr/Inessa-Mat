/* The English driver of the e2e suite: plays an English class or session the way a child does (the words typed with the
   letter keyboard, the options tapped, the digits of a number, the memory cards turned, «Siguiente», «Comprobar»).
   Every tap is made with element.click() after a reachability check: the element must be inside the window, or brought
   there with the «⬇ Más abajo» button (its own dispatched click). Playwright's own clicks scroll by themselves and would
   hide a button stuck below the fold, so they are not used here. */
import { expect, type Locator, type Page } from '@playwright/test'
import { settle } from './helpers'

/** What the driver needs to answer right: the English word of each Spanish word, the English words of the numbers (read from
    the screen, as the child would), and the vocabulary (a memory or match card shows the English word, its picture, or the
    Spanish word when the picture has no emoji). */
export interface EnglishKit {
  words: Map<string, string>
  numbers: Map<string, string>
  cards: { es: string; en: string; emoji: string | null }[]
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
  /** The memory round the faces belong to: a new round (a new game on the screen) starts with no faces known. */
  memoryRound?: string
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
  // The window scroll is part of the position: «⬇ Más abajo» scrolls smoothly, so a rect read mid-scroll is not final.
  const rect = () => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return `${r.top},${r.bottom},${r.left},${r.right},${window.scrollY}` }).catch(() => '')
  let last = await rect()
  for (let k = 0; k < 25; k++) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    const now = await rect()
    if (now === last) return
    last = now
  }
}

/** One tap made by tapReachable: whether the element was in the window (possibly after «⬇ Más abajo»), and what the page
    looked like at that moment (a sideways scroll, an element cut by an overflow-hidden ancestor). */
export interface ReachRecord {
  label: string
  ok: boolean
  /** «⬇ Más abajo» was shown when the element was out of the window, and was tapped. */
  moreShown: boolean
  viaMore: boolean
  rect: string
  sideways: boolean
  clipped: string | null
}

/** Set by an audit run: every tap is recorded, and an element out of reach is recorded instead of failing the test. */
export const reach: { log: ReachRecord[]; soft: boolean } = { log: [], soft: false }

/** Taps an element that must be reachable: visible in the window, or brought there with «⬇ Más abajo». The tap is
    element.click(); when the element cannot be reached the test fails here (a stuck button is a bug, not a scroll). */
export async function tapReachable(page: Page, loc: Locator, label: string, opts: { click?: boolean } = {}): Promise<void> {
  await loc.waitFor({ state: 'attached', timeout: 15_000 })
  await settleRect(loc)
  let moreShown = false
  let viaMore = false
  for (let k = 0; k < 4 && !(await inWindow(loc)); k++) {
    // «⬇ Más abajo» is checked every half second: give it a moment to show after a change of the layout.
    const more = page.getByRole('button', { name: 'Ver lo de abajo' })
    await more.waitFor({ state: 'visible', timeout: 1_200 }).catch(() => undefined)
    moreShown = await more.isVisible().catch(() => false)
    if (!moreShown) break
    viaMore = true
    await more.dispatchEvent('click')
    await settleRect(loc)
  }
  const ok = await inWindow(loc)
  const info = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    let clipped: string | null = null
    // Each axis on its own: an overflow-x clip does not cut what overflows the box downwards (overflow-y visible).
    for (let a = el.parentElement; a && a !== document.body && !clipped; a = a.parentElement) {
      const cs = getComputedStyle(a)
      const clipX = /(hidden|clip)/.test(cs.overflowX)
      const clipY = /(hidden|clip)/.test(cs.overflowY)
      if (!clipX && !clipY) continue
      const ar = a.getBoundingClientRect()
      const cut = (clipX && (r.left < ar.left - 1 || r.right > ar.right + 1)) || (clipY && (r.top < ar.top - 1 || r.bottom > ar.bottom + 1))
      if (cut) clipped = String(a.className).slice(0, 60) || a.tagName
    }
    return {
      rect: [Math.round(r.top), Math.round(r.bottom), window.innerHeight, Math.round(r.left), Math.round(r.right), window.innerWidth].join(','),
      sideways: document.documentElement.scrollWidth > window.innerWidth,
      clipped,
    }
  }).catch((e: Error) => ({ rect: `error ${e.message.slice(0, 120)}`, sideways: false, clipped: null }))
  reach.log.push({ label, ok, moreShown, viaMore, rect: info.rect, sideways: info.sideways, clipped: info.clipped })
  if (!reach.soft) expect(ok, `${label} is visible or reachable with «⬇ Más abajo» (top,bottom,innerHeight,left,right,innerWidth: ${info.rect})`).toBe(true)
  if (opts.click !== false) await loc.evaluate((el) => (el as HTMLElement).click())
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
    // Read without waiting: a locator's getAttribute waits for a match, and the word and the number tries never have both,
    // so the driver would hang on the missing one (evaluateAll answers at once with what is on screen).
    const label = (prefix: string) => page.locator(`[aria-label^="${prefix}"]`).evaluateAll((els) => els[0]?.getAttribute('aria-label') ?? '').catch(() => '')
    const digits = ((await label('Número ')) ?? '').replace('Número ', '')
    const spanish = ((await label('Palabra: ')) ?? '').replace('Palabra: ', '')
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
      // The picture of the word: its emoji, or its Spanish word when the picture is only a word (the card shows that gloss).
      const entry = kit.cards.find((c) => c.en === word)
      const key = entry?.emoji ?? entry?.es ?? ''
      // Only a picture that is not paired yet: a tap on a paired one takes it from its word (the app's rule).
      const cards = page.getByRole('group', { name: 'Dibujos' }).getByRole('button')
      const pick = await cards.evaluateAll((els, k) => {
        const free = els.map((el, i) => ((el as HTMLElement).className.includes('paired') ? -1 : i)).filter((i) => i >= 0)
        const match = free.find((i) => (k !== '' && (els[i].textContent ?? '').includes(k)))
        return match ?? free[0] ?? -1
      }, key).catch(() => -1)
      if (pick < 0) return false
      await tapReachable(page, cards.nth(pick), `el dibujo de «${word}»`)
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

/** The memory game: one card per step, and the faces it has seen are kept by card position (a card face down again keeps its
    face in `seen.faces`). A card shows its English word, or its picture: the emoji, with the Spanish word when the picture has
    one, or only the Spanish word when it has no emoji. Two cards are a pair when they show the same English word. The policy:
    with one card face up, its partner when it is known and face down, else a card never seen, else a pair start; with two up
    (a mismatch, turned back by the next tap), a card never seen, else a pair start; with none up, a pair start, else a card never
    seen. A pair start is a face-down card whose known partner is face down: tapped alone, its partner is the next tap. A
    mismatch stays face up until the next tap (the app turns it back), so the first card of the next step starts the next turn. */
async function memoryTurn(page: Page, cards: EnglishKit['cards'], seen: EnglishSeen): Promise<boolean> {
  const grid = page.getByRole('group', { name: 'Cartas' })
  if (!(await grid.isVisible().catch(() => false))) return false
  seen.memory = true
  const round = await grid.evaluate((el) => {
    const e = el as HTMLElement
    if (!e.dataset.driverRound) e.dataset.driverRound = Math.random().toString(36).slice(2)
    return e.dataset.driverRound
  })
  if (round !== seen.memoryRound) { seen.faces.clear(); seen.memoryRound = round }
  const all = grid.getByRole('button')
  const n = await all.count()
  const state = await all.evaluateAll((els) => els.map((el) => ({
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), disabled: (el as HTMLButtonElement).disabled,
  })))
  seen.memoryFound = state.filter((c) => c.disabled && c.text !== '?').length / 2
  if (state.every((c) => c.disabled)) return false
  const known = seen.faces
  state.forEach((c, i) => { if (c.text !== '?') known.set(i, c.text) })
  /** The English word a card shows (undefined when the text is not a card of the vocabulary). */
  const wordOf = (text: string | undefined): string | undefined => {
    if (!text) return undefined
    const en = cards.find((c) => c.en === text)
    if (en) return en.en
    return cards.find((c) => (c.emoji && text.includes(c.emoji)) || (c.es && text.includes(c.es)))?.en
  }
  const up = state.map((c, i) => (c.text !== '?' && !c.disabled ? i : -1)).filter((i) => i >= 0)
  const faceDown = (i: number) => !state[i].disabled && state[i].text === '?'
  /** The face-down card whose known partner is `x` (undefined when the partner is not known or not face down). */
  const partnerOf = (x: number): number | undefined => {
    const want = wordOf(known.get(x))
    if (!want) return undefined
    for (const [i, t] of known) if (i !== x && faceDown(i) && wordOf(t) === want) return i
    return undefined
  }
  const unknown = (): number | undefined => { for (let i = 0; i < n; i++) if (faceDown(i) && !known.has(i)) return i; return undefined }
  /** A face-down card whose known partner is face down too: tapped alone, its partner is the next tap. */
  const pairStart = (): number | undefined => { for (const [i] of known) if (faceDown(i) && partnerOf(i) !== undefined) return i; return undefined }
  const anyDown = (): number | undefined => { for (let i = 0; i < n; i++) if (faceDown(i)) return i; return undefined }
  let target: number | undefined
  if (up.length === 1) target = partnerOf(up[0]) ?? unknown() ?? pairStart()
  else if (up.length === 2) target = unknown() ?? pairStart()
  else target = pairStart() ?? unknown()
  target ??= anyDown()
  if (target === undefined) return false
  if (DEBUG) console.log(`[ingles] memory ${JSON.stringify(state.map((c) => (c.disabled ? 'F' : c.text === '?' ? '?' : c.text)))} up=${up} -> ${target}`)
  await tapReachable(page, all.nth(target), `la carta ${target + 1}`)
  return true
}

/** The state of the screen for the journey: a grid, a typed word, a number to listen to, the memory cards. */
async function noteViews(page: Page, seen: EnglishSeen): Promise<void> {
  if (await page.getByRole('list', { name: /^(Palabras|Números) de hoy$/ }).isVisible().catch(() => false)) seen.grid = true
  if (await page.getByText('Escucha el número y escríbelo con cifras').isVisible().catch(() => false)) seen.numberListen = true
}

/** Set INGLES_DEBUG=1 to log each step of the driver (the branch taken and the screen) to the test output. */
const DEBUG = process.env.INGLES_DEBUG === '1'

/** One line per driver step: the branch taken, the screen title and the question on screen (only with INGLES_DEBUG). */
async function logStep(page: Page, step: number, branch: string): Promise<void> {
  if (!DEBUG) return
  const screen = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() ?? ''
    const question = document.querySelector('[role="region"] p, [role="status"] p, [class*="_blockChip_"]')?.textContent?.trim() ?? ''
    const progress = document.querySelector('[role="progressbar"]')?.getAttribute('aria-label') ?? ''
    return `${title} | ${question.slice(0, 60)} | ${progress}`
  }).catch(() => '?')
  console.log(`[ingles] step ${step} ${branch} :: ${screen}`)
}

/** Plays whatever is on screen, one step at a time, until `done()`. */
export async function playEnglish(page: Page, done: () => Promise<boolean>, seen: EnglishSeen, kit: EnglishKit, maxSteps = 500, hook?: (branch: string) => Promise<void>): Promise<void> {
  for (let i = 0; i < maxSteps; i++) {
    if (await done()) return
    await noteViews(page, seen)
    /** The branch taken at this step: logged (INGLES_DEBUG) and passed to the hook (an audit takes its screenshots there). */
    const took = async (branch: string) => { await logStep(page, i, branch); await hook?.(branch) }
    if (await advanceOnce(page)) { await took('advance'); await settle(page, 200); continue }
    if (await memoryTurn(page, kit.cards, seen)) { await took('memory'); await settle(page, 200); continue }
    if (await typeWord(page, seen, kit)) { await took('typeWord'); continue }
    if (await numberAnswer(page)) { await took('number'); await settle(page, 200); continue }
    if (await optionAnswer(page, seen, kit)) { await took('option'); await settle(page, 200); continue }
    await took('wait')
    await settle(page, 300)
  }
  const screen = await page.evaluate(() => (document.querySelector('main')?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 240)).catch(() => '?')
  throw new Error(`the English flow did not finish (the screen: ${screen})`)
}

/** No sideways scroll: the page is no wider than the window. */
export async function noSidewaysScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}
