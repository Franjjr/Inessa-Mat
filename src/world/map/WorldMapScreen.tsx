/* WorldMapScreen (/play/w/:worldId): one world as a path of nodes over its background. The companion is caught in
   the world's predicament until the guardian is beaten; the scene gets its colour back as the child progresses.
   Locked nodes explain themselves gently. The path scrolls on tablets and phones. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompanionArt, Crystal, NodeIcon, Predicament, StarIcon, WorldBackground } from '@/art'
import {
  getWorld, ISLAND_ID, ISLAND_STOP_PX, isNodeUnlocked, isWorldUnlocked, nextNode, renderTemplate, templateContext,
} from '@/content'
import { useActiveChild, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import type { ChildProfile, NodeDef, ProgressState, WorldDef } from '@/types'
import { baseStageHeight, GUARDIAN_WON_PX, ICON_PX, layoutMap, GUARDIAN_PX, pillOf } from './labels'
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

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!progress) return <Spinner />
  // The world of the child's season: the 2.º adventure has its own stops on the same map.
  const world = getWorld(worldId, progress.seasonId)
  if (!world) return <Navigate to="/play" replace />
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
  // Rescue 0..1: how much of the companion's trouble has loosened, from the stars of the stops (3 for a full
  // practice): finishing a reading does not free the companion as much as practising (full once the crystal is won).
  const starsTrainable = trainable.reduce((sum, x) => sum + Math.min(3, x.stars), 0)
  const rescue = crystal ? 1 : trainable.length ? Math.min(1, starsTrainable / (3 * trainable.length)) : 0
  const vividness = crystal ? 1 : 0.3 + 0.6 * rescue
  const hook = renderTemplate(world.hook, ctx)
  const next = nextNode(progress)
  const continueTarget = next && next.worldId === world.id ? next.nodeId : current
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // The real size of the scrolling area: name tags are placed in real pixels so none lands on another stop.
  const [area, setArea] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? Math.max(200, window.innerHeight - 130) : 600,
    vh: typeof window !== 'undefined' ? window.innerHeight : 768,
  }))
  const [moreBelow, setMoreBelow] = useState(false)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setArea((a) => (a.w === el.clientWidth && a.h === el.clientHeight && a.vh === window.innerHeight ? a : { w: el.clientWidth, h: el.clientHeight, vh: window.innerHeight }))
      }
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The island has many stops (one group per stage): its stage is as tall as they need, so they never stack on each other.
  const isIsland = world.id === ISLAND_ID
  const layout = useMemo(() => layoutMap(
    states.map(({ node, done }) => ({ node, title: renderTemplate(node.title, ctx), done, current: node.id === current, crystal, petName: ctx.petName })),
    area.w,
    isIsland ? world.nodes.length * ISLAND_STOP_PX : baseStageHeight(area.w, area.h, area.vh),
    isIsland,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [states, current, crystal, area, isIsland, world.nodes.length, child.nickname, ctx.petName])
  const stageHeight = { height: `${layout.height}px` }

  // Bring the child's next step into view with the step after it also in view, and room above for its pill.
  useEffect(() => {
    const el = scrollRef.current
    const idx = states.findIndex((x) => x.node.id === current)
    if (!el || idx < 0) return
    const top = (i: number) => Math.min(layout.placed[i].icon.y0, layout.placed[i].label.y0, ...layout.placed[i].extras.map((b) => b.y0))
    const bottom = (i: number) => Math.max(layout.placed[i].icon.y1, layout.placed[i].label.y1)
    const mid = (layout.placed[idx].icon.y0 + layout.placed[idx].icon.y1) / 2
    let target = mid - area.h / 2
    if (idx + 1 < states.length) target = Math.max(target, bottom(idx + 1) + 12 - area.h)
    target = Math.min(target, top(idx) - 28)
    // Never leave a tag half cut at the top edge (nor in its fading strip): move the view up to show it whole.
    const boxes = layout.placed.flatMap((p) => [p.icon, p.label, ...p.extras])
    for (let k = 0; k < 4; k++) {
      const cut = boxes.find((b) => b.y0 < target + 16 && b.y1 > target)
      if (!cut) break
      target = cut.y0 - 16
    }
    target = Math.max(0, Math.min(target, layout.height - area.h))
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' })
    // Runs when the world or the next step changes, not on every progress tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id, current, area.w, area.h])

  const onScroll = () => {
    const el = scrollRef.current
    if (el) setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 24)
  }
  useEffect(onScroll, [layout.height, area.h])

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

      <div className={s.band}>
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
      </div>

      <div className={s.scrollWrap}>
      <div className={s.scroll} ref={scrollRef} onScroll={onScroll}>
        <div className={s.stage} style={stageHeight}>
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

          {states.map(({ node, done, stars, locked }, idx) => {
            const isCurrent = node.id === current
            const isGuardian = node.kind === 'guardian'
            const label = renderTemplate(node.title, ctx)
            const pl = layout.placed[idx]
            const size = isGuardian ? (crystal ? GUARDIAN_WON_PX : GUARDIAN_PX) : ICON_PX
            const stateText = locked ? ', bloqueado' : done ? ', hecho' : isCurrent ? ', aquí estás' : ''
            return (
              <button
                key={node.id}
                type="button"
                ref={isCurrent ? currentRef : undefined}
                className={`${s.node} ${isCurrent ? s.current : ''} ${locked ? s.locked : ''} ${done ? s.done : ''}`}
                style={{ left: `${node.pos.x * 100}%`, top: `${node.pos.y * 100}%`, width: size, height: size }}
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
                {isCurrent && <span className={s.here}>{pillOf(ctx.petName).text}</span>}
                <span className={s.tag} style={{ left: `calc(50% + ${pl.dx}px)`, top: `calc(50% + ${pl.dy}px)`, width: pl.w }}>
                  <span className={s.label}>{label}</span>
                  {done && (
                    <span className={s.stars} aria-hidden="true">
                      {[1, 2, 3].map((n) => <StarIcon key={n} filled={stars >= n} size={16} />)}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {moreBelow && <span className={s.more} aria-hidden="true">▼</span>}
      </div>
    </Screen>
  )
}
