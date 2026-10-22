import { render } from '@testing-library/react'
import { LumiHorn } from './LumiHorn'

describe('LumiHorn', () => {
  it('renders 8 sockets, none lit', () => {
    const { container, getByRole } = render(<LumiHorn crystals={Array(8).fill(false)} />)
    expect(container.querySelectorAll('[data-socket]')).toHaveLength(8)
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(0)
    expect(getByRole('img', { name: 'Cuerno de Lumi: 0 de 8 cristales' })).toBeInTheDocument()
  })

  it('lights collected sockets in the world colours', () => {
    const { container } = render(<LumiHorn crystals={[true, false, true, false, false, false, false, true]} size={80} />)
    const lit = [...container.querySelectorAll('[data-lit="true"]')].map((g) => g.getAttribute('data-socket'))
    expect(lit).toEqual(['1', '3', '8'])
    const gem = container.querySelector('[data-socket="3"] path') as SVGPathElement
    expect(gem.style.fill).toBe('var(--w3)')
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('height')).toBe('80')
    expect(svg.getAttribute('data-lit')).toBe('3')
    expect(svg.getAttribute('data-complete')).toBe('false')
  })

  it('shimmers when all 8 are lit', () => {
    const { container } = render(<LumiHorn crystals={Array(8).fill(true)} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-complete')).toBe('true')
    expect(svg.querySelector('clipPath')).toBeTruthy()
    expect(svg.querySelector('[clip-path]')).toBeTruthy()
  })

  it('tolerates short / long / missing arrays', () => {
    const short = render(<LumiHorn crystals={[true, true]} />)
    expect(short.container.querySelectorAll('[data-lit="true"]')).toHaveLength(2)
    const long = render(<LumiHorn crystals={Array(12).fill(true)} />)
    expect(long.container.querySelectorAll('[data-socket]')).toHaveLength(8)
    expect(long.container.querySelector('svg')!.getAttribute('data-complete')).toBe('true')
    const none = render(<LumiHorn crystals={undefined as unknown as boolean[]} />)
    expect(none.container.querySelectorAll('[data-lit="true"]')).toHaveLength(0)
  })

  it('has no shimmer band when static', () => {
    const { container } = render(<LumiHorn crystals={Array(8).fill(true)} animated={false} />)
    expect(container.querySelector('[clip-path]')).toBeNull()
  })

  it('updates when a crystal is collected', () => {
    const { container, rerender } = render(<LumiHorn crystals={[true, false, false, false, false, false, false, false]} />)
    rerender(<LumiHorn crystals={[true, true, false, false, false, false, false, false]} />)
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(2)
  })
})
