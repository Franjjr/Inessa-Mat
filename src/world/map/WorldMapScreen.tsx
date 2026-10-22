/* WorldMapScreen (/play/w/:worldId): one world as a path of nodes over its background. The companion is caught in
   the world's predicament until the guardian is beaten; the scene gets its colour back as the child progresses.
   Locked nodes explain themselves gently. The path scrolls on tablets and phones. */
import { useEffect, useMemo, useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompanionArt, Crystal, NodeIcon, Predicament, StarIcon, WorldBackground } from '@/art'
import {
  getWorld, isNodeUnlocked, isWorldUnlocked, nextNode, renderTemplate, templateContext,
} from '@/content'
import { useActiveChild, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import type { ChildProfile, NodeDef, ProgressState, WorldDef } from '@/types'
import s from './WorldMapScreen.module.css'

/** Path coordinates are authored in 0..1 (x → right, y → down); the SVG works in a 1000-unit square. */
const VB = 1000

type Pt = { x: number; y: number }

/** Smooth segment from points[i] to points[i+1] (Catmull-Rom converted to a cubic Bézier). */
function segmentPath(points: Pt[], i: number): string {
  const p0 = points[i - 1] ?? points[i]
  const p1 = points[i]
  const p2 = points[i + 1]
  const p3 = points[i + 2] ?? p2
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
  const f = (v: number) => (v * VB).toFixed(1)
  return `M ${f(p1.x)} ${f(p1.y)} C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(p2.x)} ${f(p2.y)}`
}

export default function WorldMapScreen() {
  const { worldId = '' } = useParams()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const world = getWorld(worldId)

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!world) return <Navigate to="/play" replace />
  if (!progress) return <Spinner />
  if (!isWorldUnlocked(progress, world.id)) return <Navigate to="/play" replace />
  return <WorldMap world={world} child={child} progress={progress} />
}

function WorldMap({ world, child, progress }: { world: WorldDef; child: ChildProfile; progress: ProgressState }) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  const ctx = templateContext(child)
  const wp = progress.worlds[world.id]
  const crystal = wp?.crystal === true

  const states = useMemo(() => world.nodes.map((node) => {
    const np = wp?.nodes[node.id]
    return {
      node,
      done: np?.done === true,
      stars: np?.stars ?? 0,
      locked: !isNodeUnlocked(progress, world.id, node.id),
    }
  }), [world, wp, progress])

  const current = states.find((x) => !x.locked && !x.done)?.node.id
  const path = useMemo(() => world.nodes.map((n) => n.pos), [world])
  const trainable = states.filter((x) => x.node.kind !== 'guardian')
  const doneTrainable = trainable.filter((x) => x.done).length
  // Rescue 0..1: how much of the companion's trouble has loosened (full once the crystal is won).
  const rescue = crystal ? 1 : trainable.length ? Math.min(1, doneTrainable / trainable.length) : 0
  const vividness = crystal ? 1 : 0.3 + 0.6 * rescue
  const hook = renderTemplate(world.hook, ctx)
  const next = nextNode(progress)
  const continueTarget = next && next.worldId === world.id ? next.nodeId : current
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Bring the child's next step into view.
  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    // Runs when the world or the next step changes, not on every progress tick.
  }, [world.id, current])

  const openNode = (node: NodeDef, locked: boolean) => {
    if (locked) {
      toast('Este paso se abre cuando termines el anterior. ¡Tú puedes!')
      return
    }
    navigate(`/play/w/${world.id}/${node.id}`)
  }

  return (
    <Screen className={s.screen} background={world.colorSoft}>
      <WorldBackground id={world.background} vividness={vividness} />

      <header className={s.top}>
        <BackButton aria-label="Volver al inicio" onClick={() => navigate('/play')} />
        <div className={s.titleBox}>
          <span className={s.kicker}>Mundo {world.index}</span>
          <h1 className={s.title}>{renderTemplate(world.name, ctx)}</h1>
        </div>
        <div className={s.crystalBox} aria-label={crystal ? 'Cristal conseguido' : 'Cristal pendiente'}>
          <Crystal color={world.color} state={crystal ? 'collected' : 'empty'} size={44} />
          <span className={s.crystalText}>{crystal ? 'Cristal' : 'Pendiente'}</span>
        </div>
      </header>

      <div className={s.hook} role="note">
        <span className={s.hookText}>{hook}</span>
        {continueTarget && (
          <Button size="sm" variant="primary" className={s.touch} onClick={() => navigate(`/play/w/${world.id}/${continueTarget}`)}>
            Continuar ›
          </Button>
        )}
      </div>

      <div className={s.scroll} ref={scrollRef}>
        <div className={s.stage}>
          <svg className={s.path} viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="none" aria-hidden="true">
            {path.slice(0, -1).map((_, i) => (
              <path
                key={`dash-${i}`}
                d={segmentPath(path, i)}
                className={s.pathBase}
              />
            ))}
            {path.slice(0, -1).map((_, i) => (
              states[i].done ? (
                <path
                  key={`solid-${i}`}
                  d={segmentPath(path, i)}
                  className={s.pathDone}
                  style={{ stroke: world.color }}
                />
              ) : null
            ))}
          </svg>

          {states.map(({ node, done, stars, locked }) => {
            const isCurrent = node.id === current
            const isGuardian = node.kind === 'guardian'
            const label = renderTemplate(node.title, ctx)
            const stateText = locked ? ', bloqueado' : done ? ', hecho' : isCurrent ? ', aquí estás' : ''
            return (
              <button
                key={node.id}
                type="button"
                ref={isCurrent ? currentRef : undefined}
                className={`${s.node} ${isCurrent ? s.current : ''} ${locked ? s.locked : ''} ${done ? s.done : ''}`}
                style={{ left: `${node.pos.x * 100}%`, top: `${node.pos.y * 100}%` }}
                aria-label={`${label}${stateText}`}
                aria-disabled={locked || undefined}
                onClick={() => openNode(node, locked)}
              >
                <span className={s.badge} aria-hidden="true">
                  {isGuardian ? (
                    <Predicament kind={world.predicament} rescue={rescue}>
                      <CompanionArt
                        species={child.companion.species}
                        colorway={child.companion.colorway}
                        equipped={child.companion.equipped}
                        size={crystal ? 96 : 88}
                        animated={!reduced}
                      />
                    </Predicament>
                  ) : (
                    <NodeIcon kind={node.kind} size={76} done={done} locked={locked} color={world.color} />
                  )}
                </span>
                {isGuardian && !crystal && <span className={s.guardianTag}>¡Ayúdame!</span>}
                {isCurrent && <span className={s.here}>Aquí</span>}
                <span className={s.label}>{label}</span>
                {done && (
                  <span className={s.stars} aria-hidden="true">
                    {[1, 2, 3].map((n) => <StarIcon key={n} filled={stars >= n} size={16} />)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}
