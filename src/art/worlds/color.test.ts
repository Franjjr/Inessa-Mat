import { derive, fogTint, hexToRgb, light, makeTint, mix, resolveHex, rgbToHex, shade } from './color'

describe('color helpers', () => {
  it('parses and formats hex colours', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
    expect(hexToRgb('#abc')).toEqual([170, 187, 204])
    expect(hexToRgb('nope')).toBeNull()
    expect(rgbToHex([255, 128, 0])).toBe('#ff8000')
    expect(rgbToHex([300, -4, 12.6])).toBe('#ff000d')
  })

  it('mixes linearly and leaves non-hex input untouched', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#123456', '#ffffff', 0)).toBe('#123456')
    expect(mix('var(--x)', '#ffffff', 0.5)).toBe('var(--x)')
  })

  it('shade darkens and light lightens', () => {
    const base = hexToRgb('#86efac')!
    const dark = hexToRgb(shade('#86efac'))!
    const lite = hexToRgb(light('#86efac', 0.5))!
    const sum = (c: number[]) => c[0] + c[1] + c[2]
    expect(sum(dark)).toBeLessThan(sum(base))
    expect(sum(lite)).toBeGreaterThan(sum(base))
  })

  it('fogTint keeps colours at vividness 1 and drains them to a cool grey at 0', () => {
    expect(fogTint('#e11d48', 1)).toBe('#e11d48')
    const [r, g, b] = hexToRgb(fogTint('#e11d48', 0))!
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(16)
    expect(b).toBeGreaterThanOrEqual(r) // cool cast
    const half = hexToRgb(fogTint('#e11d48', 0.5))!
    expect(half[0]).toBeGreaterThan(r)
    expect(half[0]).toBeLessThan(0xe1)
  })

  it('makeTint is memoised per (quantised) vividness and identity at 1', () => {
    expect(makeTint(1)('#123456')).toBe('#123456')
    expect(makeTint(0.501)).toBe(makeTint(0.5))
    expect(makeTint(-3)).toBe(makeTint(0))
    expect(makeTint(0)('#ff0000')).toBe(fogTint('#ff0000', 0))
  })

  it('resolves design-token variables used as world colours', () => {
    expect(resolveHex('var(--w1)')).toBe('#15803d')
    expect(resolveHex('var( --w8 )')).toBe('#a16207')
    expect(resolveHex('var(--unknown, #ABCDEF)')).toBe('#abcdef')
    expect(resolveHex('#FFF')).toBe('#ffffff')
    expect(resolveHex('rebeccapurple')).toBeNull()
    expect(resolveHex(undefined)).toBeNull()
  })

  it('derive gives hex facets for known colours and color-mix() for others', () => {
    const d = derive('var(--w2)')
    expect(d.base).toBe('#2563eb')
    for (const v of [d.pale, d.soft, d.dark, d.deep]) expect(v).toMatch(/^#[0-9a-f]{6}$/)
    const css = derive('teal')
    expect(css.base).toBe('teal')
    expect(css.soft).toContain('color-mix(')
  })
})
