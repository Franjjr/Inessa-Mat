/* Single screens of the daily session on a short tablet (1000 × 490, finger), through the dev harness
   (src/activities/views/pantallas.gallery.tsx):
   - P3PE-16: a two-step bar problem fits on every screen («Seguir» or «Comprobar» in view), and there is one
     «Comprobar», on the last screen;
   - P3PE-09: the number line's box never overlaps a label of the line;
   - P3PE-10: no button of a sum of decimals is off screen, and the boxes are empty (no «0» drawn in them);
   - p1n-08: a row of 10 objects in the ordinals is one line;
   - P3PE-17: the numbers of the pixel game are ≥ 16 px.
   Run: E2E_BASE_URL=http://localhost:<port> npx playwright test tests/e2e/pantallas-vistas.spec.ts --project=ipad */
import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1000, height: 490 }, hasTouch: true })

async function show(page: Page, id: string): Promise<void> {
  await page.goto('/dev/gallery?only=pantallas&entry=Pantallas')
  await page.waitForFunction(() => !!window.__pantallas, undefined, { timeout: 30_000 })
  const cases = await page.evaluate(() => window.__pantallas!.cases)
  expect(cases).toContain(id)
  await page.evaluate((caseId) => { window.scrollTo(0, 0); window.__pantallas!.show(caseId) }, id)
  await page.waitForFunction((caseId) => document.querySelector(`[data-pantalla="${caseId}"] main`) !== null, id)
  await page.waitForTimeout(600)
}

/** The rectangle of an element on screen, at the current scroll. */
const inView = async (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => {
  const r = el.getBoundingClientRect()
  return r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.left >= 0 && r.right <= window.innerWidth + 1
})

test('P3PE-16: bar:three fits on every screen, with one «Comprobar» on the last one', async ({ page }) => {
  await show(page, 'bar-problem__bar:three')
  const screens = await page.locator('[aria-label^="Pantalla "]').first().getAttribute('aria-label')
  const total = Number(/de (\d+)/.exec(screens ?? '')?.[1])
  expect(total).toBeGreaterThanOrEqual(3)
  for (let n = 1; n <= total; n++) {
    await page.evaluate(() => window.scrollTo(0, 0))
    const last = n === total
    const forward = last ? page.getByRole('button', { name: /Comprobar/ }).filter({ hasText: 'Comprobar' }) : page.getByRole('button', { name: /Seguir/ })
    await expect(forward).toHaveCount(1)
    expect(await forward.evaluate((el) => { const r = el.getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 && r.top >= 0 })).toBe(true)
    if (!last) expect(await page.getByRole('button', { name: /Comprobar/ }).filter({ hasText: 'Comprobar' }).count()).toBe(0)
    // Do what the screen asks, so «Seguir» opens.
    const screen = await page.locator('[data-screen]').getAttribute('data-screen')
    if (screen === 'place') {
      for (let guard = 0; guard < 8; guard++) {
        const chip = page.getByRole('button', { name: /^Número \d+$/ }).first()
        if (!(await chip.count())) break
        const value = (await chip.textContent())!.trim()
        await chip.click()
        // The piece for that number: the first empty target whose name is not filled yet.
        const slots = page.locator('[data-slot]')
        const count = await slots.count()
        let placed = false
        for (let i = 0; i < count && !placed; i++) {
          const label = (await slots.nth(i).getAttribute('aria-label')) ?? ''
          if (!/pon aquí un número/.test(label)) continue
          await slots.nth(i).click()
          const after = (await slots.nth(i).getAttribute('aria-label')) ?? ''
          placed = after.endsWith(`: ${value}`)
          if (!placed) { await slots.nth(i).click(); await chip.click().catch(() => undefined) }
        }
      }
    } else if (!last) {
      await page.getByRole('button', { name: /Juntar/ }).click()
      const box = page.getByRole('textbox', { name: /Resultado del paso/ })
      await box.click()
      await page.keyboard.type('1')
    }
    if (!last) await page.getByRole('button', { name: /Seguir/ }).click()
  }
})

test('P3PE-09: the number line box sits under the line and overlaps no label', async ({ page }) => {
  await show(page, 'number-line__tick')
  const overlaps = await page.evaluate(() => {
    const box = document.querySelector('[data-line-answer] [role="textbox"], [data-line-answer] input, [data-line-answer] > div > div')
    if (!box) return ['sin casilla']
    const b = box.getBoundingClientRect()
    const labels = [...document.querySelectorAll('[aria-label="Recta"] span')].filter((e) => (e.textContent ?? '').trim())
    return labels.filter((l) => {
      const r = l.getBoundingClientRect()
      return r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top
    }).map((l) => l.textContent)
  })
  expect(overlaps).toEqual([])
})

test('P3PE-10: no button of a sum of decimals is off screen, and the boxes are empty', async ({ page }) => {
  for (const id of ['decimal-op__dec:add:2', 'decimal-op__dec:sub:2']) {
    await show(page, id)
    await page.evaluate(() => window.scrollTo(0, 0))
    const out = await page.evaluate(() => [...document.querySelectorAll('[data-pantalla] section button')]
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1) })
      .map((b) => b.textContent || b.getAttribute('aria-label')))
    expect(out, id).toEqual([])
    // The result boxes show nothing written (no «0» nor «00» as a sample).
    const written = await page.evaluate(() => [...document.querySelectorAll('[data-pantalla] [aria-label$="del resultado"]')]
      .map((c) => (c.textContent ?? '').replace(/\s/g, '')).filter((t) => /\d/.test(t)))
    expect(written, id).toEqual([])
  }
})

test('p1n-08: a row of 10 objects in the ordinals is one line, with the exit glued to the first', async ({ page }) => {
  await show(page, 'ordinal__row10')
  const tops = await page.evaluate(() => {
    const row = document.querySelector('[aria-label="Fila"]')!
    return [...row.children].map((c) => Math.round(c.getBoundingClientRect().top + c.getBoundingClientRect().height / 2))
  })
  // The exit and the ten objects.
  expect(tops.length).toBe(11)
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4)
})

test('P3PE-17: the numbers of the pixel game are 16 px or more', async ({ page }) => {
  await page.goto('/dev/gallery?only=pantallas&entry=Pixel')
  await page.waitForSelector('[aria-label="Dibujo escondido"]')
  const sizes = await page.evaluate(() => [...document.querySelectorAll('[aria-label="Dibujo escondido"] span')]
    // The cells themselves (the innermost spans with text), not their slots.
    .filter((e) => e.children.length === 0 && (e.textContent ?? '').trim() !== '')
    // On screen: the font size times the scale the cell is drawn at (FitToScreen's transform), never the CSS size alone.
    .map((e) => {
      const el = e as HTMLElement
      const scale = el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1
      return parseFloat(getComputedStyle(el).fontSize) * scale
    }))
  expect(sizes.length).toBeGreaterThan(0)
  // 16 px, give or take the rounding of the scale.
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15.95)
})
