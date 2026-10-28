/* Shared helpers for the journey specs. Everything is driven through roles and visible Spanish text; the only
   non-semantic hooks are the dev helpers on window.__numeriaDev (dev server only) and the data-testid of the
   handwriting e2e gallery. */
import { expect, type Locator, type Page } from '@playwright/test'

export const CHILD_NAME = 'Lía'
export const PET_NAME = 'Luna'

/** Pauses so that a slow CI machine or an animation can settle before the next interaction. */
// Each Playwright test gets a fresh browser context, so IndexedDB and localStorage start empty ("new device").
export const settle = (page: Page, ms = 250) => page.waitForTimeout(ms)

/** Seeds the demo child "Lía" (dev helper) and reloads so the app reads it. */
export async function seedDemo(page: Page, route = '/kids'): Promise<void> {
  await page.goto(route)
  await page.evaluate(async () => {
    if (!window.__numeriaDev) throw new Error('window.__numeriaDev missing: run the dev server (npm run dev) for seeded journeys')
    await window.__numeriaDev.seed()
  })
  await page.goto(route)
}

/** Creates a child through the real onboarding (/kids/new), skipping handwriting calibration, and lands on /play
 *  after the prologue. The prologue is played by tapping the story. */
export async function createChildThroughOnboarding(page: Page, name = CHILD_NAME, grade?: number): Promise<void> {
  await page.goto('/kids/new')
  await page.getByRole('textbox', { name: 'Tu nombre' }).fill(name)
  await page.getByRole('button', { name: 'Siguiente ›' }).click()
  await page.getByRole('button', { name: 'Como a una niña' }).click()
  await page.getByRole('button', { name: grade ? `${grade}º de Primaria` : 'No lo sé' }).click()
  await page.getByRole('group', { name: 'Compañeros' }).getByRole('button').first().click()
  await page.getByRole('group', { name: 'Colores' }).getByRole('button').first().click()
  await page.getByRole('textbox', { name: 'Nombre del compañero' }).fill(PET_NAME)
  await page.getByRole('button', { name: 'Siguiente ›' }).click()
  await page.getByRole('button', { name: 'Es una niña' }).click()
  await page.getByRole('button', { name: '¡Vamos!' }).click()
  // Handwriting calibration is only offered where the child writes (touch or pen), not with the keypad.
  const skip = page.getByRole('button', { name: 'Ahora no' })
  await skip.or(page.getByRole('button', { name: 'Seguir la historia' })).first().waitFor()
  if (await skip.isVisible()) await skip.click()
  await tapStoryUntil(page, /\/play$/)
}

/** Taps the story stage until the URL matches, or the story is gone. */
export async function tapStoryUntil(page: Page, url: RegExp, maxTaps = 120): Promise<void> {
  for (let i = 0; i < maxTaps; i++) {
    if (url.test(new URL(page.url()).pathname)) return
    const stage = page.getByRole('button', { name: 'Seguir la historia' })
    if (await stage.isVisible().catch(() => false)) {
      await stage.click({ position: { x: 20, y: 20 } }).catch(() => undefined)
      await settle(page, 180)
    } else {
      await settle(page, 300)
    }
  }
  await expect(page).toHaveURL(url, { timeout: 15_000 })
}

/** Reads the 2-factor question from a NumberInput aria-label such as "Producto de 6 por 7". */
export function answerFor(label: string): number | null {
  const mul = label.match(/Producto de (\d+) por (\d+)/)
  if (mul) return Number(mul[1]) * Number(mul[2])
  const div = label.match(/Cociente de (\d+) entre (\d+)/)
  if (div) return Number(div[1]) / Number(div[2])
  return null
}

/** Types a number with the physical keyboard into a NumberInput and submits it with Enter. */
export async function typeAnswer(page: Page, input: Locator, value: number): Promise<void> {
  await input.click()
  await page.keyboard.type(String(value))
  await page.keyboard.press('Enter')
}

/** Tap a button by its visible Spanish name, waiting for it to be enabled. */
export async function tapButton(page: Page, name: string | RegExp, timeout = 15_000): Promise<void> {
  const b = page.getByRole('button', { name }).first()
  await expect(b).toBeEnabled({ timeout })
  await b.click()
}

/** Walks the reward overlay (stars, stickers) and returns to the map. */
export async function continueFromReward(page: Page): Promise<void> {
  await tapButton(page, /¡Seguir!|Seguir/)
}

/** Taps the story stage until a button with this name shows up (used when a story is the end of a node). */
export async function tapStoryUntilButton(page: Page, name: string | RegExp, maxTaps = 120): Promise<void> {
  for (let i = 0; i < maxTaps; i++) {
    if (await page.getByRole('button', { name }).first().isVisible().catch(() => false)) return
    const stage = page.getByRole('button', { name: 'Seguir la historia' })
    if (await stage.isVisible().catch(() => false)) {
      await stage.click({ position: { x: 20, y: 20 } }).catch(() => undefined)
    }
    await settle(page, 200)
  }
  await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 10_000 })
}

export type DevProgressEdit =
  | { kind: 'stars'; amount: number }
  | { kind: 'worldDoneBeforeGuardian'; worldId: string }

/** Dev-only shortcut: edits the active child's progress through the app's own data and content modules (the
 *  dynamic imports resolve to the same module instances the page uses). Used to reach late nodes quickly; the
 *  journey itself is then played through the UI. Requires the Vite dev server. */
export async function devEditProgress(page: Page, edit: DevProgressEdit): Promise<void> {
  await page.evaluate(async (e) => {
    const data = await import('/src/data/index.ts')
    const content = await import('/src/content/index.ts')
    const dev = window.__numeriaDev
    if (!dev) throw new Error('window.__numeriaDev missing: run the dev server for seeded journeys')
    const children = await dev.db.children.toArray()
    const child = children.find((c) => !c.deletedAt)
    if (!child) throw new Error('no child on this device')
    if (e.kind === 'stars') {
      await data.updateProgress(child.id, (p) => ({ ...p, stars: p.stars + e.amount }))
      return
    }
    const world = content.getWorld(e.worldId)
    if (!world) throw new Error(`unknown world ${e.worldId}`)
    const guardian = world.nodes.find((n) => n.kind === 'guardian')
    await data.updateProgress(child.id, (p) => {
      let next = p
      for (const n of world.nodes) {
        if (n.id === guardian?.id) continue
        next = content.applyNodeResult(next, world.id, n.id, { stars: 3, passed: true })
      }
      return next
    })
  }, edit)
}

/** Dev-only shortcut: masters the active child's topics in teaching order until `topicId` is the current topic (the
 *  one «Hoy» and «Lo nuevo» teach), so a topic with a class can be reached. Same rule as the app's currentTopic. */
export async function devMasterUntilTopic(page: Page, topicId: string): Promise<void> {
  await page.evaluate(async (target) => {
    const data = await import('/src/data/index.ts')
    const syllabus = await import('/src/content/syllabus/index.ts')
    const dev = window.__numeriaDev
    if (!dev) throw new Error('window.__numeriaDev missing: run the dev server for seeded journeys')
    const child = (await dev.db.children.toArray()).find((c) => !c.deletedAt)
    if (!child) throw new Error('no child on this device')
    // A Lengua topic (lng-…) is walked through the Lengua temario of the same course.
    const course = target.startsWith('lng-') ? syllabus.syllabusFor('language', child.grade) : syllabus.syllabusForGrade(child.grade)
    const map = { ...(await data.getMastery(child.id)) }
    const rows: Parameters<typeof data.saveMastery>[1] = []
    for (let i = 0; i < 300; i++) {
      const topic = syllabus.currentTopic(course, map)
      if (!topic || topic.id === target) break
      for (const skill of topic.skills) {
        const row = {
          skill, box: 5 as const, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null,
          updatedAt: new Date().toISOString(),
        }
        map[skill] = row
        rows.push(row)
      }
    }
    await data.saveMastery(child.id, rows)
  }, topicId)
}

/** The active child's id (first profile on this device). */
export async function activeChildId(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const dev = window.__numeriaDev
    if (!dev) throw new Error('window.__numeriaDev missing')
    const child = (await dev.db.children.toArray()).find((c) => !c.deletedAt)
    if (!child) throw new Error('no child on this device')
    return child.id
  })
}

/** Solves the on-screen equation "a × b = c" / "a ÷ b = c" where one term is the blank (missing-number exercises).
 *  The blank may show as "?" or as the input's placeholder text. Reads the visible text of the page's main region.
 *  Returns null when no such equation is on screen. */
export async function solveVisibleEquation(page: Page): Promise<number | null> {
  // The on-screen keypad can sit inside the equation (desktop keypad mode); its digits are not part of it.
  const text = ((await page.locator('main').first().evaluate((main) => {
    const copy = main.cloneNode(true) as HTMLElement
    copy.querySelectorAll('[data-ink-keypad]').forEach((k) => k.remove())
    document.body.append(copy)
    const t = copy.innerText
    copy.remove()
    return t
  }).catch(() => '')) ?? '').replace(/\s+/g, ' ')
  // left operand known: "8 × [blank] = 40"
  const known = [...text.matchAll(/(\d+)\s*([×÷])\s*(\?|\d+|[^\d=]{1,40}?)\s*=\s*(\d+)/g)].at(-1)
  if (known) {
    const [, a, op, b, c] = known
    const blank = !/^\d+$/.test(b)
    if (op === '×') return blank ? Number(c) / Number(a) : Number(a) * Number(b)
    return blank ? Number(a) / Number(c) : Number(a) / Number(b)
  }
  // right operand known: "[blank] × 5 = 40"
  const right = [...text.matchAll(/([^\d=]{1,40}?|\?)\s*([×÷])\s*(\d+)\s*=\s*(\d+)/g)].at(-1)
  if (right) {
    const [, , op, b, c] = right
    return op === '×' ? Number(c) / Number(b) : Number(c) * Number(b)
  }
  return null
}

/** The answer for whatever number input is on screen: the input's own label first, then the visible equation. */
export async function answerForVisibleInput(page: Page, field: Locator): Promise<number | null> {
  const aria = (await field.getAttribute('aria-label')) ?? ''
  const fromLabel = answerFor(aria)
  if (fromLabel !== null) return fromLabel
  // Descomponer (4 325 = 4 000 + 300 + 20 + 5): the value of one place of the number on screen.
  const place = aria.match(/^Valor de (?:los|las) (millares|centenas|decenas|unidades)$/)
  if (place) {
    const shown = await page.locator('section[aria-label="Números hasta 9 999"] p').nth(1).innerText().catch(() => '')
    const n = Number(shown.replace(/\D/g, ''))
    const size = { millares: 1000, centenas: 100, decenas: 10, unidades: 1 }[place[1] as 'millares']
    return Math.floor(n / size) % 10 * size
  }
  return solveVisibleEquation(page)
}

/** True when a story or a reward screen (end of a node) is on screen. */
export async function nodeFinished(page: Page): Promise<boolean> {
  for (const probe of [
    page.getByRole('button', { name: '¡Seguir!' }),
    page.getByRole('button', { name: 'Seguir la historia' }),
  ]) {
    if (await probe.isVisible().catch(() => false)) return true
  }
  return false
}

/** Objects still to count: groups label them "… sin contar"; array grids name each object by its position and use
 *  aria-pressed for the counted state. */
export const UNCOUNTED = '[aria-label$="sin contar"], section[aria-label="Filas y columnas"] [role="group"] > button[aria-pressed="false"]'

/** Plays exercises on screen the way a child would, one step at a time, until `finished()` says the node is over:
 *  - objects to group or count are tapped ("sin colocar", "sin contar"), then "¡Ya están!" is pressed,
 *  - the total or the missing number is written on the keyboard (from the prompt, the input label or the equation),
 *  - "Siguiente", "Ver el hechizo" or "Probar otra vez" move on. */
export async function driveExercises(page: Page, finished: () => Promise<boolean>, maxSteps = 400): Promise<void> {
  for (let i = 0; i < maxSteps; i++) {
    if (await finished()) return
    const advance = page.getByRole('button', { name: /^(Siguiente|Ver el hechizo|Probar otra vez)/ }).first()
    if (await advance.isVisible().catch(() => false)) {
      await advance.click()
      await settle(page, 300)
      continue
    }
    const token = page.locator('button[aria-label$="sin colocar"]').first()
    if (await token.isVisible().catch(() => false)) {
      await token.click()
      await settle(page, 100)
      continue
    }
    const done = page.getByRole('button', { name: /^¡Ya están/ })
    if (await done.isVisible().catch(() => false)) {
      await done.click()
      await settle(page, 200)
      continue
    }
    const counted = page.locator(UNCOUNTED).first()
    if (await counted.isVisible().catch(() => false)) {
      await counted.click()
      await settle(page, 100)
      continue
    }
    if (await answerChoice(page)) {
      await settle(page, 300)
      continue
    }
    const field = await firstEmptyTextbox(page)
    if (field) {
      const value = await answerFromPrompt(page) ?? (await answerForVisibleInput(page, field))
      if (value === null) throw new Error(`cannot solve the exercise "${(await field.getAttribute('aria-label')) ?? ''}" (screen: ${((await page.locator('main').first().innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').slice(0, 200)})`)
      await typeAnswer(page, field, value)
      await settle(page, 300)
      continue
    }
    await settle(page, 300)
  }
  throw new Error('exercises did not finish')
}

/** The first visible answer box still empty (a view can show several, e.g. the parts of a number). */
async function firstEmptyTextbox(page: Page): Promise<Locator | null> {
  const boxes = page.getByRole('textbox')
  const n = await boxes.count()
  for (let i = 0; i < n; i++) {
    const box = boxes.nth(i)
    if (!(await box.isVisible().catch(() => false))) continue
    // A real <input> has a value; the writing pad is a role=textbox with no digit while it is empty («?», «Escribe con el dedo»).
    const value = await box.inputValue().catch(async () => ((await box.innerText().catch(() => '')) ?? '').replace(/\D/g, ''))
    if (value === '') return box
  }
  return null
}

/** Exercises answered with a button and «Comprobar»: the sign between two numbers, and the value of a coin or note.
 *  Returns true when it answered. */
export async function answerChoice(page: Page): Promise<boolean> {
  const check = page.getByRole('button', { name: /Comprobar/ }).last()
  const compare = page.locator('section[aria-label="Comparar números"]')
  if (await compare.isVisible().catch(() => false) && await check.isEnabled().catch(() => false) === false) {
    const [a, b] = (await compare.locator('span span').allInnerTexts()).map((t) => Number(t.replace(/\D/g, '')))
    await compare.getByRole('button', { name: a < b ? 'menor que' : a > b ? 'mayor que' : 'igual a' }).click()
    await check.click()
    return true
  }
  const piece = page.getByRole('img', { name: /^(Moneda|Billete) de / }).first()
  const options = page.getByRole('group', { name: 'Valor' })
  if (await piece.isVisible().catch(() => false) && await options.isVisible().catch(() => false) && await check.isEnabled().catch(() => false) === false) {
    const name = ((await piece.getAttribute('aria-label')) ?? '').replace(/^(Moneda|Billete) de /, '')
    await options.getByRole('button', { name, exact: true }).click()
    await check.click()
    return true
  }
  return false
}

/** Counting prompts: "Hay 2 grupos de 3", "Haz 5 grupos de 4", "Hay 6 filas de 2". */
export async function answerFromPrompt(page: Page): Promise<number | null> {
  const text = ((await page.locator('main').first().innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ')
  const m = text.match(/(\d+) (?:grupos|filas) de (\d+)/)
  return m ? Number(m[1]) * Number(m[2]) : null
}

/** Dev-only: changes settings of the active child (the adult area does the same through their cards). Only the keys given
    change: `subjects`, `voice` (the lesson narration), `storyVoice` (the stories read aloud), and so on. */
export async function devSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate(async (p) => {
    const data = await import('/src/data/index.ts')
    const dev = window.__numeriaDev
    if (!dev) throw new Error('window.__numeriaDev missing: run the dev server for seeded journeys')
    const child = (await dev.db.children.toArray()).find((c) => !c.deletedAt)
    if (!child) throw new Error('no child on this device')
    await data.updateChild(child.id, { settings: { ...child.settings, ...p } })
  }, patch)
}

/** Dev-only: sets one progress flag of the active child (e.g. a class done, so the test starts after it). */
export async function devFlag(page: Page, key: string, value = true): Promise<void> {
  await page.evaluate(async ([k, v]) => {
    const data = await import('/src/data/index.ts')
    const dev = window.__numeriaDev
    if (!dev) throw new Error('window.__numeriaDev missing: run the dev server for seeded journeys')
    const child = (await dev.db.children.toArray()).find((c) => !c.deletedAt)
    if (!child) throw new Error('no child on this device')
    await data.updateProgress(child.id, (p) => ({ ...p, flags: { ...p.flags, [k]: v } }))
  }, [key, value] as const)
}
