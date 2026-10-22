/* Journey H: the new exercise types and the division methods, played through the real views. The bar problem, the
   encuentra el error and the comprobar are played in the development gallery (/dev/gallery?only=newViews), where the
   same views run on their own; the lesson «Cuatro caminos para dividir» is played in the world 8 lesson node, all four
   methods and the choice of the favourite. Only visible Spanish text and roles are used. */
import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { devEditProgress, seedDemo, settle } from '../helpers'

const SHOTS = '/private/tmp/claude-501/-Users-mac13-Desktop-Inessa-Mat/617bc86f-ac41-42c6-9653-ab9e29daea63/scratchpad/shots-B'
mkdirSync(SHOTS, { recursive: true })
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })

const gallery = (page: Page, entry: string) => page.goto(`/dev/gallery?only=newViews&entry=${encodeURIComponent(entry)}`)

/** Types a number into a writing field: click, digits, no submit. */
async function fill(page: Page, field: Locator, value: number | string): Promise<void> {
  await field.click()
  await page.keyboard.type(String(value))
  await settle(page, 120)
}

/** The digits of the galera (the quotient digit and the remainder of each step), the way a child writes them. */
function galeraSteps(n: number, d: number): { q: number; r: number }[] {
  const digits = String(n).split('').map(Number)
  const steps: { q: number; r: number }[] = []
  let i = 0
  let partial = 0
  while (i < digits.length) {
    partial = partial * 10 + digits[i]
    i += 1
    if (partial >= d) break
  }
  let q = Math.floor(partial / d)
  let r = partial - q * d
  steps.push({ q, r })
  let rest = r
  while (i < digits.length) {
    partial = rest * 10 + digits[i]
    i += 1
    q = Math.floor(partial / d)
    r = partial - q * d
    steps.push({ q, r })
    rest = r
  }
  return steps
}

/** Quotient of each part of the dividend (repartir por partes), as the view asks for them. */
function partsQuotients(n: number, d: number): number[] {
  const digits = String(n).split('').map(Number)
  const out: number[] = []
  let carried = 0
  digits.forEach((digit, i) => {
    const place = digits.length - 1 - i
    if (digit === 0 && place !== 0) return
    const partial = carried + digit * 10 ** place
    const q = Math.floor(partial / d)
    carried = partial - q * d
    out.push(q)
  })
  return out
}

test.describe('Journey H: new exercise views (development gallery)', () => {
  test('a bar problem: a number is tapped onto its piece, and the check waits for the operation and the results', async ({ page }) => {
    await gallery(page, 'problema con la barra (ipad)')
    await expect(page.getByText('Pon cada número en su sitio')).toBeVisible()
    const chips = page.getByRole('button', { name: /^Número \d+$/ })
    const before = await chips.count()
    expect(before).toBeGreaterThanOrEqual(2)
    await shot(page, 'h1-bar-start')
    await chips.first().click()
    await page.locator('[data-slot]').first().click()
    await expect(chips).toHaveCount(before - 1)
    await shot(page, 'h2-bar-placed')
    // The check stays disabled: the operation and the result are still missing.
    await expect(page.getByRole('button', { name: /Comprobar/ }).last()).toBeDisabled()
  })

  test('encuentra el error: the child says if the calculation is right, then marks the column and writes the right result', async ({ page }) => {
    await gallery(page, 'Encuentra el error')
    await expect(page.getByRole('button', { name: /Hay un error/ })).toBeVisible()
    await shot(page, 'h3-hunt-start')
    await page.getByRole('button', { name: /Hay un error/ }).click()
    await page.getByRole('button', { name: /columna de las/ }).first().click()
    await expect(page.getByRole('textbox', { name: 'Resultado correcto' })).toBeVisible()
    await shot(page, 'h4-hunt-column')
  })

  test('comprobar: the child writes the check operation and says whether the claim is right', async ({ page }) => {
    await gallery(page, 'Comprobar: resta')
    await expect(page.getByRole('region', { name: 'Comprobar' })).toBeVisible()
    await page.getByRole('button', { name: /No está bien/ }).click()
    await fill(page, page.getByRole('textbox', { name: 'Resultado de la comprobación' }), 1)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Siguiente/ })).toBeVisible()
    await shot(page, 'h5-check-answered')
  })

  test('the division methods: the galera without subtractions, repartir por partes and multiplicar hacia arriba', async ({ page }) => {
    // La galera sin restas: no product rows are written, only the quotient and the remainder.
    await gallery(page, 'la galera sin restas')
    await expect(page.getByRole('region', { name: 'División en galera' })).toBeVisible()
    await expect(page.getByRole('group', { name: /producto/ })).toHaveCount(0)
    const short = galeraSteps(384, 4)
    for (let j = 0; j < short.length; j++) {
      await page.getByLabel(`cociente, cifra ${j + 1}`).first().click()
      await page.keyboard.type(String(short[j].q))
    }
    await page.getByLabel(/^resto/).last().click()
    await page.keyboard.type(String(short[short.length - 1].r))
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Siguiente/ })).toBeVisible()
    await shot(page, 'h6-galera-short')

    // Repartir por partes: 84 = 80 + 4, each part divided, then the quotients added.
    await gallery(page, 'repartir por partes')
    await expect(page.getByRole('region', { name: 'Repartir por partes' })).toBeVisible()
    const quotients = partsQuotients(84, 4)
    for (let k = 0; k < quotients.length; k++) {
      await fill(page, page.getByRole('textbox', { name: `cociente de la parte ${k + 1}` }), quotients[k])
    }
    await fill(page, page.getByRole('textbox', { name: 'cociente total' }), quotients.reduce((a, b) => a + b, 0))
    await fill(page, page.getByRole('textbox', { name: 'resto' }), 0)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Siguiente/ })).toBeVisible()
    await shot(page, 'h7-parts')

    // Multiplicar hacia arriba: 4, 8, 12… until the row reaches 28.
    await gallery(page, 'multiplicar hacia arriba')
    await expect(page.getByRole('region', { name: 'Multiplicar hacia arriba' })).toBeVisible()
    for (let k = 1; k <= 7; k++) {
      await fill(page, page.getByRole('textbox', { name: `producto de 4 por ${k}` }), 4 * k)
      await page.getByRole('button', { name: 'Fila lista' }).click()
    }
    await fill(page, page.getByRole('textbox', { name: 'resto' }), 0)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Siguiente/ })).toBeVisible()
    await shot(page, 'h8-climb')
  })
})

test.describe('Journey H: the lesson «Cuatro caminos para dividir»', () => {
  test('the four division methods are tried and the child chooses the favourite', async ({ page }) => {
    test.setTimeout(180_000)
    await seedDemo(page)
    // World 8 is reached by the demo child: its earlier nodes are marked as done, as after a long journey.
    await devEditProgress(page, { kind: 'worldDoneBeforeGuardian', worldId: 'w8' })
    // Opening the world itself (the nodes above only mark its progress).
    await page.evaluate(async () => {
      const data = await import('/src/data/index.ts')
      const content = await import('/src/content/index.ts')
      const child = (await window.__numeriaDev!.db.children.toArray()).find((c) => !c.deletedAt)!
      await data.updateProgress(child.id, (p) => content.unlockThroughWorld(p, 'w8'))
    })
    await page.goto('/play/w/w8/lesson-div-ways')
    await expect(page.getByRole('heading', { name: 'Cuatro caminos para dividir' })).toBeVisible({ timeout: 20_000 })

    const seen = new Set<string>()
    for (let i = 0; i < 80; i++) {
      const done = page.getByRole('button', { name: '¡Lo he entendido!' })
      if (await ready(done)) {
        await done.click({ timeout: 5_000 }).catch(() => undefined)
        break
      }
      const pick = page.getByRole('radio', { name: 'La galera con restas' })
      if (await pick.isVisible().catch(() => false)) {
        await pick.click()
        await expect(page.getByText('Anotado: tu método favorito es «La galera con restas».')).toBeVisible()
        seen.add('choice')
        await shot(page, 'h9-lesson-choice')
        await continueLesson(page)
        continue
      }
      const galera = page.locator('section[aria-label="División en galera"]')
      if (await galera.isVisible().catch(() => false)) {
        await solveGalera(page)
        continue
      }
      const parts = page.getByRole('region', { name: 'Repartir por partes' })
      if (await parts.isVisible().catch(() => false)) {
        seen.add('parts')
        await solveParts(page)
        continue
      }
      const climb = page.getByRole('region', { name: 'Multiplicar hacia arriba' })
      if (await climb.isVisible().catch(() => false)) {
        seen.add('climb')
        await solveClimb(page)
        continue
      }
      const next = page.getByRole('button', { name: 'Siguiente ›' })
      if (await ready(next)) {
        await next.click({ timeout: 5_000 }).catch(() => undefined)
        await settle(page, 350)
        continue
      }
      await settle(page, 400)
    }
    // The favourite was chosen and each method's try step shows its own exercise (a climb with a two-digit quotient would fall back to the galera).
    expect([...seen].sort()).toEqual(['choice', 'climb', 'parts'])
  })
})

/** On screen and enabled, without waiting for it to appear (isEnabled alone waits for the element). */
async function ready(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0 && locator.first().isEnabled().catch(() => false)
}

/** Continues from a settled step: the lesson's own forward button, when there is one. */
async function continueLesson(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Siguiente ›' })
  if (await ready(next)) await next.click()
  await settle(page, 350)
}

/** A galera try step (with or without the subtractions): the quotient digits and the remainders, then Enter. */
async function solveGalera(page: Page): Promise<void> {
  const prompt = (await page.locator('section[aria-label="División en galera"] p').first().textContent()) ?? ''
  const m = prompt.match(/Reparte (\d+) entre (\d+)/)
  if (!m) return
  const n = Number(m[1])
  const d = Number(m[2])
  const steps = galeraSteps(n, d)
  const short = prompt.includes('Escribe solo el cociente')
  // Cell by cell: the quotient digit of each step, then the remainder (the last one only, without subtractions).
  for (let j = 0; j < steps.length; j++) {
    await page.getByLabel(`cociente, cifra ${j + 1}`).first().click()
    await page.keyboard.type(String(steps[j].q))
    const last = j === steps.length - 1
    if (!short || last) {
      await page.getByLabel(last ? /^resto/ : `resto del paso ${j + 1}`).last().click()
      await page.keyboard.type(String(steps[j].r))
    }
  }
  await page.keyboard.press('Enter')
  await settle(page, 600)
  await settle(page, 300)
}

/** A parts try step: each part's quotient, the total and the remainder. */
async function solveParts(page: Page): Promise<void> {
  const prompt = (await page.getByRole('region', { name: 'Repartir por partes' }).locator('p').first().textContent()) ?? ''
  const m = prompt.match(/Reparte (\d+) entre (\d+)/)
  if (!m) return
  const n = Number(m[1])
  const d = Number(m[2])
  const quotients = partsQuotients(n, d)
  for (let k = 0; k < quotients.length; k++) {
    await fill(page, page.getByRole('textbox', { name: `cociente de la parte ${k + 1}` }), quotients[k])
  }
  await fill(page, page.getByRole('textbox', { name: 'cociente total' }), Math.floor(n / d))
  await fill(page, page.getByRole('textbox', { name: 'resto' }), n % d)
  await page.keyboard.press('Enter')
  await settle(page, 600)
}

/** A climb try step: the multiples of the divisor, one row at a time, until one reaches the dividend; then the rest. */
async function solveClimb(page: Page): Promise<void> {
  const prompt = (await page.getByRole('region', { name: 'Multiplicar hacia arriba' }).locator('p').first().textContent()) ?? ''
  const m = prompt.match(/por (\d+) da (\d+)/)
  if (!m) return
  const d = Number(m[1])
  const n = Number(m[2])
  for (let k = 1; k < 20; k++) {
    const product = d * k
    await fill(page, page.getByRole('textbox', { name: `producto de ${d} por ${k}` }), product)
    await page.getByRole('button', { name: 'Fila lista' }).click()
    await settle(page, 150)
    if (product >= n) break
  }
  await fill(page, page.getByRole('textbox', { name: 'resto' }), n % d)
  await page.keyboard.press('Enter')
  await settle(page, 600)
}
