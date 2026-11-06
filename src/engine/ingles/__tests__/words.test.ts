import { ENGLISH_WORDS, type EnglishTheme } from '../words'

const PICTURE_THEMES: EnglishTheme[] = ['colores', 'animales', 'familia', 'comida', 'ropa', 'cole', 'casa', 'cuerpo', 'tiempo']
const ALL_THEMES: EnglishTheme[] = [...PICTURE_THEMES, 'saludos', 'dias']

describe('ENGLISH_WORDS', () => {
  it('has at least 8 words in every theme', () => {
    for (const theme of ALL_THEMES) {
      const count = ENGLISH_WORDS.filter((w) => w.theme === theme).length
      expect(count, theme).toBeGreaterThanOrEqual(8)
    }
  })
  it('has a unique English word within each theme', () => {
    const seen = new Set<string>()
    for (const w of ENGLISH_WORDS) {
      const key = `${w.theme}|${w.en.toLowerCase()}`
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })
  it('has an emoji on every word of the picture themes', () => {
    for (const w of ENGLISH_WORDS.filter((w) => PICTURE_THEMES.includes(w.theme))) {
      expect(w.emoji, w.en).toBeTruthy()
    }
  })
  it('covers the days of the week and the months in the dias theme', () => {
    const dias = ENGLISH_WORDS.filter((w) => w.theme === 'dias').map((w) => w.en)
    expect(dias).toEqual(expect.arrayContaining(['Monday', 'Sunday', 'January', 'December']))
  })
  it('has Spanish glosses and no empty English words', () => {
    for (const w of ENGLISH_WORDS) {
      expect(w.en.trim(), w.en).not.toBe('')
      expect(w.es.trim(), w.en).not.toBe('')
    }
  })
})
