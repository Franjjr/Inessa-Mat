/* Full-bleed, layered storybook scenes for every BackgroundId. Children render above the scene.
   vividness 0..1: 0 = drained by Borrón's fog (desaturated + fog veil, banks and swirls), 1 = full colour.
   Colour changes ease smoothly (CSS transitions on fill/stroke/opacity), so raising vividness after a rescue
   "paints" the world back. */
import clsx from 'clsx'
import { memo } from 'react'
import type { BackgroundId, WorldBackgroundProps } from '@/types'
import { makeTint } from './color'
import { Fog } from './Fog'
import { IdScope, TintProvider, tintedClass } from './kit'
import { SCENES, SCENE_BASE } from './scenes'
import s from './WorldBackground.module.css'

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1)

const SceneLayer = memo(function SceneLayer({ id, vividness }: { id: BackgroundId; vividness: number }) {
  const Scene = SCENES[id] ?? SCENES.home
  return (
    <IdScope>
      <TintProvider vividness={vividness}>
        <Scene />
      </TintProvider>
    </IdScope>
  )
})

export function WorldBackground({ id, vividness = 1, className, children }: WorldBackgroundProps) {
  const known = id in SCENES ? id : 'home'
  // Quantise so tiny float jitter from animated callers does not re-render the whole scene.
  const v = Math.round(clamp01(vividness) * 100) / 100
  return (
    <div
      className={clsx(s.root, className)}
      data-background={known}
      data-vividness={v.toFixed(2)}
      style={{ backgroundColor: makeTint(v)(SCENE_BASE[known]) }}
    >
      <div className={clsx(s.scene, tintedClass)} aria-hidden="true">
        <SceneLayer id={known} vividness={v} />
        <Fog amount={1 - v} />
      </div>
      {children}
    </div>
  )
}
