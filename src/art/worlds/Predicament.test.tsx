import { act, render, screen } from '@testing-library/react'
import type { PredicamentKind } from '@/types'
import { Predicament, RELEASE_MS } from './Predicament'

const KINDS: PredicamentKind[] = ['bubble', 'net', 'ice', 'fog', 'vines', 'cage', 'ink', 'stuck']

const Pet = () => <span data-testid="pet">🐱</span>

describe('Predicament', () => {
  afterEach(() => vi.useRealTimers())

  for (const kind of KINDS) {
    for (const rescue of [0, 0.5]) {
      it(`${kind} at rescue ${rescue} wraps the companion with overlay art`, () => {
        const { container } = render(<Predicament kind={kind} rescue={rescue}><Pet /></Predicament>)
        const root = container.firstElementChild as HTMLElement
        expect(root).toHaveAttribute('data-predicament', kind)
        expect(root).toHaveAttribute('data-phase', 'trapped')
        expect(root).toHaveAttribute('data-rescue', rescue.toFixed(2))
        expect(screen.getByTestId('pet')).toBeInTheDocument()
        const layers = root.querySelectorAll('svg[data-layer]')
        expect(layers.length).toBeGreaterThan(0)
        layers.forEach((l) => expect(l).toHaveAttribute('aria-hidden', 'true'))
        expect(root.querySelector('[data-part="burst"]')).toBeNull()
      })
    }

    it(`${kind} at rescue 1 plays the release, then shows only the freed companion`, () => {
      vi.useFakeTimers()
      const { container } = render(<Predicament kind={kind} rescue={1}><Pet /></Predicament>)
      const root = container.firstElementChild as HTMLElement
      expect(root).toHaveAttribute('data-phase', 'releasing')
      expect(root.querySelector('[data-part="burst"]')).toBeTruthy()
      act(() => { vi.advanceTimersByTime(RELEASE_MS + 50) })
      expect(root).toHaveAttribute('data-phase', 'free')
      expect(root.querySelectorAll('svg[data-layer]').length).toBe(0)
      expect(screen.getByTestId('pet')).toBeInTheDocument()
    })

    it(`${kind} releases when rescue climbs to 1 without remounting the companion`, () => {
      vi.useFakeTimers()
      const { container, rerender } = render(<Predicament kind={kind} rescue={0.25}><Pet /></Predicament>)
      const pet = screen.getByTestId('pet')
      rerender(<Predicament kind={kind} rescue={0.75}><Pet /></Predicament>)
      expect(container.firstElementChild).toHaveAttribute('data-phase', 'trapped')
      rerender(<Predicament kind={kind} rescue={1}><Pet /></Predicament>)
      expect(container.firstElementChild).toHaveAttribute('data-phase', 'releasing')
      act(() => { vi.advanceTimersByTime(RELEASE_MS + 50) })
      expect(container.firstElementChild).toHaveAttribute('data-phase', 'free')
      expect(screen.getByTestId('pet')).toBe(pet)
    })
  }

  it('none renders the companion with no overlay', () => {
    const { container } = render(<Predicament kind="none" rescue={0.3}><Pet /></Predicament>)
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'none')
    expect(container.querySelectorAll('svg').length).toBe(0)
    expect(screen.getByTestId('pet')).toBeInTheDocument()
  })

  it('goes back to trapped if rescue drops below 1 (retry)', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<Predicament kind="ice" rescue={1}><Pet /></Predicament>)
    act(() => { vi.advanceTimersByTime(RELEASE_MS + 50) })
    rerender(<Predicament kind="ice" rescue={0}><Pet /></Predicament>)
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'trapped')
  })

  it('clamps out-of-range and invalid rescue values', () => {
    const { container, rerender } = render(<Predicament kind="net" rescue={-2}><Pet /></Predicament>)
    expect(container.firstElementChild).toHaveAttribute('data-rescue', '0.00')
    rerender(<Predicament kind="net" rescue={Number.NaN}><Pet /></Predicament>)
    expect(container.firstElementChild).toHaveAttribute('data-rescue', '0.00')
  })

  it('progressively frees the companion: ice cracks show more as rescue grows', () => {
    const offsets = (r: number) => {
      const { container, unmount } = render(<Predicament kind="ice" rescue={r}><Pet /></Predicament>)
      const vals = Array.from(container.querySelectorAll('path[stroke-dashoffset]')).map((p) => Number(p.getAttribute('stroke-dashoffset')))
      unmount()
      return vals.reduce((a, b) => a + b, 0)
    }
    expect(offsets(0.6)).toBeLessThan(offsets(0.1))
  })
})
