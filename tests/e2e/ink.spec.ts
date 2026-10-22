/* E2E for the ink module: draws digits with synthetic Apple-Pencil PointerEvents (pointerType 'pen') into the
   live DigitCell / NumberInput of the gallery (/dev/gallery?only=src/ink) and checks the recognised value.
   Recognition tests are skipped (with a clear message) while public/models/digits/model.json is missing.
   Run with the dev server up:  npx playwright test tests/e2e/ink.spec.ts  (E2E_BASE_URL to override). */
import { expect, test, type Page } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const GALLERY = `${BASE}/dev/gallery?only=src/ink/ink.gallery`

type Poly = [number, number][]

/** School-style digits as polylines in a 100 × 140 box (stroke order as taught in Spain). */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 28): Poly {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
  })
}
const DIGITS: Record<string, Poly[]> = {
  '0': [arc(50, 70, 31, 56, -90, -450, 40)],
  '1': [[[30, 44], [60, 12], [60, 130]]],
  '4': [[[58, 12], [18, 92], [86, 92]], [[66, 40], [66, 130]]],
  '7': [[[18, 16], [84, 16], [40, 130]], [[46, 74], [80, 74]]],
  '2': [[...arc(50, 45, 29, 30, 200, 382, 20), [20, 128], [84, 128]]],
}

/** Dispatches pen strokes into the element matched by `selector`, mapping the 100×140 box into `box` (fractions of the element). */
async function drawDigit(page: Page, selector: string, digit: string, box = { x: 0.15, y: 0.1, w: 0.7, h: 0.8 }) {
  await page.evaluate(
    ({ selector, strokes, box }) => {
      const el = document.querySelector(selector) as HTMLElement
      if (!el) throw new Error(`no element ${selector}`)
      const r = el.getBoundingClientRect()
      const W = el.clientWidth
      const H = el.clientHeight
      const scale = Math.min((W * box.w) / 100, (H * box.h) / 140)
      const ox = r.left + el.clientLeft + W * box.x + (W * box.w - 100 * scale) / 2
      const oy = r.top + el.clientTop + H * box.y + (H * box.h - 140 * scale) / 2
      const fire = (type: string, x: number, y: number, buttons: number) =>
        el.dispatchEvent(new PointerEvent(type, {
          bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'pen', isPrimary: true,
          pressure: buttons ? 0.5 : 0, buttons, button: type === 'pointermove' ? -1 : 0,
          clientX: ox + x * scale, clientY: oy + y * scale,
        }))
      for (const poly of strokes) {
        // densify so the stroke looks like real pen input (a point every ~2 model units)
        const pts: [number, number][] = [poly[0]]
        for (let i = 1; i < poly.length; i++) {
          const [x0, y0] = poly[i - 1]
          const [x1, y1] = poly[i]
          const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2))
          for (let k = 1; k <= n; k++) pts.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n])
        }
        fire('pointerdown', pts[0][0], pts[0][1], 1)
        for (const [x, y] of pts.slice(1)) fire('pointermove', x, y, 1)
        const [lx, ly] = pts[pts.length - 1]
        fire('pointerup', lx, ly, 0)
      }
    },
    { selector, strokes: DIGITS[digit], box },
  )
}

async function modelAvailable(page: Page): Promise<boolean> {
  const res = await page.request.get(`${BASE}/models/digits/model.json`).catch(() => null)
  return !!res && res.ok()
}

const CELL = '[role="textbox"][aria-label="prueba casilla"]'
const PAD = '[role="textbox"][aria-label="prueba número"]'

test.describe('ink · handwriting input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GALLERY)
    await expect(page.locator(CELL)).toBeVisible()
  })

  test('keyboard fills, clears and the cell keeps focus', async ({ page }) => {
    const value = page.getByTestId('ink-e2e-cell-value')
    await page.locator(CELL).focus()
    await page.keyboard.press('5')
    await expect(value).toHaveText('5')
    await page.keyboard.press('Backspace')
    await expect(value).toHaveText('–')
  })

  test('pen strokes in a DigitCell are recognised', async ({ page }) => {
    test.skip(!(await modelAvailable(page)), 'Digit model not available yet (public/models/digits/model.json, ml module) — skipping recognition e2e')
    await expect(page.getByTestId('ink-e2e-ready')).toHaveText('listo', { timeout: 10_000 })
    const value = page.getByTestId('ink-e2e-cell-value')
    for (const d of ['7', '1', '4', '0']) {
      await page.locator(CELL).focus()
      await page.keyboard.press('Backspace')
      await expect(value).toHaveText('–')
      await drawDigit(page, CELL, d)
      await expect(value, `digit ${d}`).toHaveText(d, { timeout: 4000 })
      await expect(page.locator(`${CELL} >> xpath=..`)).toHaveAttribute('data-phase', /recognized|unsure/)
    }
  })

  test('a number written in the NumberInput is segmented and submitted', async ({ page }) => {
    test.skip(!(await modelAvailable(page)), 'Digit model not available yet (public/models/digits/model.json, ml module) — skipping recognition e2e')
    await expect(page.getByTestId('ink-e2e-ready')).toHaveText('listo', { timeout: 10_000 })
    await drawDigit(page, PAD, '4', { x: 0.14, y: 0.08, w: 0.3, h: 0.84 })
    await drawDigit(page, PAD, '7', { x: 0.46, y: 0.08, w: 0.3, h: 0.84 })
    await expect(page.getByTestId('ink-e2e-number-value')).toHaveText('47', { timeout: 4000 })
    await page.locator('[data-testid="ink-e2e-number"] button[aria-label="Comprobar"]').click()
    await expect(page.getByTestId('ink-e2e-number-sent')).toHaveText('47')
  })
})
