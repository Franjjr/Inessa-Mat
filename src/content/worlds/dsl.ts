/* Builders for world nodes. Positions are assigned by `world()` along the world's winding path (see path.ts). */
import type { ActivityConfig, NodeDef, WorldDef } from '@/types'
import { layoutPath } from './path'

type NodeSpec = Omit<NodeDef, 'pos'>

export const storyNode = (id: string, title: string, ref: string): NodeSpec => ({ id, kind: 'story', title, ref })
export const lessonNode = (id: string, title: string, ref: string): NodeSpec => ({ id, kind: 'lesson', title, ref })
export const guardianNode = (title: string, ref: string): NodeSpec => ({ id: 'guardian', kind: 'guardian', title, ref })
export const reviewNode = (id: string, title: string): NodeSpec => ({ id, kind: 'review', title })
export const activityNode = (id: string, activity: ActivityConfig): NodeSpec => ({ id, kind: 'activity', title: activity.title, activity })

export interface WorldSpec extends Omit<WorldDef, 'nodes' | 'seasonId' | 'color' | 'colorSoft'> {
  /** Control points of the map path, 0..1 (x right, y down). Nodes are spread evenly along it. */
  path: [number, number][]
  nodes: NodeSpec[]
}

export function world(spec: WorldSpec): WorldDef {
  const { path, nodes, ...meta } = spec
  const pos = layoutPath(path, nodes.length)
  return {
    ...meta,
    seasonId: 's1',
    color: `var(--${spec.id})`,
    colorSoft: `var(--${spec.id}-soft)`,
    nodes: nodes.map((n, i) => ({ ...n, pos: pos[i] })),
  }
}
