import { render, screen } from '@testing-library/react'
import type { BackgroundId } from '@/types'
import { WorldBackground } from './WorldBackground'
import { SCENES } from './scenes'

const IDS: BackgroundId[] = ['home', 'sky', 'forest', 'river', 'cave', 'mountain', 'lake', 'rainbow-garden', 'volcano', 'castle']

function fills(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[fill]'))
    .map((el) => el.getAttribute('fill')!)
    .filter((f) => /^#[0-9a-f]{6}$/i.test(f))
}

describe('WorldBackground', () => {
  it('has a scene for every BackgroundId', () => {
    expect(Object.keys(SCENES).sort()).toEqual([...IDS].sort())
  })

  for (const id of IDS) {
    for (const v of [0, 0.5, 1]) {
      it(`renders ${id} at vividness ${v} with children on top`, () => {
        const { container } = render(
          <WorldBackground id={id} vividness={v} className="custom">
            <p>contenido</p>
          </WorldBackground>,
        )
        const root = container.firstElementChild as HTMLElement
        expect(root).toHaveAttribute('data-background', id)
        expect(root).toHaveAttribute('data-vividness', v.toFixed(2))
        expect(root).toHaveClass('custom')
        expect(screen.getByText('contenido')).toBeInTheDocument()
        // Children are direct children of the root (stub-compatible layout) and come after the scene.
        expect(screen.getByText('contenido').parentElement).toBe(root)
        // Layered SVG art exists and is hidden from assistive tech.
        const scene = root.querySelector('[aria-hidden="true"]') as HTMLElement
        expect(scene).toBeTruthy()
        expect(scene.querySelectorAll('svg').length).toBeGreaterThan(3)
        // Fog layer follows (1 - vividness).
        expect(root.querySelector('[data-fog]')).toHaveAttribute('data-fog', (1 - v).toFixed(2))
        expect(fills(root).length).toBeGreaterThan(20)
      })
    }
  }

  it('drains colour at vividness 0 (fills become near-grey)', () => {
    const vivid = render(<WorldBackground id="rainbow-garden" vividness={1} />)
    const vividFills = fills(vivid.container)
    vivid.unmount()
    const drained = render(<WorldBackground id="rainbow-garden" vividness={0} />)
    const drainedFills = fills(drained.container)
    const spread = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      return Math.max(...c) - Math.min(...c)
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(avg(drainedFills.map(spread))).toBeLessThan(16)
    expect(avg(vividFills.map(spread))).toBeGreaterThan(60)
  })

  it('clamps vividness and falls back to home for unknown ids', () => {
    const { container } = render(<WorldBackground id={'nowhere' as BackgroundId} vividness={7} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-background', 'home')
    expect(root).toHaveAttribute('data-vividness', '1.00')
  })

  it('defaults to full colour', () => {
    const { container } = render(<WorldBackground id="forest" />)
    expect(container.firstElementChild).toHaveAttribute('data-vividness', '1.00')
  })

  it('never duplicates gradient ids when several scenes share a page', () => {
    const { container } = render(
      <>
        <WorldBackground id="lake" vividness={0} />
        <WorldBackground id="lake" vividness={1} />
      </>,
    )
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id)
    expect(ids.length).toBeGreaterThan(4)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
