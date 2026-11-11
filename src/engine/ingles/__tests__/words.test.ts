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

describe('each English word is in one theme, and the days of the week have a picture', () => {
  it('no word is listed twice in the vocabulary (orange and star were in two themes)', () => {
    const seen = new Map<string, string>()
    for (const w of ENGLISH_WORDS) {
      expect(seen.has(w.en), `${w.en} in ${seen.get(w.en)} and ${w.theme}`).toBe(false)
      seen.set(w.en, w.theme)
    }
  })

  it('every day of the week has its picture: 1 for Monday to 7 for Sunday', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    days.forEach((en, i) => {
      expect(ENGLISH_WORDS.find((x) => x.en === en)?.emoji, en).toBe(String(i + 1) + '\uFE0F\u20E3')
    })
  })
})
