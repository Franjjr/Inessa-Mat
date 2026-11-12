/* Every exercise screen of the daily session fits the tablet (P3PE-01, P3PE-06, P3PE-12, CR-3).
   Mounts each kind of exercise (the dev harness src/activities/views/pantallas.gallery.tsx: one case per kind and skill
   family of the 2.º–4.º syllabus, plus the subtraction and division methods) in a copy of the session's frame at
   1000 × 490 (a short Android tablet with its browser bars) and 1180 × 820 (iPad), with a finger, and checks, as the
   screen opens:
   - «✓ Comprobar» (the answer bar's) is inside the window (P3PE-01), and every case shows one, or «Seguir» (a screen
     that leads to the next one), unless it is listed in NO_CHECK (a view answered by a tap);
   - the statement (.ex-prompt) is ≥ 20 px on screen at 1180 × 820 (P3PE-06);
   - nothing sits on a visible button: elementFromPoint at its centre is the button itself, the scroll assistant
     included (P3PE-12).
   The views of other work groups that do not use ExerciseLayout yet (VIEWS_PENDING) are listed, not failed: their
   files belong to those groups (see the delivery notes). The ✓ beside a box and the ✓ key of the on-screen keypad
   (src/ink) are not the answer bar's «Comprobar» and are not measured here.
   Run: E2E_BASE_URL=http://localhost:<port> npx playwright test tests/e2e/pantallas-alcance.spec.ts --project=ipad */
import { expect, test, type Page } from '@playwright/test'

/** Kinds whose view is another group's file and does not use ExerciseLayout yet. */
const VIEWS_PENDING = /^(fact-mul|fact-div|missing-factor|skip-count|double-chain|fact-family|division|mul-parts)__/

/** Cases answered without «Comprobar» or «Seguir» (a tap is the answer). Any other case without them fails. */
const NO_CHECK: RegExp[] = []

interface Measure {
  id: string
  scale: number
  checks: { top: number; bottom: number }[]
  /** Visible «Comprobar» or «Seguir» buttons. */
  forward: number
  prompt: number | null
  covered: string[]
}

async function openHarness(page: Page): Promise<string[]> {
  await page.goto('/dev/gallery?only=pantallas&entry=Pantallas')
  await page.waitForFunction(() => !!window.__pantallas, undefined, { timeout: 30_000 })
  return page.evaluate(() => window.__pantallas!.cases)
}

async function measure(page: Page, id: string): Promise<Measure> {
  await page.evaluate((caseId) => { window.scrollTo(0, 0); window.__pantallas!.show(caseId) }, id)
  await page.waitForFunction((caseId) => document.querySelector(`[data-pantalla="${caseId}"] main`) !== null, id)
  // FitToScreen settles over a few frames (ResizeObserver), the scroll assistant checks twice a second.
  await page.waitForTimeout(650)
  return page.evaluate((caseId) => {
    const root = document.querySelector(`[data-pantalla="${caseId}"]`)!
    const fit = root.querySelector<HTMLElement>('[data-fit-scale]')
    const scale = fit ? Number(fit.dataset.fitScale) : 1
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
    }
    const buttons = [...document.querySelectorAll<HTMLElement>('button')].filter(visible)
    const checks = buttons
      .filter((b) => /Comprobar/.test(b.textContent ?? ''))
      .map((b) => { const r = b.getBoundingClientRect(); return { top: r.top, bottom: r.bottom } })
    const forward = buttons.filter((b) => /Comprobar|Seguir/.test(b.textContent ?? '')).length
    const promptEl = root.querySelector('.ex-prompt')
    const prompt = promptEl ? parseFloat(getComputedStyle(promptEl).fontSize) * (promptEl.closest('[data-fit-scale]') ? scale : 1) : null
    const covered: string[] = []
    for (const b of buttons) {
      const r = b.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) continue
      const hit = document.elementFromPoint(x, y)
      if (hit && !b.contains(hit)) covered.push(`${(b.textContent || b.getAttribute('aria-label') || '').trim()} ← ${(hit.textContent ?? hit.tagName).trim().slice(0, 30)}`)
    }
    return { id: caseId, scale, checks, forward, prompt, covered }
  }, id)
}

for (const [width, height] of [[1000, 490], [1180, 820]] as const) {
  test.describe(`pantallas a ${width}×${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: true })

    test('«Comprobar» a la vista, nada tapa un botón y el enunciado se lee', async ({ page }) => {
      test.setTimeout(900_000)
      const cases = await openHarness(page)
      expect(cases.length).toBeGreaterThan(150)
      const out: string[] = []
      const covered: string[] = []
      const small: string[] = []
      const pending: string[] = []
      const noCheck: string[] = []
      let measured = 0
      for (const id of cases) {
        const m = await measure(page, id)
        const bad: string[] = []
        // A case with no «Comprobar» in view never passes for free.
        if (m.forward === 0 && !NO_CHECK.some((re) => re.test(id))) noCheck.push(id)
        for (const c of m.checks) if (c.bottom > height + 1 || c.top < 0) bad.push(`${id} (Comprobar ${Math.round(c.top)}–${Math.round(c.bottom)}, escala ${m.scale})`)
        const smallHere = width === 1180 && (m.prompt === null || m.prompt < 20) ? [`${id}: ${m.prompt === null ? 'sin .ex-prompt' : `${m.prompt.toFixed(1)} px`}`] : []
        if (VIEWS_PENDING.test(id)) {
          if (bad.length || smallHere.length || noCheck.at(-1) === id) pending.push(id)
          if (noCheck.at(-1) === id) noCheck.pop()
          continue
        }
        measured++
        out.push(...bad)
        small.push(...smallHere)
        covered.push(...m.covered.map((c) => `${id}: ${c}`))
      }
      console.log(`${width}×${height}: ${cases.length} casos (${measured} medidos); Comprobar fuera ${out.length}; botones tapados ${covered.length}; enunciado pequeño ${small.length}; vistas de otros grupos por adaptar ${pending.length}`)
      if (out.length) console.log('FUERA\n' + out.join('\n'))
      if (covered.length) console.log('TAPADOS\n' + covered.join('\n'))
      if (small.length) console.log('PEQUEÑO\n' + small.join('\n'))
      if (pending.length) console.log('PENDIENTES (otros grupos)\n' + pending.join('\n'))
      if (noCheck.length) console.log('SIN COMPROBAR NI SEGUIR\n' + noCheck.join('\n'))
      expect(noCheck, 'sin «Comprobar» ni «Seguir» a la vista').toEqual([])
      expect(out, 'Comprobar fuera de la pantalla').toEqual([])
      expect(covered, 'botones tapados').toEqual([])
      expect(small, 'enunciado < 20 px').toEqual([])
    })
  })
}

test.describe('colores claros (CR-3)', () => {
  test('el meta color-scheme existe y <html> se calcula en claro', async ({ page }) => {
    await page.goto('/dev/gallery?only=pantallas&entry=Pantallas')
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light only')
    const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)
    expect(scheme).toContain('light')
  })
})
