/* Gallery: crystals, stars, the Gran Cofre, sparkles, map node icons and the app icons. */
import { useState, type ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import type { NodeKind } from '@/types'
import { ChestArt } from './ChestArt'
import { Crystal, type CrystalState } from './Crystal'
import { NodeIcon } from './NodeIcon'
import { Sparkles } from './Sparkles'
import { StarIcon } from './StarIcon'

const WORLDS = ['var(--w1)', 'var(--w2)', 'var(--w3)', 'var(--w4)', 'var(--w5)', 'var(--w6)', 'var(--w7)', 'var(--w8)']
const STATES: CrystalState[] = ['locked', 'empty', 'glow', 'collected']
const KINDS: NodeKind[] = ['story', 'lesson', 'activity', 'guardian', 'review']

const row = (children: ReactNode, gap = 14) => <div style={{ display: 'flex', gap, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
const btn = { minHeight: 56, minWidth: 120, borderRadius: 16, fontSize: 18 } as const

function StarDemo() {
  const [n, setN] = useState(1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      {row([1, 2, 3].map((i) => <StarIcon key={i} filled={i <= n} size={64} label={i <= n ? 'Estrella conseguida' : 'Estrella por conseguir'} />))}
      <button type="button" style={btn} onClick={() => setN((x) => (x >= 3 ? 0 : x + 1))}>+1 estrella</button>
    </div>
  )
}

function ChestDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <ChestArt open={open} size={200} label="El Gran Cofre" />
      <button type="button" style={btn} onClick={() => setOpen((o) => !o)}>{open ? 'Cerrar' : 'Abrir'}</button>
    </div>
  )
}

const entries: GalleryEntry[] = [
  {
    title: 'Crystal · 8 mundos × locked / empty / glow / collected',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 64px)', gap: 12, padding: 8, background: '#faf5ff', borderRadius: 12 }}>
        {STATES.flatMap((st) => WORLDS.map((c) => <Crystal key={st + c} color={c} state={st} size={64} />))}
      </div>
    ),
  },
  { title: 'Crystal · grande (glow, collected)', render: () => row(<><Crystal color="var(--w6)" state="glow" size={140} /><Crystal color="#16a34a" state="collected" size={140} /><Crystal color="var(--w4)" state="empty" size={140} /><Crystal color="var(--w2)" state="locked" size={140} /></>) },
  { title: 'Crystal · color CSS desconocido (color-mix)', render: () => row(<><Crystal color="rebeccapurple" state="collected" size={72} /><Crystal color="teal" state="glow" size={72} /></>) },
  { title: 'StarIcon · vacía / llena (tamaños)', render: () => row(<>{[24, 32, 44, 64, 96].map((sz) => <StarIcon key={sz} size={sz} />)}{[24, 32, 44, 64, 96].map((sz) => <StarIcon key={`f${sz}`} size={sz} filled />)}</>, 10) },
  { title: 'StarIcon · pop al llenarse (pulsa)', render: () => <StarDemo /> },
  { title: 'ChestArt · cerrado / abierto', render: () => row(<><ChestArt size={200} /><ChestArt open size={200} /></>) },
  { title: 'ChestArt · animación (pulsa)', render: () => <ChestDemo /> },
  {
    title: 'Sparkles · sobre una tarjeta',
    render: () => (
      <div style={{ display: 'flex', gap: 24 }}>
        {[['#fbbf24', 8], ['#f472b6', 14], ['#7c3aed', 5]].map(([c, n]) => (
          <div key={c as string} style={{ position: 'relative', width: 180, height: 120, borderRadius: 20, background: '#fff', boxShadow: 'var(--shadow-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--c-ink)' }}>
            ¡Genial!
            <Sparkles color={c as string} count={n as number} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'NodeIcon · disponible / hecho / bloqueado',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 88px)', gap: 14, padding: 12, background: '#ecfdf5', borderRadius: 12 }}>
        {KINDS.map((k) => <NodeIcon key={k} kind={k} size={88} color="var(--w1)" />)}
        {KINDS.map((k) => <NodeIcon key={`d${k}`} kind={k} size={88} color="var(--w1)" done />)}
        {KINDS.map((k) => <NodeIcon key={`l${k}`} kind={k} size={88} color="var(--w1)" locked />)}
      </div>
    ),
  },
  {
    title: 'NodeIcon · colores de los 8 mundos',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 64px)', gap: 10 }}>
        {WORLDS.map((c, i) => <NodeIcon key={c} kind={KINDS[i % 5]} size={64} color={c} done={i % 3 === 0} />)}
      </div>
    ),
  },
  {
    title: 'Iconos de la app (PNG + favicon)',
    render: () => (
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/icons/icon-512.png" width={160} height={160} alt="icono 512" style={{ borderRadius: 36 }} /><figcaption>512</figcaption></figure>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/icons/icon-512-maskable.png" width={160} height={160} alt="icono maskable" style={{ borderRadius: '50%' }} /><figcaption>maskable (círculo)</figcaption></figure>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/icons/apple-touch-icon.png" width={90} height={90} alt="apple touch" style={{ borderRadius: 20 }} /><figcaption>apple 180</figcaption></figure>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/icons/icon-192.png" width={64} height={64} alt="icono 192" style={{ borderRadius: 14 }} /><figcaption>192</figcaption></figure>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/favicon.svg" width={32} height={32} alt="favicon" /><figcaption>favicon 32</figcaption></figure>
        <figure style={{ margin: 0, textAlign: 'center' }}><img src="/favicon.svg" width={16} height={16} alt="favicon 16" /><figcaption>16</figcaption></figure>
      </div>
    ),
  },
]

export default entries
