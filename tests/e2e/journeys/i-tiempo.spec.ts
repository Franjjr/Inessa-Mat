/* Journey I: the tiempo exercises (3.º, block D), played in the development gallery (/dev/gallery?only=tiempo), where
   the same views run on their own. A child reads a clock by choosing the phrase, and sets a clock by dragging the two
   hands (the long hand to the minutes, the short hand to the hour). Only visible Spanish text, roles and the drawn
   hands are used; no sound is played (Playwright mutes audio). */
import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { settle } from '../helpers'

const SHOTS = '/private/tmp/claude-501/-Users-mac13-Desktop-Inessa-Mat/617bc86f-ac41-42c6-9653-ab9e29daea63/scratchpad/shots-D'
mkdirSync(SHOTS, { recursive: true })

const gallery = (page: Page, entry: string) => page.goto(`/dev/gallery?only=tiempo&entry=${encodeURIComponent(entry)}`)

/** The screen position of a point on the face, given in clock degrees (0 = the 12) and a fraction of the radius. */
async function pointOn(svg: Locator, deg: number, radius: number): Promise<{ x: number; y: number }> {
  const box = await svg.boundingBox()
  if (!box) throw new Error('clock face not visible')
  const scale = box.width / 200
  const rad = (deg * Math.PI) / 180
  return {
    x: box.x + box.width / 2 + radius * scale * Math.sin(rad),
    y: box.y + box.height / 2 - radius * scale * Math.cos(rad),
  }
}

/** Drags from one point on the face to another, the way a finger or the Pencil does. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
  await settle(page, 120)
}

test.describe('tiempo: reading and setting the clock', () => {
  test('reads a clock: the child chooses «las tres y veinte» and the view says it is right', async ({ page }) => {
    await gallery(page, 'Reloj: leer, frases (ipad)')
    const frame = page.locator('[data-gallery="Reloj: leer, frases (ipad)"]')
    await expect(frame.getByRole('group', { name: 'Frases' })).toBeVisible()
    // no digital readout on the page while the child reads the hands
    await expect(frame).not.toContainText(/\d{1,2}:\d{2}/)
    await frame.getByRole('button', { name: 'Las tres y veinte' }).click()
    await frame.getByRole('button', { name: /Comprobar/ }).click()
    await expect(frame.getByText(/¡Muy bien!/)).toBeVisible()
    await frame.screenshot({ path: `${SHOTS}/reloj-leer-frases.png` })
  })

  test('sets a clock by dragging: the long hand to the 6 (30 minutes), the short hand to the 2', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 })
    await gallery(page, 'Reloj: poner la hora en cuartos (ipad)')
    const frame = page.locator('[data-gallery="Reloj: poner la hora en cuartos (ipad)"]')
    await expect(frame.getByText(/Las dos y media/)).toBeVisible()
    const clock = frame.getByRole('group', { name: /arrastra las agujas/ })
    await expect(clock).toBeVisible()

    // The set starts at 5:00: the long hand is on the 12, the short hand on the 5.
    await drag(page, await pointOn(clock, 0, 70), await pointOn(clock, 180, 70))
    // The long hand snapped to the 30 minutes: the hand now points to the 6.
    const minuteHand = clock.locator('line[data-hand="minute"]')
    const tip = await minuteHand.evaluate((el: SVGLineElement) => ({ x: el.x2.baseVal.value, y: el.y2.baseVal.value }))
    expect(Math.round(tip.x)).toBe(100)
    expect(Math.round(tip.y)).toBe(172)

    // The short hand to the 2 (with 30 minutes it sits at 75 degrees).
    await drag(page, await pointOn(clock, 150, 50), await pointOn(clock, 75, 50))

    await frame.screenshot({ path: `${SHOTS}/reloj-poner-arrastrar.png` })
    await frame.getByRole('button', { name: /Comprobar/ }).click()
    await expect(frame.getByText(/¡Muy bien!/)).toBeVisible()
  })

  test('the +/− buttons set the same clock without dragging (the accessible path)', async ({ page }) => {
    await gallery(page, 'Reloj: poner la hora (teléfono)')
    const frame = page.locator('[data-gallery="Reloj: poner la hora (teléfono)"]')
    await expect(frame.getByRole('group', { name: 'Ajustar con botones' })).toBeVisible()
    await expect(frame).not.toContainText(/\d{1,2}:\d{2}/)
    // from 5:00 to 2:30: three hours back, half an hour on
    for (let i = 0; i < 3; i++) await frame.getByRole('button', { name: 'Una hora menos' }).click()
    for (let i = 0; i < 6; i++) await frame.getByRole('button', { name: 'Cinco minutos más' }).click()
    await frame.getByRole('button', { name: /Comprobar/ }).click()
    await expect(frame.getByText(/¡Muy bien!/)).toBeVisible()
  })
})
