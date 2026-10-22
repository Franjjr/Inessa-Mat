/* Dev gallery: every accessory on every species, outfits, and accessories across poses. */
import type { CSSProperties } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { COMPANION_SPECIES } from '@/types'
import { POSES } from '../characters/shared/pose'
import { ACCESSORY_IDS } from './accessories'
import { CompanionArt } from './CompanionArt'
import { COLORWAYS } from './types'

const label: CSSProperties = { fontSize: 11, color: '#8b7aa8', textAlign: 'center', fontFamily: 'var(--font-display)' }

const OUTFITS: string[][] = [
  ['wizard-hat', 'cape', 'wand'],
  ['crown', 'medal', 'cape'],
  ['flower-crown', 'fairy-wings', 'lollipop'],
  ['cap', 'sunglasses', 'backpack', 'balloon'],
  ['beanie', 'scarf', 'paintbrush'],
  ['bow', 'star-glasses', 'bowtie', 'balloon'],
  ['crown', 'star-glasses', 'scarf', 'fairy-wings', 'wand'],
  ['beanie', 'sunglasses', 'bowtie', 'backpack', 'lollipop'],
]

const entries: GalleryEntry[] = [
  {
    title: 'accessory grid',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(8, 104px)`, gap: 2, alignItems: 'center' }}>
        <div />
        {COMPANION_SPECIES.map((sp) => <div key={sp} style={label}>{sp}</div>)}
        {ACCESSORY_IDS.map((id) => (
          <div key={id} style={{ display: 'contents' }}>
            <div style={label}>{id}</div>
            {COMPANION_SPECIES.map((sp) => <CompanionArt key={sp} species={sp} size={104} equipped={[id]} animated={false} />)}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'outfits',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 200px)', gap: 8 }}>
        {COMPANION_SPECIES.map((sp, i) => (
          <CompanionArt key={sp} species={sp} size={200} colorway={COLORWAYS[i % 4]} equipped={OUTFITS[i]} pose={i % 2 ? 'cheer' : 'happy'} />
        ))}
      </div>
    ),
  },
  {
    title: 'outfit x poses',
    render: () => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 1100 }}>
        {POSES.map((p) => (
          <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CompanionArt species="fox" pose={p} size={104} equipped={['wizard-hat', 'scarf', 'cape', 'balloon', 'star-glasses']} />
            <div style={label}>{p}</div>
          </div>
        ))}
        {POSES.map((p) => (
          <div key={`b${p}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CompanionArt species="bunny" colorway="berry" pose={p} size={104} flip equipped={['crown', 'fairy-wings', 'wand', 'bowtie']} />
            <div style={label}>{p} · flip</div>
          </div>
        ))}
      </div>
    ),
  },
]

export default entries
