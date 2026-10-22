import { render } from '@testing-library/react'
import type { CharacterProps, Pose } from '@/types'
import { Character } from './Character'
import { CHARACTER_IDS } from './cast'
import { POSES } from './shared/pose'
import { LumiHorn } from './LumiHorn'

const IDS: CharacterProps['id'][] = ['lumi', 'borron', 'owl', 'frog', 'ladybug', 'polarbear', 'octopus', 'fairy', 'dragon', 'queen']

describe('Character', () => {
  it('covers every drawable character id', () => {
    expect([...CHARACTER_IDS].sort()).toEqual([...IDS].sort())
  })

  it.each(IDS.flatMap((id) => POSES.map((pose) => [id, pose] as const)))('renders %s in pose %s', (id, pose) => {
    const { container } = render(<Character id={id} pose={pose} size={120} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('data-character')).toBe(id)
    expect(svg.getAttribute('data-pose')).toBe(pose)
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 200')
    expect(svg.getAttribute('height')).toBe('120')
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBeTruthy()
    // real art, not an empty frame
    expect(svg.querySelectorAll('path, ellipse, circle').length).toBeGreaterThan(15)
  })

  it('uses Spanish accessible names', () => {
    const { getByRole, rerender } = render(<Character id="owl" />)
    expect(getByRole('img', { name: 'Búho Sabio' })).toBeInTheDocument()
    rerender(<Character id="borron" />)
    expect(getByRole('img', { name: 'Borrón' })).toBeInTheDocument()
  })

  it('defaults to idle, 160px, animated and not flipped', () => {
    const { container } = render(<Character id="lumi" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-pose')).toBe('idle')
    expect(svg.getAttribute('height')).toBe('160')
    expect(svg.getAttribute('data-animated')).toBe('true')
    expect(svg.getAttribute('data-flip')).toBe('false')
  })

  it('falls back to idle for an unknown pose and renders nothing for an unknown id', () => {
    const { container } = render(<Character id="frog" pose={'dancing' as Pose} />)
    expect(container.querySelector('svg')!.getAttribute('data-pose')).toBe('idle')
    const bad = render(<Character id={'unicorn-king' as CharacterProps['id']} />)
    expect(bad.container.querySelector('svg')).toBeNull()
  })

  it('mirrors the body when flipped but keeps decorations readable', () => {
    const { container } = render(<Character id="lumi" pose="sleep" flip />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-flip')).toBe('true')
    expect(svg.querySelector('g[transform="translate(200 0) scale(-1 1)"]')).toBeTruthy()
  })

  it('can be rendered static', () => {
    const { container } = render(<Character id="dragon" pose="cheer" animated={false} />)
    expect(container.querySelector('svg')!.getAttribute('data-animated')).toBe('false')
  })

  it('passes className through', () => {
    const { container } = render(<Character id="queen" className="hero" />)
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('hero')
  })

  it('gives each instance unique ids', () => {
    const { container } = render(
      <>
        <LumiHorn crystals={Array(8).fill(true)} />
        <LumiHorn crystals={Array(8).fill(true)} />
      </>,
    )
    const ids = [...container.querySelectorAll('clipPath')].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
