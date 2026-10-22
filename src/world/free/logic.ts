/* Free play rules (pure): which times tables and which minigames the child has unlocked, and the config of a
   table drill. Only what the child has reached is offered; nothing here changes progress. */
import { isNodeUnlocked, season1 } from '@/content'
import type { ActivityConfig, ActivityKind, ProgressState, WorldDef, NodeDef } from '@/types'

export interface FreeGame {
  worldId: string
  world: WorldDef
  node: NodeDef
  config: ActivityConfig
}

/** Times tables that appear in an unlocked activity (sorted). */
export function unlockedTables(progress: ProgressState): number[] {
  const tables = new Set<number>()
  for (const world of season1.worlds) {
    for (const node of world.nodes) {
      if (!node.activity || !isNodeUnlocked(progress, world.id, node.id)) continue
      for (const t of node.activity.selector.tables ?? []) tables.add(t)
    }
  }
  return [...tables].sort((a, b) => a - b)
}

/** Every minigame the child has unlocked, in season order. Review nodes and story nodes are not games. */
export function unlockedGames(progress: ProgressState): FreeGame[] {
  const games: FreeGame[] = []
  for (const world of season1.worlds) {
    for (const node of world.nodes) {
      if (!node.activity || !isNodeUnlocked(progress, world.id, node.id)) continue
      games.push({ worldId: world.id, world, node, config: node.activity })
    }
  }
  return games
}

/** A focused drill on one times table (facts from the selector, shown with the trick if needed). */
export function tableDrill(table: number): ActivityConfig {
  return {
    kind: 'facts',
    title: `La tabla del ${table}`,
    instructions: 'Resuelve cada multiplicación. Si necesitas ayuda, usa el truco.',
    selector: { kinds: ['fact-mul'], tables: [table], factorRange: [1, 10] },
    count: 10,
    params: { showTrick: true },
  }
}

const KIND_LABEL: Record<ActivityKind, string> = {
  facts: 'Multiplicaciones', race: 'Carrera contra tu récord', missing: 'Números que faltan', wheel: 'La rueda',
  necklace: 'Collar de cuentas', chain: 'Cadena de dobles', family: 'Familias de números', maze: 'Laberinto',
  pixel: 'Dibujo secreto', memory: 'Memoria', bubbles: 'Burbujas', groups: 'Grupos', array: 'Filas y columnas',
  column: 'Cuentas en columna', division: 'Repartos', share: 'Repartir', word: 'Problemas', board: 'Carrera al castillo',
  exercises: 'Ejercicios',
}

export function kindLabel(kind: ActivityKind): string {
  return KIND_LABEL[kind]
}
