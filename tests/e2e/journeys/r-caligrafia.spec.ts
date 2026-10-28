/* Journey R: Caligrafía con lápiz after the Lengua session, on the iPad projects only (touch, with the pen). Lía (3.º) has
   Lengua switched on and has used a pen on this device (penSeen): the Lengua session ends with the offer, the child takes it
   and writes each item of the day with pen pointer events along the exact model (the scorer gives 3 stars to every exact
   model). The pauta is checked to be fully on the screen with no horizontal scroll, at 1180 × 820 and 820 × 1180. Without
   penSeen the offer does not appear. No audio is played: voice is off, and the tests run muted.
   With E2E_SHOTS set, the screens are saved there (the offer, each step of an item, the result with its stars). */
import { expect, test, type Page } from '@playwright/test'
import { exactStrokes } from '../../../src/ink/cursive/fixtures'
import { joinWord } from '../../../src/ink/cursive/join'
import { fitPauta } from '../../../src/ink/cursive/score'
import { devFlag, devSettings, seedDemo } from '../helpers'
import { playUntil, sessionEnded } from '../lengua-driver'

const PEN_SEEN_KEY = 'numeria.ink.penSeen'
const PROJECTS = ['ipad', 'ipad-portrait']
const SHOTS = process.env.E2E_SHOTS

/** Marks this device as one where a pen has been used (what the app stores on the first pen stroke). */
async function penHasBeenSeen(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try { localStorage.setItem(key, '2026-10-01') } catch { /* storage blocked: the test shows it */ }
  }, PEN_SEEN_KEY)
}

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  const vp = page.viewportSize()
  await page.screenshot({ path: `${SHOTS}/${name}-${vp?.width}x${vp?.height}.png` })
}

/** The pauta is on the screen (the writing area inside the viewport) and the page does not scroll sideways. */
async function expectPautaOnScreen(page: Page): Promise<void> {
  const vp = page.viewportSize()
  const area = page.getByRole('img', { name: /^Zona para (repasar|escribir) / })
  const box = await area.boundingBox()
  expect(box, 'the writing area is on the page').not.toBeNull()
  expect(box!.x >= 0 && box!.x + box!.width <= (vp?.width ?? 0), 'the pauta fits the width').toBe(true)
  expect(box!.y >= 0 && box!.y + box!.height <= (vp?.height ?? 0), 'the pauta fits the height').toBe(true)
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(sideways, 'no horizontal scroll').toBe(true)
}

/** Writes the item on screen with pen pointer events along its exact model, mapped into the area with the pauta fit. */
async function writeExact(page: Page): Promise<string> {
  const area = page.getByRole('img', { name: /^Zona para escribir / })
  const text = ((await area.getAttribute('aria-label')) ?? '').replace('Zona para escribir ', '')
  const size = await area.evaluate((el) => ({ w: el.clientWidth, h: el.clientHeight }))
  const fit = fitPauta(size.w, size.h, joinWord(text).width)
  const strokes = exactStrokes(text).map((st) => st.map((p) => [p.x * fit.scale + fit.ox, p.y * fit.scale + fit.oy] as [number, number]))
  await area.evaluate((el: HTMLElement, all: [number, number][][]) => {
    const r = el.getBoundingClientRect()
    const ox = r.left + el.clientLeft
    const oy = r.top + el.clientTop
    const fire = (type: string, x: number, y: number, buttons: number) =>
      el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'pen', isPrimary: true,
        pressure: buttons ? 0.5 : 0, buttons, button: type === 'pointermove' ? -1 : 0, clientX: ox + x, clientY: oy + y,
      }))
    for (const poly of all) {
      fire('pointerdown', poly[0][0], poly[0][1], 1)
      for (const [x, y] of poly.slice(1)) fire('pointermove', x, y, 1)
      const [lx, ly] = poly[poly.length - 1]
      fire('pointerup', lx, ly, 0)
    }
  }, strokes)
  return text
}

/** One item of the day: Mirar → Repasar → Escribir sola with the exact model, «¡Listo!», and its result with 3 stars. */
async function writeItem(page: Page): Promise<string> {
  await expect(page.getByRole('heading', { name: 'Mira' })).toBeVisible()
  await shot(page, 'calig-mirar')
  await page.getByRole('button', { name: '¡A repasar!' }).click()
  const trace = page.getByRole('img', { name: /^Zona para repasar / })
  await expect(trace).toBeVisible()
  await expectPautaOnScreen(page)
  const traced = ((await trace.getAttribute('aria-label')) ?? '').replace('Zona para repasar ', '')
  await shot(page, `calig-repasar-${traced.replace(/\s/g, '_')}`)
  await page.getByRole('button', { name: '¡A escribir!' }).click()
  await expect(page.getByRole('img', { name: /^Zona para escribir / })).toBeVisible()
  await expectPautaOnScreen(page)
  await shot(page, 'calig-escribir')
  const text = await writeExact(page)
  await page.getByRole('button', { name: '¡Listo!' }).click()
  await expect(page.getByRole('img', { name: '3 de 3 estrellas' })).toBeVisible()
  await shot(page, `calig-resultado-${text.replace(/\s/g, '_')}`)
  await page.getByRole('button', { name: 'Siguiente' }).click()
  return text
}

test.describe('Caligrafía con lápiz', () => {
  test('after the Lengua session the child takes the offer and writes the day: 3 stars and ¡Terminado!', async ({ page }, info) => {
    test.skip(!PROJECTS.includes(info.project.name), 'iPad projects only (touch with the pen)')
    test.setTimeout(420_000)
    await penHasBeenSeen(page)
    await seedDemo(page)
    await devSettings(page, { subjects: ['math', 'language'], voice: false, storyVoice: false })
    // The first Lengua topic's class is done (as in journey P), so the session's intro is what opens.
    await devFlag(page, 'clase:lng-silabas')
    await page.goto('/play/lengua')
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    await playUntil(page, () => sessionEnded(page), 600)

    const offer = page.getByRole('group', { name: 'Caligrafía con lápiz' })
    await expect(offer).toBeVisible()
    await shot(page, 'calig-oferta')
    await page.getByRole('button', { name: 'Caligrafía (con lápiz)' }).click()
    await expect(page).toHaveURL(/\/play\/caligrafia$/)

    const written: string[] = []
    for (let i = 0; i < 3; i++) {
      if (await page.getByText('¡Terminado!', { exact: true }).isVisible().catch(() => false)) break
      written.push(await writeItem(page))
    }
    await expect(page.getByText('¡Terminado!', { exact: true })).toBeVisible({ timeout: 15_000 })
    expect(written.length, 'the day has 2 or 3 items').toBeGreaterThanOrEqual(2)
    await expect(page.getByText(new RegExp(`Has practicado ${written.length} cosas de letra ligada`))).toBeVisible()
    await expect(page.getByText(/\+2 estrellas para tu cuerno/)).toBeVisible()
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(sideways, 'no horizontal scroll at the end').toBe(true)
  })

  test('without penSeen the Lengua end does not offer the practice', async ({ page }, info) => {
    test.skip(!PROJECTS.includes(info.project.name), 'iPad projects only (touch with the pen)')
    test.setTimeout(420_000)
    await seedDemo(page)
    await devSettings(page, { subjects: ['math', 'language'], voice: false, storyVoice: false })
    // The first Lengua topic's class is done (as in journey P), so the session's intro is what opens.
    await devFlag(page, 'clase:lng-silabas')
    await page.goto('/play/lengua')
    await page.getByRole('button', { name: '¡Empezar!' }).click()
    await playUntil(page, () => sessionEnded(page), 600)

    await expect(page.getByRole('button', { name: 'Volver al inicio' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Caligrafía con lápiz' })).toHaveCount(0)
  })
})
