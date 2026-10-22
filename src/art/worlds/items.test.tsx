import { render, screen } from '@testing-library/react'
import type { NodeKind } from '@/types'
import { ChestArt } from './ChestArt'
import { Crystal, type CrystalState } from './Crystal'
import { NodeIcon } from './NodeIcon'
import { Sparkles } from './Sparkles'
import { StarIcon } from './StarIcon'
import * as api from './index'

describe('public entry', () => {
  it('exports every contract component', () => {
    for (const name of ['Predicament', 'WorldBackground', 'Crystal', 'StarIcon', 'ChestArt', 'Sparkles', 'NodeIcon'] as const) {
      expect(typeof api[name]).toMatch(/function|object/)
    }
  })
})

describe('Crystal', () => {
  const states: CrystalState[] = ['locked', 'empty', 'glow', 'collected']
  for (const state of states) {
    it(`renders the ${state} state`, () => {
      const { container } = render(<Crystal color="var(--w3)" state={state} size={60} />)
      const svg = container.querySelector('svg')!
      expect(svg).toHaveAttribute('data-state', state)
      expect(svg).toHaveAttribute('width', '60')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg.querySelectorAll('polygon').length).toBeGreaterThan(0)
    })
  }

  it('uses defaults and exposes an accessible name when labelled', () => {
    render(<Crystal label="Cristal rojo" />)
    const img = screen.getByRole('img', { name: 'Cristal rojo' })
    expect(img).toHaveAttribute('data-state', 'empty')
    expect(img).toHaveAttribute('width', '48')
  })

  it('locked crystals show a padlock and ignore the world colour', () => {
    const { container } = render(<Crystal color="#ff0000" state="locked" />)
    expect(container.innerHTML).not.toContain('#ff0000')
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0)
  })

  it('accepts any CSS colour (color-mix fallback)', () => {
    const { container } = render(<Crystal color="teal" state="collected" />)
    expect(container.innerHTML).toContain('color-mix')
  })
})

describe('StarIcon', () => {
  it('renders empty and filled', () => {
    const { container, rerender } = render(<StarIcon />)
    expect(container.querySelector('svg')).toHaveAttribute('data-filled', 'false')
    expect(container.querySelector('svg')).toHaveAttribute('width', '32')
    rerender(<StarIcon filled size={44} />)
    expect(container.querySelector('svg')).toHaveAttribute('data-filled', 'true')
    expect(container.querySelector('svg')).toHaveAttribute('width', '44')
  })

  it('pops only when it becomes filled after mounting', () => {
    const { container, rerender } = render(<StarIcon filled />)
    expect(container.querySelectorAll('circle').length).toBe(0) // no pop rays on mount
    rerender(<StarIcon filled={false} />)
    rerender(<StarIcon filled />)
    expect(container.querySelectorAll('circle').length).toBe(5)
  })

  it('can be labelled', () => {
    render(<StarIcon filled label="Estrella conseguida" />)
    expect(screen.getByRole('img', { name: 'Estrella conseguida' })).toBeInTheDocument()
  })
})

describe('ChestArt', () => {
  it('renders closed with a lock and open with light rays', () => {
    const { container, rerender } = render(<ChestArt />)
    const svg = () => container.querySelector('svg')!
    expect(svg()).toHaveAttribute('data-open', 'false')
    expect(svg()).toHaveAttribute('width', '160')
    const closedPolys = svg().querySelectorAll('polygon').length
    rerender(<ChestArt open size={200} />)
    expect(svg()).toHaveAttribute('data-open', 'true')
    expect(svg().querySelectorAll('polygon').length).toBeGreaterThan(closedPolys + 6)
  })

  it('can be labelled', () => {
    render(<ChestArt open label="El Gran Cofre" />)
    expect(screen.getByRole('img', { name: 'El Gran Cofre' })).toBeInTheDocument()
  })
})

describe('Sparkles', () => {
  it('renders the requested number of decorative sparkles', () => {
    const { container } = render(<Sparkles count={12} color="#f472b6" />)
    const root = container.firstElementChild!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root.querySelectorAll('svg').length).toBe(12)
    expect(root.innerHTML).toMatch(/#f472b6|rgb\(244, 114, 182\)/)
  })

  it('defaults to 8, clamps the count and hides when inactive', () => {
    const { container, rerender } = render(<Sparkles />)
    expect(container.querySelectorAll('svg').length).toBe(8)
    rerender(<Sparkles count={500} />)
    expect(container.querySelectorAll('svg').length).toBe(40)
    rerender(<Sparkles count={0} />)
    expect(container.querySelectorAll('svg').length).toBe(1)
    rerender(<Sparkles active={false} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('NodeIcon', () => {
  const kinds: NodeKind[] = ['story', 'lesson', 'activity', 'guardian', 'review']
  for (const kind of kinds) {
    for (const [done, locked] of [[false, false], [true, false], [false, true]] as const) {
      it(`renders ${kind} (done=${done}, locked=${locked})`, () => {
        const { container } = render(<NodeIcon kind={kind} done={done} locked={locked} color="var(--w5)" size={72} />)
        const svg = container.querySelector('svg')!
        expect(svg).toHaveAttribute('data-kind', kind)
        expect(svg).toHaveAttribute('data-done', String(done))
        expect(svg).toHaveAttribute('data-locked', String(locked))
        expect(svg).toHaveAttribute('width', '72')
        expect(svg.querySelectorAll('path, polygon').length).toBeGreaterThan(1)
      })
    }
  }

  it('defaults to 56px, decorative, and can be labelled', () => {
    const { container } = render(<NodeIcon kind="story" />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '56')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    render(<NodeIcon kind="guardian" label="Guardián" />)
    expect(screen.getByRole('img', { name: 'Guardián' })).toBeInTheDocument()
  })
})
