/* Dev gallery: every character × pose, sizes, flip and LumiHorn states. */
import type { CSSProperties } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import type { CharacterProps } from '@/types'
import { Character } from './Character'
import { LumiHorn } from './LumiHorn'
import { POSES } from './shared/pose'

const IDS: CharacterProps['id'][] = ['lumi', 'borron', 'owl', 'frog', 'ladybug', 'polarbear', 'octopus', 'fairy', 'dragon', 'queen']

const label: CSSProperties = { fontSize: 12, color: '#8b7aa8', textAlign: 'center', fontFamily: 'var(--font-display)' }

function PoseGrid({ id, size = 150 }: { id: CharacterProps['id']; size?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${size}px)`, gap: 10 }}>
      {POSES.map((p) => (
        <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Character id={id} pose={p} size={size} />
          <div style={label}>{p}</div>
        </div>
      ))}
    </div>
  )
}

const entries: GalleryEntry[] = [
  {
    title: 'hero 300',
    render: () => (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 1300 }}>
        {IDS.map((id) => <Character key={id} id={id} size={300} />)}
      </div>
    ),
  },
  ...IDS.map((id) => ({ title: `${id} · poses`, render: () => <PoseGrid id={id} /> })),
  {
    title: 'sizes 48 / 120 / 240',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[48, 120, 240].map((sz) => (
          <div key={sz} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {IDS.map((id) => <Character key={id} id={id} size={sz} />)}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'LumiHorn 0..8',
    render: () => (
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {Array.from({ length: 9 }, (_, n) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LumiHorn crystals={Array.from({ length: 8 }, (_, i) => i < n)} size={150} />
            <div style={label}>{n}/8</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'LumiHorn sizes + HUD',
    render: () => (
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        <LumiHorn crystals={[true, false, true, false, true, true, false, false]} size={48} />
        <LumiHorn crystals={[true, false, true, false, true, true, false, false]} size={72} />
        <LumiHorn crystals={Array(8).fill(true)} size={120} />
        <LumiHorn crystals={Array(8).fill(true)} size={260} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 8px', borderRadius: 999, background: '#2e1a47' }}>
          <LumiHorn crystals={[true, true, true, false, false, false, false, false]} size={56} />
          <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 20 }}>3/8</span>
        </div>
      </div>
    ),
  },
  {
    title: 'flip + static',
    render: () => (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {IDS.map((id) => <Character key={id} id={id} size={110} flip pose="think" animated={false} />)}
      </div>
    ),
  },
]

export default entries
