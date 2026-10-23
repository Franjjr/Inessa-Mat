/* Sticker album pages (pure): one page per world, one for the special stickers. A locked sticker shows how it is
   earned (describeStickerRule), never its picture. */
import { describeStickerRule, getNode, getWorld, seasonOf, stickers } from '@/content'
import { childText } from '@/world/rewards/childText'
import type { ChildProfile, ProgressState, StickerDef, WorldDef } from '@/types'
import { worldHex } from '@/world/rewards/worldColors'

export interface AlbumSticker {
  id: string
  name: string
  emoji: string
  owned: boolean
  /** "¿Cómo se consigue?" text, child-facing. */
  rule: string
}

export interface AlbumPage {
  id: string
  title: string
  color: string
  soft: string
  stickers: AlbumSticker[]
}

export const SPECIAL_PAGE_ID = 'special'

export function albumPages(progress: ProgressState, child: ChildProfile | null): AlbumPage[] {
  const owned = new Set(progress.stickers)
  const describe = (s: StickerDef): AlbumSticker => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji ?? '⭐',
    owned: owned.has(s.id),
    rule: childText(child, describeStickerRule(
      s.earnedBy,
      (worldId, nodeId) => {
        const node = getNode(worldId, nodeId, progress.seasonId)
        return node ? childText(child, node.title) : undefined
      },
      (worldId) => getWorld(worldId, progress.seasonId)?.shortName,
    )),
  })

  const pages: AlbumPage[] = seasonOf(progress).worlds.map((w: WorldDef) => ({
    id: w.id,
    title: childText(child, w.name),
    color: worldHex(w.id),
    soft: w.colorSoft,
    stickers: stickers.filter((s) => s.worldId === w.id).map(describe),
  }))
  const special = stickers.filter((s) => !s.worldId)
  if (special.length) {
    pages.push({ id: SPECIAL_PAGE_ID, title: 'Especiales', color: '#c026d3', soft: 'var(--c-magic-soft)', stickers: special.map(describe) })
  }
  return pages
}

export function albumTotals(pages: AlbumPage[]): { owned: number; total: number } {
  const all = pages.flatMap((p) => p.stickers)
  return { owned: all.filter((s) => s.owned).length, total: all.length }
}
