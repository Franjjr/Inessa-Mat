import { brandPalette, crystalPalette, goldPalette, lighten, mix, rainbowPalette, resolveColor } from './palettes'

describe('resolveColor', () => {
  it('normalises hex and rgb()', () => {
    expect(resolveColor('#ABC')).toBe('#aabbcc')
    expect(resolveColor('#7c3aed')).toBe('#7c3aed')
    expect(resolveColor('#7c3aedcc')).toBe('#7c3aed')
    expect(resolveColor('rgb(255, 0, 10)')).toBe('#ff000a')
    expect(resolveColor('rgba(0 128 255 / .5)')).toBe('#0080ff')
  })

  it('resolves design tokens, with fallbacks', () => {
    document.documentElement.style.setProperty('--test-c', '#0a0b0c')
    expect(resolveColor('var(--test-c)')).toBe('#0a0b0c')
    expect(resolveColor('--test-c')).toBe('#0a0b0c')
    document.documentElement.style.removeProperty('--test-c')
    expect(resolveColor('var(--nope, #00ff00)')).toBe('#00ff00')
    expect(resolveColor('var(--w1)')).toBe('#15803d')
    expect(resolveColor('')).toBeNull()
  })
})

describe('palettes', () => {
  it('mixes colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(lighten('#000000', 1)).toBe('#ffffff')
  })

  it('are all hex and non-empty', () => {
    for (const p of [brandPalette(), rainbowPalette(), goldPalette(), crystalPalette(['var(--w3)'])]) {
      expect(p.length).toBeGreaterThan(3)
      for (const c of p) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(rainbowPalette()).toHaveLength(7)
  })
})
