/* Journey U: the bubble of Lumi holds every narrated step of the lessons of the map on a short tablet (1000 × 490):
   nothing is hidden behind a scroll inside the bubble. The walk goes through the tap steps of each lesson up to its first
   exercise (a try step needs an answer); the length of the later steps is guarded by lecciones-texto.test.ts. */
import { expect, test } from '@playwright/test'

const LESSONS: [string, string][] = [
  ['w1', 'lesson-groups'], ['w1', 'lesson-easy'], ['w2', 'lesson-placevalue'], ['w2', 'lesson-carry'],
  ['w3', 'lesson-tricks'], ['w3', 'lesson-five'], ['w3', 'lesson-rhyme'],
  ['w4', 'lesson-borrow'], ['w4', 'lesson-zero'], ['w4', 'lesson-four-ways'], ['w4', 'lesson-bars'],
  ['w5', 'lesson-double'], ['w5', 'lesson-pattern'], ['w6', 'lesson-seven'], ['w6', 'lesson-nine'],
  ['w7', 'lesson-split'], ['w7', 'lesson-carry'], ['w8', 'lesson-share'], ['w8', 'lesson-galera'], ['w8', 'lesson-div-ways'],
]

test.use({ viewport: { width: 1000, height: 490 }, hasTouch: true })

for (const [world, node] of LESSONS) {
  test(`the bubble holds every step of ${world}/${node} without inner scroll`, async ({ page }) => {
    await page.goto('/kids')
    await page.waitForFunction(() => !!(window as any).__numeriaDev, null, { timeout: 60_000 })
    await page.evaluate(async () => { await (window as any).__numeriaDev.seed() })
    await page.evaluate(async (w) => {
      const data = await import(/* @vite-ignore */ '/src/data/index.ts')
      const content = await import(/* @vite-ignore */ '/src/content/index.ts')
      const dev = (window as any).__numeriaDev
      const child = (await dev.db.children.toArray()).find((c: { deletedAt?: unknown }) => !c.deletedAt)
      await data.updateProgress(child.id, (p: unknown) => content.unlockThroughWorld(p, w))
      const world = content.getWorld(w)
      await data.updateProgress(child.id, (p: unknown) => {
        let n = p
        for (const x of world.nodes) if (x.kind !== 'guardian') n = content.applyNodeResult(n, w, x.id, { stars: 3, passed: true })
        return n
      })
    }, world)
    await page.goto(`/play/w/${world}/${node}`)
    await page.waitForTimeout(2000)
    const overflows: string[] = []
    for (let i = 0; i < 24; i++) {
      const info = await page.evaluate(() => {
        const b = document.querySelector('[class*="bubble"]')
        return b ? { over: b.scrollHeight - b.clientHeight, text: (b.textContent || '').slice(0, 50) } : null
      })
      // 10 px is the bottom margin of the text; a hidden line is 32 px or more
      if (info && info.over > 12) overflows.push(`#${i} (${info.over}px): ${info.text}`)
      const next = page.getByRole('button', { name: 'Siguiente ›' })
      if (!(await next.isVisible().catch(() => false)) || !(await next.isEnabled().catch(() => false))) break
      await next.click().catch(() => {})
      await page.waitForTimeout(450)
    }
    expect(overflows, `${world}/${node}`).toEqual([])
  })
}
