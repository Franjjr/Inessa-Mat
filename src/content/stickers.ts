/* Sticker album: 3 per world + 3 special ones. `earnedBy` rules (evaluated by progression.applyNodeResult):
     node:<worldId>:<nodeId>           finish that node
     stars:<worldId>:<nodeId>:<n>      get at least n stars on that node (best result counts)
     world:<worldId>                   win the world's crystal
     days:<n>                          play on n different days (never a streak that can be lost)
     season:<seasonId>                 win all the crystals of the season ('*': of the season the child plays) */
import type { ProgressState, StickerDef } from '@/types'

export const stickers: StickerDef[] = [
  // w1 — Bosque de los Grupos
  { id: 'w1-seta', name: 'Seta saltarina', worldId: 'w1', emoji: '🍄', earnedBy: 'node:w1:groups' },
  { id: 'w1-flor', name: 'Flor del espejo', worldId: 'w1', emoji: '🌸', earnedBy: 'stars:w1:array:3' },
  { id: 'w1-buho', name: 'Búho Sabio', worldId: 'w1', emoji: '🦉', earnedBy: 'world:w1' },
  // w2 — Río de las Sumas
  { id: 'w2-pez', name: 'Pez dorado', worldId: 'w2', emoji: '🐟', earnedBy: 'node:w2:column-carry' },
  { id: 'w2-mochila', name: 'Mochila de llevadas', worldId: 'w2', emoji: '🎒', earnedBy: 'stars:w2:column-4d:3' },
  { id: 'w2-rana', name: 'Rana Saltarina', worldId: 'w2', emoji: '🐸', earnedBy: 'world:w2' },
  // w3 — Cueva del Seis
  { id: 'w3-mariquita', name: 'Mariquita bailarina', worldId: 'w3', emoji: '🐞', earnedBy: 'node:w3:necklace' },
  { id: 'w3-farolillo', name: 'Farolillo de la cueva', worldId: 'w3', emoji: '🏮', earnedBy: 'stars:w3:maze:3' },
  { id: 'w3-corona', name: 'Corona de la Reina', worldId: 'w3', emoji: '👑', earnedBy: 'world:w3' },
  // w4 — Montaña de las Restas
  { id: 'w4-chocolate', name: 'Chocolate caliente', worldId: 'w4', emoji: '☕', earnedBy: 'node:w4:column-zero' },
  { id: 'w4-muneco', name: 'Muñeco de nieve', worldId: 'w4', emoji: '⛄', earnedBy: 'stars:w4:column-4d:3' },
  { id: 'w4-osa', name: 'Osa Nieve', worldId: 'w4', emoji: '🐻‍❄️', earnedBy: 'world:w4' },
  // w5 — Lago del Ocho
  { id: 'w5-concha', name: 'Concha del lago', worldId: 'w5', emoji: '🐚', earnedBy: 'node:w5:chain' },
  { id: 'w5-tetera', name: 'Tetera de Octavio', worldId: 'w5', emoji: '🫖', earnedBy: 'stars:w5:bubbles:3' },
  { id: 'w5-pulpo', name: 'Pulpo Octavio', worldId: 'w5', emoji: '🐙', earnedBy: 'world:w5' },
  // w6 — Jardín del Arcoíris
  { id: 'w6-arcoiris', name: 'Arcoíris', worldId: 'w6', emoji: '🌈', earnedBy: 'node:w6:pixel' },
  { id: 'w6-tulipan', name: 'Tulipán de colores', worldId: 'w6', emoji: '🌷', earnedBy: 'stars:w6:race:3' },
  { id: 'w6-hada', name: 'Hada Iris', worldId: 'w6', emoji: '🧚', earnedBy: 'world:w6' },
  // w7 — Forja del Dragón
  { id: 'w7-chispa', name: 'Chispita de fuego', worldId: 'w7', emoji: '🔥', earnedBy: 'node:w7:column-carry' },
  { id: 'w7-escudo', name: 'Escudo brillante', worldId: 'w7', emoji: '🛡️', earnedBy: 'stars:w7:board:3' },
  { id: 'w7-dragona', name: 'Dragona Chispa', worldId: 'w7', emoji: '🐉', earnedBy: 'world:w7' },
  // w8 — Castillo del Reparto
  { id: 'w8-gema', name: 'Gema repartida', worldId: 'w8', emoji: '💎', earnedBy: 'node:w8:share' },
  { id: 'w8-torre', name: 'Torre del castillo', worldId: 'w8', emoji: '🏰', earnedBy: 'stars:w8:division:3' },
  { id: 'w8-reina', name: 'Reina Aurora', worldId: 'w8', emoji: '👸', earnedBy: 'world:w8' },
  // special
  { id: 'dias-3', name: 'Tres días de magia', emoji: '⭐', earnedBy: 'days:3' },
  { id: 'dias-7', name: 'Siete días de magia', emoji: '🌟', earnedBy: 'days:7' },
  { id: 'lumi-brilla', name: 'Lumi brilla otra vez', emoji: '🦄', earnedBy: 'season:*' },
]

export type StickerRule =
  | { type: 'node'; worldId: string; nodeId: string }
  | { type: 'stars'; worldId: string; nodeId: string; stars: number }
  | { type: 'world'; worldId: string }
  | { type: 'days'; days: number }
  | { type: 'season'; seasonId: string }

/** Parse an `earnedBy` rule; null when malformed. */
export function parseStickerRule(rule: string): StickerRule | null {
  const p = rule.split(':')
  switch (p[0]) {
    case 'node': return p.length === 3 && p[1] && p[2] ? { type: 'node', worldId: p[1], nodeId: p[2] } : null
    case 'stars': {
      const n = Number(p[3])
      return p.length === 4 && p[1] && p[2] && Number.isInteger(n) && n >= 1 && n <= 3
        ? { type: 'stars', worldId: p[1], nodeId: p[2], stars: n } : null
    }
    case 'world': return p.length === 2 && p[1] ? { type: 'world', worldId: p[1] } : null
    case 'days': case 'streak': {
      const n = Number(p[1])
      return p.length === 2 && Number.isInteger(n) && n >= 1 ? { type: 'days', days: n } : null
    }
    case 'season': return p.length === 2 && p[1] ? { type: 'season', seasonId: p[1] } : null
    default: return null
  }
}

/** Is the sticker rule satisfied by this progress? `worldIds` = the season's worlds (for 'season'). */
export function stickerRuleMet(rule: string, progress: ProgressState, worldIds: string[]): boolean {
  const r = parseStickerRule(rule)
  if (!r) return false
  switch (r.type) {
    case 'node': return progress.worlds[r.worldId]?.nodes[r.nodeId]?.done === true
    case 'stars': return (progress.worlds[r.worldId]?.nodes[r.nodeId]?.stars ?? 0) >= r.stars
    case 'world': return progress.worlds[r.worldId]?.crystal === true
    case 'days': return new Set(progress.daysPlayed).size >= r.days
    case 'season': return (r.seasonId === '*' || progress.seasonId === r.seasonId) && worldIds.length > 0 && worldIds.every((w) => progress.worlds[w]?.crystal === true)
  }
}

const BY_ID = new Map(stickers.map((s) => [s.id, s]))

export function getSticker(id: string): StickerDef | undefined {
  return BY_ID.get(id)
}

/** "de" + a world name, contracting "de El …" into "del …" ("del Bosque de los Grupos", "de la Cueva del Seis"). */
function withDe(name: string): string {
  if (name.startsWith('El ')) return `del ${name.slice(3)}`
  return `de ${name.replace(/^(La|Los|Las) /, (m) => m.toLowerCase())}`
}

/** Child-facing description of how a sticker is earned (album "¿Cómo se consigue?"). */
export function describeStickerRule(rule: string, nodeTitle?: (worldId: string, nodeId: string) => string | undefined, worldName?: (worldId: string) => string | undefined): string {
  const r = parseStickerRule(rule)
  if (!r) return ''
  switch (r.type) {
    case 'node': return `Termina «${nodeTitle?.(r.worldId, r.nodeId) ?? r.nodeId}».`
    case 'stars': return `Consigue ${r.stars === 1 ? '1 estrella' : `${r.stars} estrellas`} en «${nodeTitle?.(r.worldId, r.nodeId) ?? r.nodeId}».`
    case 'world': return `Gana el cristal ${withDe(worldName?.(r.worldId) ?? r.worldId)}.`
    case 'days': return `Juega ${r.days} días distintos.`
    case 'season': return 'Consigue los 8 cristales.'
  }
}
