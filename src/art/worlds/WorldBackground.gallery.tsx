/* Gallery: every background at vividness 0 / 0.5 / 1 in iPad landscape, iPad portrait and Android 16:10 frames.
   Optional URL filters (for focused screenshots): &bg=forest &v=1 &frame=landscape|portrait|android &scale=0.5 */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import type { BackgroundId } from '@/types'
import { WorldBackground } from './WorldBackground'

const IDS: BackgroundId[] = ['home', 'sky', 'forest', 'river', 'cave', 'mountain', 'lake', 'rainbow-garden', 'volcano', 'castle']
const FRAMES = { landscape: [1180, 820], portrait: [820, 1180], android: [1280, 800] } as const
type FrameName = keyof typeof FRAMES

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const onlyBg = params.get('bg')
const onlyV = params.get('v')
const onlyFrame = params.get('frame') as FrameName | null
const scale = Number(params.get('scale') ?? '') || 0.36

/** Renders the real viewport size, scaled down, so layout matches the device exactly. */
export function DeviceFrame({ w, h, k, children }: { w: number; h: number; k: number; children: ReactNode }) {
  return (
    <div style={{ width: w * k, height: h * k, position: 'relative', overflow: 'hidden', borderRadius: 10 }}>
      <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }}>{children}</div>
    </div>
  )
}

/** Mock UI on top, to judge the calm areas: a top bar title and a central card. */
function MockUi() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: 72, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--c-ink)' }}>Título del mundo</div>
      <div style={{ marginTop: 'auto', marginBottom: 'auto', width: 'min(520px, 80%)', height: 260, background: 'rgba(255,255,255,.92)', borderRadius: 24, boxShadow: 'var(--shadow-2)' }} />
    </div>
  )
}

const ui = params.get('ui') === '1'

const entries: GalleryEntry[] = []
for (const id of IDS) {
  if (onlyBg && onlyBg !== id) continue
  for (const frame of Object.keys(FRAMES) as FrameName[]) {
    if (onlyFrame ? onlyFrame !== frame : frame === 'android') continue
    for (const v of [1, 0.5, 0]) {
      if (onlyV && Number(onlyV) !== v) continue
      const [w, h] = FRAMES[frame]
      entries.push({
        title: `${id} · ${frame} · vividness ${v}`,
        render: () => (
          <DeviceFrame w={w} h={h} k={scale}>
            <WorldBackground id={id} vividness={v}>{ui && <MockUi />}</WorldBackground>
          </DeviceFrame>
        ),
      })
    }
  }
}

export default entries
