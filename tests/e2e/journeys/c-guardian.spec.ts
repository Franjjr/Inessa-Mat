/* Journey C: the guardian's challenge of world 1. The child accepts the challenge, answers the rounds and the
   Hechizo del Cristal on the keyboard, watches the rescue story and receives the crystal, which then shows on the
   map. Earlier nodes of the world are set up through the dev data layer so the test starts at the guardian. */
import { expect, test, type Page } from '@playwright/test'
import {
  continueFromReward, createChildThroughOnboarding, devEditProgress, driveExercises, nodeFinished, tapStoryUntilButton,
} from '../helpers'

/** The rounds and the spell, until the crystal is won (a rescue story or the reward is on screen). */
async function winGuardianChallenge(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: '¡Acepto el desafío!' })
  if (await accept.isVisible().catch(() => false)) await accept.click()
  await driveExercises(page, async () => (await nodeFinished(page)) || (await page.getByText('Cristal conseguido').first().isVisible().catch(() => false)))
}

test.describe('C · desafío del guardián', () => {
  test('aceptar, responder rondas y el hechizo → historia de rescate → cristal en el mapa', async ({ page }) => {
    await createChildThroughOnboarding(page)
    await devEditProgress(page, { kind: 'worldDoneBeforeGuardian', worldId: 'w1' })

    await page.goto('/play/w/w1')
    const guardianNode = page.getByRole('button', { name: /El desafío del Búho Sabio/ })
    await expect(guardianNode).toBeVisible()
    await expect(page.getByRole('button', { name: /El desafío del Búho Sabio, bloqueado/ })).toHaveCount(0)
    await guardianNode.click()
    await expect(page).toHaveURL(/\/play\/w\/w1\/guardian$/)

    await expect(page.getByRole('button', { name: '¡Acepto el desafío!' })).toBeVisible()
    await winGuardianChallenge(page)
    const won = page.getByRole('button', { name: '¡Cristal conseguido!' })
    if (await won.isVisible().catch(() => false)) await won.click()

    // Rescue story, then the crystal reward.
    await tapStoryUntilButton(page, '¡Seguir!')
    await continueFromReward(page)
    await expect(page).toHaveURL(/\/play\/w\/w1$/)
    await expect(page.getByLabel('Cristal conseguido')).toBeVisible()
  })
})
