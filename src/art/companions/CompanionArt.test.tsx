import { render } from '@testing-library/react'
import { COMPANION_SPECIES, type CompanionSpecies, type Pose } from '@/types'
import { POSES } from '../characters/shared/pose'
import { ACCESSORY_IDS, accessorySlot, resolveEquipped } from './accessories'
import { CompanionArt } from './CompanionArt'
import { SPECIES } from './species'
import { COLORWAYS, normalizeColorway } from './types'

describe('CompanionArt', () => {
  it('has exactly the 4 colourways for every species', () => {
    expect(COLORWAYS).toEqual(['default', 'sunny', 'berry', 'mint'])
    for (const sp of COMPANION_SPECIES) expect(Object.keys(SPECIES[sp].palettes).sort()).toEqual([...COLORWAYS].sort())
  })

  const combos = COMPANION_SPECIES.flatMap((sp) => COLORWAYS.flatMap((cw) => POSES.map((p) => [sp, cw, p] as const)))
  it.each(combos)('renders %s / %s / %s', (species, colorway, pose) => {
    const { container } = render(<CompanionArt species={species} colorway={colorway} pose={pose} size={96} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-species')).toBe(species)
    expect(svg.getAttribute('data-colorway')).toBe(colorway)
    expect(svg.getAttribute('data-pose')).toBe(pose)
    expect(svg.getAttribute('height')).toBe('96')
    expect(svg.querySelectorAll('path, ellipse, circle').length).toBeGreaterThan(12)
  })

  it('colourways actually change the palette', () => {
    const fur = (cw: string) => {
      const { container, unmount } = render(<CompanionArt species="cat" colorway={cw} />)
      const html = container.innerHTML
      unmount()
      return html
    }
    expect(fur('default')).not.toBe(fur('mint'))
    expect(fur('sunny')).not.toBe(fur('berry'))
  })

  it('falls back to default for unknown colourways and maps friendly aliases', () => {
    expect(normalizeColorway('rainbow')).toBe('default')
    expect(normalizeColorway(undefined)).toBe('default')
    expect(normalizeColorway('pink')).toBe('berry')
    expect(normalizeColorway('gold')).toBe('sunny')
    expect(normalizeColorway('blue')).toBe('mint')
    const { container } = render(<CompanionArt species="fox" colorway="plaid" />)
    expect(container.querySelector('svg')!.getAttribute('data-colorway')).toBe('default')
  })

  it('has the 18 accessory ids exactly', () => {
    expect([...ACCESSORY_IDS]).toEqual([
      'crown', 'wizard-hat', 'flower-crown', 'cap', 'bow', 'beanie', 'star-glasses', 'sunglasses', 'scarf', 'bowtie',
      'medal', 'cape', 'fairy-wings', 'backpack', 'wand', 'balloon', 'lollipop', 'paintbrush',
    ])
  })

  it.each(COMPANION_SPECIES.flatMap((sp) => ACCESSORY_IDS.map((id) => [sp, id] as const)))('draws %s wearing %s', (species, id) => {
    const { container } = render(<CompanionArt species={species} equipped={[id]} />)
    const node = container.querySelector(`[data-accessory="${id}"]`)
    expect(node).toBeTruthy()
    expect(node!.getAttribute('data-slot')).toBe(accessorySlot(id))
    expect(container.querySelector('svg')!.getAttribute('data-equipped')).toBe(id)
  })

  it('renders back items behind the body and held items in the paw', () => {
    const { container } = render(<CompanionArt species="panda" equipped={['cape', 'wand', 'crown', 'scarf']} />)
    const all = [...container.querySelectorAll('*')]
    const cape = all.indexOf(container.querySelector('[data-accessory="cape"][data-slot="back"]')!)
    const firstEllipse = all.findIndex((n) => n.tagName.toLowerCase() === 'ellipse')
    expect(cape).toBeGreaterThan(-1)
    expect(cape).toBeLessThan(firstEllipse)
    expect(container.querySelector('[data-accessory="wand"][data-slot="held"]')).toBeTruthy()
    expect(container.querySelector('[data-accessory="crown"]')).toBeTruthy()
    expect(container.querySelector('[data-accessory="scarf"]')).toBeTruthy()
  })

  it('ignores unknown accessory ids and keeps one item per slot', () => {
    const { container } = render(<CompanionArt species="dog" equipped={['jetpack', 'crown', 'beanie', 42 as unknown as string]} />)
    expect(container.querySelector('[data-accessory="jetpack"]')).toBeNull()
    expect(container.querySelector('[data-accessory="crown"]')).toBeNull()
    expect(container.querySelector('[data-accessory="beanie"]')).toBeTruthy()
    expect(resolveEquipped(['star-glasses', 'sunglasses', 'medal'])).toEqual({ face: 'sunglasses', neck: 'medal' })
    expect(resolveEquipped(undefined)).toEqual({})
  })

  it('wears accessories in every pose', () => {
    for (const pose of POSES) {
      const { container, unmount } = render(<CompanionArt species="bunny" pose={pose} equipped={['wizard-hat', 'backpack', 'balloon', 'sunglasses', 'bowtie']} />)
      expect(container.querySelectorAll('[data-accessory]').length).toBeGreaterThanOrEqual(5)
      unmount()
    }
  })

  it('supports flip and static rendering', () => {
    const { container } = render(<CompanionArt species="penguin" flip animated={false} pose="talk" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-flip')).toBe('true')
    expect(svg.getAttribute('data-animated')).toBe('false')
    expect(svg.querySelector('g[transform="translate(200 0) scale(-1 1)"]')).toBeTruthy()
  })

  it('ignores unknown species and poses gracefully', () => {
    const bad = render(<CompanionArt species={'axolotl' as CompanionSpecies} />)
    expect(bad.container.querySelector('svg')).toBeNull()
    const { container } = render(<CompanionArt species="unicorn" pose={'moonwalk' as Pose} />)
    expect(container.querySelector('svg')!.getAttribute('data-pose')).toBe('idle')
  })

  it('names the companion in Spanish', () => {
    const { getByRole } = render(<CompanionArt species="unicorn" />)
    expect(getByRole('img', { name: 'Unicornio bebé' })).toBeInTheDocument()
  })
})
