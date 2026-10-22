/* Dev gallery: every companion species x colourway x pose, plus sizes. */
import type { CSSProperties } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { COMPANION_SPECIES, type CompanionSpecies } from '@/types'
import { POSES } from '../characters/shared/pose'
import { CompanionArt } from './CompanionArt'
import { COLORWAYS } from './types'

const label: CSSProperties = { fontSize: 11, color: '#8b7aa8', textAlign: 'center', fontFamily: 'var(--font-display)' }

function SpeciesSheet({ species }: { species: CompanionSpecies }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `70px repeat(${POSES.length}, 96px)`, gap: 4, alignItems: 'center' }}>
      <div />
      {POSES.map((p) => <div key={p} style={label}>{p}</div>)}
      {COLORWAYS.map((cw) => (
        <div key={cw} style={{ display: 'contents' }}>
          <div style={label}>{cw}</div>
          {POSES.map((p) => <CompanionArt key={p} species={species} colorway={cw} pose={p} size={96} />)}
        </div>
      ))}
    </div>
  )
}

const entries: GalleryEntry[] = [
  {
    title: 'line-up 200',
    render: () => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 1180 }}>
        {COMPANION_SPECIES.map((sp) => <CompanionArt key={sp} species={sp} size={200} />)}
      </div>
    ),
  },
  {
    title: 'colourways 150',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 130px)', gap: 4 }}>
        {COLORWAYS.map((cw) => COMPANION_SPECIES.map((sp) => <CompanionArt key={`${cw}${sp}`} species={sp} colorway={cw} size={130} />))}
      </div>
    ),
  },
  ...COMPANION_SPECIES.map((sp) => ({ title: `${sp} · sheet`, render: () => <SpeciesSheet species={sp} /> })),
  {
    title: 'sizes 48 / 120 / 240',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[48, 120, 240].map((sz) => (
          <div key={sz} style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {COMPANION_SPECIES.map((sp) => <CompanionArt key={sp} species={sp} size={sz} pose="happy" equipped={sz === 240 ? ['crown'] : []} />)}
          </div>
        ))}
      </div>
    ),
  },
]

export default entries
