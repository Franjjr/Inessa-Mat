/* Journey S: La Isla de las Palabras, the English world on the map. Lía (3.º, maths and Lengua done today, English on) opens
   the «Isla de Inglés» tile of the English home, plays the arrival story of the island, then its first stop: the class of
   «Saludos y yo», played to the end with the English driver. Every stop and button is reached with a real touch tap
   (page.touchscreen.tap at the element's centre, after tapReachable's check that it is visible or brought there with
   «⬇ Más abajo»), with the coarse pointer emulated through CDP, at 390 × 844, 1000 × 490 (required) and 1366 × 657. */
import { expect, test, type Locator, type Page } from '@playwright/test'
import { devFlag, devSettings, seedDemo, settle, tapStoryUntilButton } from '../helpers'
import { newSeen, noSidewaysScroll, playEnglish, tapReachable, type EnglishKit } from '../ingles-driver'

const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1000, height: 490 }, { width: 1366, height: 657 }]

const today = () => new Date().toISOString().slice(0, 10)

/** Emulates a coarse pointer (a touch screen, no hover) through CDP, as on a tablet. */
async function coarsePointer(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'pointer', value: 'coarse' }, { name: 'any-pointer', value: 'coarse' },
      { name: 'hover', value: 'none' }, { name: 'any-hover', value: 'none' },
    ],
  })
}

/** A real touch tap: the element must be reachable (tapReachable, without its DOM click), then the screen is touched at its centre. */
async function touch(page: Page, loc: Locator, label: string): Promise<void> {
  await tapReachable(page, loc, label, { click: false })
  const box = await loc.boundingBox()
  expect(box, `${label} has a box`).not.toBeNull()
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
}

/** What the driver answers with: the English word of each Spanish word, the English words of the numbers, and the cards. */
async function englishKit(page: Page): Promise<EnglishKit> {
  const data = await page.evaluate(async () => {
    const words = await import('/src/engine/ingles/words.ts')
    const numbers = await import('/src/engine/ingles/numbers.ts')
    const list = words.ENGLISH_WORDS.map((w) => ({ es: w.es, en: w.en, emoji: w.emoji ?? null }))
    const digits = Array.from({ length: 101 }, (_, n) => [String(n), numbers.numberToEnglish(n)] as [string, string])
    return { list, digits }
  })
  const words = new Map<string, string>()
  for (const w of data.list) if (!words.has(w.es)) words.set(w.es, w.en)
  return { words, numbers: new Map(data.digits), cards: data.list }
}

/** Lía's English setup for today: maths, Lengua and their placements are done, English is on and its placement is done. */
async function linaWithEnglish(page: Page): Promise<void> {
  await seedDemo(page)
  await devSettings(page, { subjects: ['math', 'language', 'english'], voice: false, storyVoice: false })
  await devFlag(page, 'placement')
  await devFlag(page, 'placementLengua')
  await devFlag(page, 'placementIngles')
  await devFlag(page, `sesion-hecha:${today()}`)
  await devFlag(page, `sesion-hecha-lengua:${today()}`)
}

test.describe('La Isla de las Palabras', () => {
  for (const viewport of VIEWPORTS) {
    const size = `${viewport.width} × ${viewport.height}`

    test.describe(size, () => {
      test.use({ viewport, hasTouch: true })

      test(`the English home opens the island, its arrival story and its first lesson stop at ${size}`, async ({ page }) => {
        await coarsePointer(page)
        await linaWithEnglish(page)
        const kit = await englishKit(page)

        await page.goto('/play')
        await expect(page.getByRole('heading', { name: /¡Hola, Lía!/ })).toBeVisible()
        await expect(page.locator('[aria-current="page"]')).toContainText('Inglés')

        // The island tile of the English view.
        await touch(page, page.getByRole('button', { name: 'Isla de Inglés' }), '«Isla de Inglés»')
        await expect(page).toHaveURL(/\/play\/w\/isla-ingles$/)
        await expect(page.getByRole('heading', { name: 'La Isla de las Palabras' })).toBeVisible()
        expect(await noSidewaysScroll(page), `island map at ${size}: no sideways scroll`).toBe(true)

        // The arrival story: the first stop, open and current.
        await touch(page, page.getByRole('button', { name: /Bienvenidos al puerto/ }), '«Bienvenidos al puerto»')
        await expect(page).toHaveURL(/\/play\/w\/isla-ingles\/s1-llegada$/)
        // The story ends with its reward card (the same URL): the stop is done, and the card goes on with «¡Seguir!».
        await tapStoryUntilButton(page, '¡Seguir!')
        await expect(page.getByRole('dialog')).toBeVisible()
        await touch(page, page.getByRole('button', { name: '¡Seguir!' }), '«¡Seguir!»')
        await expect(page).toHaveURL(/\/play\/w\/isla-ingles$/)

        // The first lesson stop: the class of «Saludos y yo», played to the end.
        const stop = page.getByRole('button', { name: /Saludos y yo/ })
        await touch(page, stop, '«Saludos y yo»')
        await expect(page).toHaveURL(/\/play\/w\/isla-ingles\/s1-saludos$/)
        const seen = newSeen()
        await playEnglish(page, () => page.getByRole('dialog').isVisible().catch(() => false), seen, kit, 500)
        expect(await noSidewaysScroll(page), `the lesson stop at ${size}: no sideways scroll`).toBe(true)
        await touch(page, page.getByRole('button', { name: '¡Seguir!' }), '«¡Seguir!» tras la clase')
        await expect(page).toHaveURL(/\/play\/w\/isla-ingles$/)
        await settle(page, 300)

        // The stop is done, and the next one (the next lesson of the stage) is open.
        await expect(page.getByRole('button', { name: /Saludos y yo, hecho/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /Números del 0 al 20/ })).not.toHaveAttribute('aria-disabled', 'true')
      })
    })
  }
})
