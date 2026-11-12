/* Journey V: «Inténtalo otra vez» in a lesson keeps what the child wrote (P2, P4). In «Piedras con llevadas» (w2) the
   child writes a sum with a wrong tens digit; after «Inténtalo otra vez» the same sum comes back with her digits and only
   the tens box marked, and changing it takes the mark away. Played on a short tablet (1000 × 490) with touch, so the
   marked box must be reachable there too (P6). Only visible Spanish text and roles are used. */
import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1000, height: 490 }, hasTouch: true })

async function openLesson(page: Page, world: string, node: string): Promise<void> {
  await page.goto('/kids')
  await page.waitForFunction(() => !!(window as any).__numeriaDev, null, { timeout: 60_000 })
  await page.evaluate(async () => { await (window as any).__numeriaDev.seed() })
  await page.evaluate(async (w) => {
    const data = await import(/* @vite-ignore */ '/src/data/index.ts')
    const content = await import(/* @vite-ignore */ '/src/content/index.ts')
    const dev = (window as any).__numeriaDev
    const child = (await dev.db.children.toArray()).find((c: { deletedAt?: unknown }) => !c.deletedAt)
    await data.updateProgress(child.id, (p: unknown) => content.unlockThroughWorld(p, w))
  }, world)
  await page.goto(`/play/w/${world}/${node}`)
}

const PLACES = ['unidades', 'decenas', 'centenas', 'millares']

test('a missed column sum comes back with the digits written and only the wrong column marked', async ({ page }) => {
  test.setTimeout(120_000)
  await openLesson(page, 'w2', 'lesson-carry')
  const column = page.locator('section[aria-label="Operación en columna"]')
  for (let i = 0; i < 30 && !(await column.isVisible().catch(() => false)); i++) {
    const next = page.getByRole('button', { name: 'Siguiente ›' })
    if (await next.isEnabled().catch(() => false)) await next.tap({ timeout: 5_000 }).catch(() => undefined)
    await page.waitForTimeout(400)
  }
  await expect(column).toBeVisible()

  // The two numbers of the sum, from the labels of their digits («unidades de 368»).
  const labels = await column.locator('[aria-label^="unidades de "]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''))
  const operands = labels.map((l) => Number(l.replace('unidades de ', '')))
  expect(operands.length).toBe(2)
  const sum = operands[0] + operands[1]
  const right = String(sum).split('').reverse().map(Number)
  const written = right.map((d, i) => (i === 1 ? (d + 1) % 10 : d))
  const cell = (i: number) => column.getByRole('textbox', { name: new RegExp(`^${PLACES[i]} del resultado`) })

  for (let i = 0; i < written.length; i++) {
    await cell(i).tap()
    await page.keyboard.type(String(written[i]))
  }
  await page.keyboard.press('Enter')
  const retry = page.getByRole('button', { name: 'Inténtalo otra vez' })
  await expect(retry).toBeVisible()
  await retry.scrollIntoViewIfNeeded()
  await retry.tap()

  // The same sum, her digits in their boxes, only the tens marked.
  await expect(column.locator(`[aria-label="unidades de ${operands[0]}"]`)).toHaveCount(1)
  await expect(cell(1)).toHaveAttribute('aria-invalid', 'true')
  for (let i = 0; i < written.length; i++) {
    await expect(cell(i)).toContainText(String(written[i]))
    if (i !== 1) expect(await cell(i).getAttribute('aria-invalid')).toBeNull()
  }
  // The marked box can be reached and corrected on the short tablet.
  await cell(1).scrollIntoViewIfNeeded()
  await expect(cell(1)).toBeInViewport()
  await cell(1).tap()
  await page.keyboard.type(String(right[1]))
  await expect(cell(1)).not.toHaveAttribute('aria-invalid', 'true')
})
