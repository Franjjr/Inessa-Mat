/* Journey R: Inglés de 3.º in the app. Lía (3.º) has maths and Lengua done today (flags), so «Hoy» opens English: the class of
   the topic (its words in a grid), then the 10-minute session with a typed word (the letter keyboard), a number to listen to, the
   memory game as its last game, and the stars. The journey runs at a phone (390 × 844) and a short tablet (1000 × 490) with a
   coarse pointer emulated through CDP: every advance button must be visible or reached with «⬇ Más abajo», and every tap is an
   element.click() after that check (ingles-driver.ts), never a Playwright click that would scroll to the button by itself.
   Speech is stubbed (a Spanish voice that says nothing), so no audio plays and the English listening items are planned. */
import { expect, test, type Page } from '@playwright/test'
import { devFlag, devMasterUntilTopic, devSettings, seedDemo } from '../helpers'
import { newSeen, noSidewaysScroll, playEnglish, tapReachable, type EnglishKit, type EnglishSeen } from '../ingles-driver'

const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1000, height: 490 }]
/** The placement is a short card: it also runs on a 1366 × 657 laptop window. */
const PLACEMENT_VIEWPORTS = [...VIEWPORTS, { width: 1366, height: 657 }]

/** A Spanish voice that speaks nothing: the app sees a voice (the English items need one) and no audio is played. */
const SPEECH_STUB = `(() => {
  const voice = { name: 'Voz de prueba', lang: 'es-ES', voiceURI: 'prueba', localService: true, default: true }
  const fake = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: () => [voice],
    speak(u) { setTimeout(() => { if (u.onstart) u.onstart({}); if (u.onend) u.onend({}) }, 0) },
    cancel() {}, pause() {}, resume() {},
    addEventListener() {}, removeEventListener() {},
  }
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true })
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text } }
})()`

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

/** What the driver answers with: the pictures and their words (the memory pairs), the English word of each Spanish word, and
    the English words of the numbers 0 to 100 (read from the app's own vocabulary and number modules). */
async function englishKit(page: Page): Promise<EnglishKit> {
  const data = await page.evaluate(async () => {
    const words = await import('/src/engine/ingles/words.ts')
    const numbers = await import('/src/engine/ingles/numbers.ts')
    const list = words.ENGLISH_WORDS.map((w) => ({ es: w.es, en: w.en, emoji: w.emoji ?? null }))
    const digits = Array.from({ length: 101 }, (_, n) => [String(n), numbers.numberToEnglish(n)] as [string, string])
    return { list, digits }
  })
  const partner = new Map<string, string>()
  const words = new Map<string, string>()
  for (const w of data.list) {
    if (w.emoji) { partner.set(w.emoji, w.en); partner.set(w.en, w.emoji) }
    if (!words.has(w.es)) words.set(w.es, w.en)
  }
  return { partner, words, numbers: new Map(data.digits), cards: data.list }
}

/** Lía's English setup for today: maths, Lengua and their placements are done, English is on and its placement is done. */
async function linaWithEnglish(page: Page, englishPlacement = true): Promise<void> {
  await seedDemo(page)
  await devSettings(page, { subjects: ['math', 'language', 'english'], voice: false, storyVoice: false })
  await devFlag(page, 'placement')
  await devFlag(page, 'placementLengua')
  if (englishPlacement) await devFlag(page, 'placementIngles')
  await devFlag(page, `sesion-hecha:${today()}`)
  await devFlag(page, `sesion-hecha-lengua:${today()}`)
}

/** The home: English is the view («Ahora, Inglés»), with the class of its topic first. */
async function openEnglishHome(page: Page, topic: string): Promise<void> {
  await page.goto('/play')
  await expect(page.getByRole('heading', { name: /¡Hola, Lía!/ })).toBeVisible()
  await expect(page.locator('[aria-current="page"]')).toContainText('Inglés')
  await expect(page.getByRole('button', { name: /Mi aventura/ })).toHaveCount(0)
  await expect(page.getByLabel('Mundos')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Hoy aprendemos/ })).toContainText(topic)
}

/** The English class of a topic and the session after it, played to the end. */
async function classThenSession(page: Page, viewport: { width: number; height: number }, topicId: string, topicName: string): Promise<{ classSeen: EnglishSeen; sessionSeen: EnglishSeen }> {
  const kit = await englishKit(page)
  await openEnglishHome(page, topicName)
  await expect(page.getByRole('button', { name: /Hoy aprendemos/ })).toContainText('¡Empezar la clase!')
  await tapReachable(page, page.getByRole('button', { name: /Hoy aprendemos/ }), '«Hoy» (la clase)')
  await expect(page).toHaveURL(new RegExp(`/play/clase/${topicId}$`))

  const classSeen = newSeen()
  await tapReachable(page, page.getByRole('button', { name: '¡Empezar la clase!' }), '«¡Empezar la clase!»')
  await playEnglish(page, () => page.getByText('¡Clase terminada!').isVisible().catch(() => false), classSeen, kit, 400)
  expect(classSeen.grid, 'the class shows the words of the topic in a grid').toBe(true)
  expect(classSeen.typed, 'the class has a typed word (the letter keyboard)').toBe(true)
  expect(await noSidewaysScroll(page), `class at ${viewport.width}×${viewport.height}: no sideways scroll`).toBe(true)

  await tapReachable(page, page.getByRole('button', { name: 'Seguir con la sesión' }), '«Seguir con la sesión»')
  await expect(page).toHaveURL(/\/play\/ingles$/)
  await expect(page.getByRole('heading', { name: 'Mi sesión de Inglés' })).toBeVisible()
  await expect(page.getByText('Unos 10 minutos')).toBeVisible()

  const sessionSeen = newSeen()
  await tapReachable(page, page.getByRole('button', { name: '¡Empezar!' }), '«¡Empezar!»')
  await playEnglish(page, () => page.getByText('Sesión terminada', { exact: true }).isVisible().catch(() => false), sessionSeen, kit, 600)
  expect(await noSidewaysScroll(page), `session at ${viewport.width}×${viewport.height}: no sideways scroll`).toBe(true)
  return { classSeen, sessionSeen }
}

test.describe('Inglés de 3.º', () => {
  for (const viewport of VIEWPORTS) {
    const size = `${viewport.width} × ${viewport.height}`

    test(`the class, a typed word, the memory game and the stars at ${size}`, async ({ page }) => {
      test.setTimeout(480_000)
      await page.addInitScript(SPEECH_STUB)
      await page.setViewportSize(viewport)
      await coarsePointer(page)
      await linaWithEnglish(page)
      // Lía has the earlier English topics learnt: «Hoy» opens the class of animals, a theme with pictures (the memory game).
      await devMasterUntilTopic(page, 'eng-animales')
      const { sessionSeen } = await classThenSession(page, viewport, 'eng-animales', 'Animales')

      expect(sessionSeen.memory, 'the last game of the session is the memory game (animals have their pictures)').toBe(true)
      await expect(page.getByText('+3 estrellas para tu cuerno')).toBeVisible({ timeout: 15_000 })
      await tapReachable(page, page.getByRole('button', { name: 'Volver al inicio' }), '«Volver al inicio»')
      await expect(page).toHaveURL(/\/play$/)
      expect(await noSidewaysScroll(page), `home at ${size}: no sideways scroll`).toBe(true)
    })

    test(`a number to listen to, written with the keypad, at ${size}`, async ({ page }) => {
      test.setTimeout(480_000)
      await page.addInitScript(SPEECH_STUB)
      await page.setViewportSize(viewport)
      await coarsePointer(page)
      await linaWithEnglish(page)
      // The numbers 0 to 20 are the topic of the day: its last game is the listening one (the sound is on).
      await devMasterUntilTopic(page, 'eng-num-0-20')
      const { sessionSeen } = await classThenSession(page, viewport, 'eng-num-0-20', 'Números del 0 al 20')
      expect(sessionSeen.numberListen, 'the last game of a numbers topic is a number to listen to').toBe(true)
      await expect(page.getByText('+3 estrellas para tu cuerno')).toBeVisible({ timeout: 15_000 })
    })
  }

  for (const viewport of PLACEMENT_VIEWPORTS) {
    const size = `${viewport.width} × ${viewport.height}`
    test(`the English placement from the home banner at ${size}`, async ({ page }) => {
      test.setTimeout(300_000)
      await page.addInitScript(SPEECH_STUB)
      await page.setViewportSize(viewport)
      await coarsePointer(page)
      await linaWithEnglish(page, false)
      await page.goto('/play')
      const banner = page.getByRole('button', { name: /Haz la prueba de Inglés antes de empezar/ })
      await tapReachable(page, banner, 'el aviso de la prueba de Inglés')
      await expect(page).toHaveURL(/\/play\/prueba-ingles$/)
      for (let i = 0; i < 10; i++) {
        await tapReachable(page, page.getByRole('button', { name: 'No lo sé' }), '«No lo sé»')
        await tapReachable(page, page.getByRole('button', { name: /^(Siguiente|Terminar)$/ }), '«Siguiente» o «Terminar»')
        expect(await noSidewaysScroll(page), `placement at ${size}: no sideways scroll`).toBe(true)
      }
      await expect(page.getByText(/¡Gracias, Lía!/)).toBeVisible()
      await expect(page.getByText(/Ya sabemos por dónde empezar en Inglés/)).toBeVisible()
      await tapReachable(page, page.getByRole('button', { name: 'Volver al inicio' }), '«Volver al inicio»')
      await expect(page).toHaveURL(/\/play$/)
      await expect(page.getByRole('button', { name: /Haz la prueba de Inglés/ })).toHaveCount(0)
    })
  }
})
