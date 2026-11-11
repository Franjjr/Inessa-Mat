/* Every exercise screen of the daily session fits the tablet (P3PE-01, P3PE-06, P3PE-12).
   Mounts each kind of exercise (the dev harness src/activities/views/pantallas.gallery.tsx) in a copy of the session's
   frame at 1000 × 490 (a short Android tablet with its browser bars) and 1180 × 820 (iPad), with a finger (touch), and
   checks, without scrolling:
   - «Comprobar» is inside the window (P3PE-01);
   - the statement (.ex-prompt) is ≥ 20 px on screen at 1180 × 820 (P3PE-06);
   - nothing sits on a visible button: elementFromPoint at its centre is the button itself (the scroll assistant
     included, P3PE-12).
   Run: E2E_BASE_URL=http://localhost:<port> npx playwright test tests/e2e/pantallas-alcance.spec.ts --project=ipad */
import { expect, test, type Page } from '@playwright/test'

interface Measure {
  id: string
  scale: number
  checks: { top: number; bottom: number; name: string }[]
  prompt: number | null
  covered: string[]
}

async function openHarness(page: Page): Promise<string[]> {
  await page.goto('/dev/gallery?only=pantallas')
  await page.waitForFunction(() => !!window.__pantallas, undefined, { timeout: 30_000 })
  return page.evaluate(() => window.__pantallas!.cases)
}

async function measure(page: Page, id: string): Promise<Measure> {
  await page.evaluate((caseId) => { window.scrollTo(0, 0); window.__pantallas!.show(caseId) }, id)
  await page.waitForFunction((caseId) => document.querySelector(`[data-pantalla="${caseId}"] main`) !== null, id)
  // FitToScreen settles over a few frames (ResizeObserver), the scroll assistant checks twice a second.
  await page.waitForTimeout(650)
  return page.evaluate((caseId) => {
    window.scrollTo(0, 0)
    const root = document.querySelector(`[data-pantalla="${caseId}"]`)!
    const fit = root.querySelector<HTMLElement>('[data-fit-scale]')
    const scale = fit ? Number(fit.dataset.fitScale) : 1
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'
    }
    const buttons = [...document.querySelectorAll<HTMLElement>('button')].filter(visible)
    const checks = buttons
      .filter((b) => /Comprobar/.test(b.textContent ?? '') || /Comprobar/.test(b.getAttribute('aria-label') ?? ''))
      .map((b) => { const r = b.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, name: (b.textContent ?? '').trim() } })
    const promptEl = root.querySelector('.ex-prompt')
    const prompt = promptEl ? parseFloat(getComputedStyle(promptEl).fontSize) * (promptEl.closest('[data-fit-scale]') ? scale : 1) : null
    const covered: string[] = []
    for (const b of buttons) {
      const r = b.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) continue
      const hit = document.elementFromPoint(x, y)
      if (hit && !b.contains(hit)) covered.push(`${(b.textContent ?? b.getAttribute('aria-label') ?? '').trim()} ← ${(hit.textContent ?? hit.tagName).trim().slice(0, 30)}`)
    }
    return { id: caseId, scale, checks, prompt, covered }
  }, id)
}

for (const [width, height] of [[1000, 490], [1180, 820]] as const) {
  test.describe(`pantallas a ${width}×${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: true })

    test('«Comprobar» a la vista, nada tapa un botón y el enunciado se lee', async ({ page }) => {
      test.setTimeout(600_000)
      const cases = await openHarness(page)
      expect(cases.length).toBeGreaterThan(150)
      const out: string[] = []
      const covered: string[] = []
      const small: string[] = []
      for (const id of cases) {
        const m = await measure(page, id)
        for (const c of m.checks) if (c.bottom > height + 1 || c.top < 0) out.push(`${id} (${c.name}: ${Math.round(c.top)}–${Math.round(c.bottom)}, escala ${m.scale})`)
        covered.push(...m.covered.map((c) => `${id}: ${c}`))
        if (width === 1180 && (m.prompt === null || m.prompt < 20)) small.push(`${id}: ${m.prompt === null ? 'sin .ex-prompt' : `${m.prompt.toFixed(1)} px`}`)
      }
      console.log(`${width}×${height}: ${cases.length} casos; Comprobar fuera ${out.length}; botones tapados ${covered.length}; enunciado pequeño ${small.length}`)
      if (out.length) console.log('FUERA\n' + out.join('\n'))
      if (covered.length) console.log('TAPADOS\n' + covered.join('\n'))
      if (small.length) console.log('PEQUEÑO\n' + small.join('\n'))
      expect(out, 'Comprobar fuera de la pantalla').toEqual([])
      expect(covered, 'botones tapados').toEqual([])
      expect(small, 'enunciado < 20 px').toEqual([])
    })
  })
}
