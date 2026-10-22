/* Shop rules (pure): what a child may buy, wear and take off. Persistence is the screen's job (@/data). */
import { canBuyAccessory, getAccessory, getWorld, spendableStars } from '@/content'
import type { AccessoryDef, Companion, ProgressState } from '@/types'

export type AccessoryStatus = 'equipped' | 'owned' | 'buyable' | 'stars' | 'locked' | 'unknown'

export function accessoryStatus(progress: ProgressState, companion: Companion, id: string): AccessoryStatus {
  if (companion.equipped.includes(id)) return 'equipped'
  if (progress.accessoriesOwned.includes(id)) return 'owned'
  const check = canBuyAccessory(progress, id)
  if (check.ok) return 'buyable'
  if (check.reason === 'stars') return 'stars'
  if (check.reason === 'locked') return 'locked'
  return 'unknown'
}

/** Child-facing reason a locked accessory is not for sale yet (the world whose crystal unlocks it). */
export function lockedReason(a: AccessoryDef): string {
  const world = a.requiresWorld ? getWorld(a.requiresWorld) : undefined
  return world ? `Gana el cristal ${world.crystalName} de ${world.shortName}` : 'Aún no está disponible'
}

/** Put an owned accessory on: one per slot, so a new hat replaces the old one. Pure. */
export function equipAccessory(equipped: string[], id: string): string[] {
  const slot = getAccessory(id)?.slot
  const others = equipped.filter((e) => e !== id && (!slot || getAccessory(e)?.slot !== slot))
  return [...others, id]
}

export function unequipAccessory(equipped: string[], id: string): string[] {
  return equipped.filter((e) => e !== id)
}

/** The equipped list the companion would wear while the child previews an accessory (no saving). */
export function previewEquipped(companion: Companion, previewId: string | null): string[] {
  return previewId ? equipAccessory(companion.equipped, previewId) : companion.equipped
}

export function affordableAfter(progress: ProgressState, price: number): number {
  return spendableStars(progress) - price
}
