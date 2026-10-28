/* Journey Q: the lessons («clases») of 3.º with the new drawings, on real screens. One class per block is opened from its
   route (/play/clase/<topicId>), and its «para» and «ejemplo» steps are walked with «Siguiente». On every step the drawing is
   visible and whole (not cut by the board), the page does not scroll sideways and the board is at least 200 px tall. The walk
   runs at the project's own size and at a 360 × 740 phone; at the phone size the four notes of the money step are not
   clipped. No audio: the voice is off in the seed.

   Screenshots (not committed): with CLASES_SHOT_DIR set, the android project at 360 × 740 saves each walked step as
   <dir>/<topic>-<step>.png for the topics in CLASES_SHOT_TOPICS (comma list, default: the ten walked here). */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { devSettings, seedDemo, settle } from '../helpers'

/** One class per block of 3.º (numeros, tablas, problemas, mental, fracciones, dinero, tiempo, medida, geometria, datos). */
const CLASS_TOPICS = ['redondear', 'tabla-7', 'prob-dos-pasos', 'compensar', 'fracciones-mitad-cuarto', 'pagar-cambio', 'reloj-5-minutos', 'regla', 'angulos-clase', 'graficos']
const PHONE = { width: 360, height: 740 }
const MIN_BOARD_HEIGHT = 200
const SHOT_DIR = process.env.CLASES_SHOT_DIR
const SHOT_TOPICS = process.env.CLASES_SHOT_TOPICS?.split(',').map((t) => t.trim()).filter(Boolean) ?? CLASS_TOPICS

/** The lesson's drawing area («board») and the frame that holds the current step's drawing. */
const board = (page: Page): Locator => page.locator('main [class*="board"]').first()

/** Opens the class of a topic: the intro card, then «¡Empezar la clase!». The voice is off in the seed (no audio). */
async function openClass(page: Page, topic: string): Promise<void> {
  await seedDemo(page)
  await devSettings(page, { voice: false, storyVoice: false })
  await page.goto(`/play/clase/${topic}`)
  await page.getByRole('button', { name: '¡Empezar la clase!' }).click()
  await expect(page.getByRole('progressbar', { name: /Paso 1 de/ })).toBeVisible()
}

/** The drawing of the step is visible, the page does not scroll sideways and the board is tall enough. */
async function expectStepOnScreen(page: Page, where: string): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${where}: horizontal overflow`).toBeLessThanOrEqual(0)
  const frame = board(page).locator(':scope > div').first()
  await expect(frame, `${where}: drawing frame`).toBeVisible()
  await expect(frame.locator('*').filter({ visible: true }).first(), `${where}: drawing`).toBeVisible()
  const box = await board(page).boundingBox()
  expect(box?.height ?? 0, `${where}: board height`).toBeGreaterThanOrEqual(MIN_BOARD_HEIGHT)
  // Nothing drawn sticks out of the board, which hides the overflow: a cut chart or card is a failure.
  const cut = await board(page).evaluate((el) => {
    const outer = el.getBoundingClientRect()
    const out: string[] = []
    el.querySelectorAll('*').forEach((node) => {
      if (!(node instanceof HTMLElement || node instanceof SVGSVGElement)) return
      const r = node.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      if (r.left < outer.left - 1 || r.right > outer.right + 1 || r.top < outer.top - 1 || r.bottom > outer.bottom + 1) out.push(node.tagName)
    })
    return out
  })
  expect(cut, `${where}: drawing cut by the board`).toEqual([])
}

/** Walks the «para» and «ejemplo» steps: «Siguiente» stays enabled on them and is disabled on the first practice try. */
async function walkExplanation(page: Page, topic: string, shotDir?: string): Promise<number> {
  const next = page.getByRole('button', { name: 'Siguiente ›' })
  let step = 0
  for (; step < 12; step++) {
    await settle(page, 350)
    if (!(await next.isEnabled())) break
    await expectStepOnScreen(page, `${topic} step ${step + 1}`)
    if (shotDir) await page.screenshot({ path: join(shotDir, `${topic}-${step + 1}.png`) })
    await next.click()
  }
  expect(step, `${topic}: the explanation has two or more steps`).toBeGreaterThanOrEqual(2)
  return step
}

const SHOT_RUN = !!SHOT_DIR

test.describe('clases de 3.º en pantalla (tamaño del proyecto)', () => {
  test.skip(SHOT_RUN, 'screenshot run')
  for (const topic of CLASS_TOPICS) {
    test(`«${topic}»: para y ejemplo se ven y caben`, async ({ page }) => {
      await openClass(page, topic)
      await walkExplanation(page, topic)
    })
  }
})

test.describe('clases de 3.º en un móvil de 360 × 740', () => {
  test.use({ viewport: PHONE })
  test.skip(SHOT_RUN, 'screenshot run')
  for (const topic of CLASS_TOPICS) {
    test(`«${topic}»: para y ejemplo caben en 360 × 740`, async ({ page }) => {
      await openClass(page, topic)
      await walkExplanation(page, topic)
    })
  }

  test('los cuatro billetes de «Dinero» no se cortan en 360 × 740', async ({ page }) => {
    await openClass(page, 'monedas-billetes')
    const next = page.getByRole('button', { name: 'Siguiente ›' })
    const notes = page.locator('[data-piece="500"], [data-piece="1000"], [data-piece="2000"], [data-piece="5000"]')
    for (let i = 0; i < 8 && (await notes.count()) < 4; i++) {
      await settle(page, 300)
      await next.click()
    }
    await settle(page, 400)
    await expect(notes).toHaveCount(4)
    const row = notes.first().locator('xpath=..')
    const rowBox = await row.boundingBox()
    expect(rowBox, 'the row of notes is drawn').not.toBeNull()
    expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(PHONE.width)
    expect(await row.evaluate((el) => el.scrollWidth - el.clientWidth), 'the row does not clip its notes').toBeLessThanOrEqual(1)
    for (let i = 0; i < 4; i++) {
      const piece = await notes.nth(i).boundingBox()
      expect(piece, `note ${i + 1} is drawn`).not.toBeNull()
      expect(piece!.x, `note ${i + 1} inside the row (left)`).toBeGreaterThanOrEqual(rowBox!.x - 1)
      expect(piece!.x + piece!.width, `note ${i + 1} inside the row (right)`).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1)
    }
    await expectStepOnScreen(page, 'four notes')
  })
})

test.describe('capturas de las clases (solo con CLASES_SHOT_DIR)', () => {
  test.skip(!SHOT_RUN, 'set CLASES_SHOT_DIR to save the screenshots')
  test.use({ viewport: PHONE })
  for (const topic of SHOT_TOPICS) {
    test(`captura «${topic}»`, async ({ page }, info) => {
      test.skip(info.project.name !== 'android', 'one screenshot run')
      mkdirSync(SHOT_DIR!, { recursive: true })
      await openClass(page, topic)
      await walkExplanation(page, topic, SHOT_DIR)
    })
  }
})
