/* The Spanish syllabifier and the stressed syllable (Lengua de 3.º, gram:silabas and orto:tonica). Each word is split
   by hand: diphthongs, hiatus with a tilde, h between vowels, consonant clusters that go together (bl, br, cl, cr, dr, fl,
   fr, gl, gr, pl, pr, tl, tr), and ch, ll, rr, qu, gu, gü as single sounds. */
import { describe, expect, it } from 'vitest'
import { createRng } from '../../rng'
import { buildSyllables, hintsSyllables, SYLLABLE_WORDS, stressedSyllable, syllabify, wrongSplits } from '../syllables'
import type { LngStressExercise } from '@/types'

const SPLITS: [string, string][] = [
  ['casa', 'ca-sa'], ['mesa', 'me-sa'], ['perro', 'pe-rro'], ['pelota', 'pe-lo-ta'], ['mariposa', 'ma-ri-po-sa'],
  ['gato', 'ga-to'], ['elefante', 'e-le-fan-te'], ['jirafa', 'ji-ra-fa'], ['cocodrilo', 'co-co-dri-lo'],
  ['hormiga', 'hor-mi-ga'], ['cuento', 'cuen-to'], ['pingüino', 'pin-güi-no'], ['ciudad', 'ciu-dad'],
  ['perrito', 'pe-rri-to'], ['chocolate', 'cho-co-la-te'], ['llave', 'lla-ve'], ['bicicleta', 'bi-ci-cle-ta'],
  ['caballo', 'ca-ba-llo'], ['tortuga', 'tor-tu-ga'], ['estrella', 'es-tre-lla'], ['ventana', 'ven-ta-na'],
  ['cuchara', 'cu-cha-ra'], ['paraguas', 'pa-ra-guas'], ['lápiz', 'lá-piz'], ['árbol', 'ár-bol'], ['camión', 'ca-mión'],
  ['canción', 'can-ción'], ['leer', 'le-er'], ['día', 'dí-a'], ['reír', 're-ír'], ['baúl', 'ba-úl'], ['búho', 'bú-ho'],
  ['ahí', 'a-hí'], ['huevo', 'hue-vo'], ['murciélago', 'mur-cié-la-go'], ['teléfono', 'te-lé-fo-no'], ['reloj', 're-loj'],
  ['sol', 'sol'], ['mano', 'ma-no'], ['sombrero', 'som-bre-ro'], ['hombro', 'hom-bro'], ['conejo', 'co-ne-jo'],
  ['ardilla', 'ar-di-lla'], ['abeja', 'a-be-ja'], ['cangrejo', 'can-gre-jo'], ['pulpo', 'pul-po'], ['mochila', 'mo-chi-la'],
  ['zapato', 'za-pa-to'], ['tijera', 'ti-je-ra'], ['hospital', 'hos-pi-tal'], ['ventilador', 'ven-ti-la-dor'],
  ['biblioteca', 'bi-blio-te-ca'], ['ojo', 'o-jo'], ['aire', 'ai-re'], ['ruido', 'rui-do'], ['vacaciones', 'va-ca-cio-nes'],
  ['guitarra', 'gui-ta-rra'], ['queso', 'que-so'], ['cuaderno', 'cua-der-no'], ['vergüenza', 'ver-güen-za'],
  ['bueno', 'bue-no'], ['tiempo', 'tiem-po'], ['hierba', 'hier-ba'], ['hueso', 'hue-so'], ['escuela', 'es-cue-la'],
  ['estudio', 'es-tu-dio'], ['nube', 'nu-be'], ['viaje', 'via-je'], ['jaula', 'jau-la'], ['oído', 'o-í-do'],
  ['leído', 'le-í-do'], ['Paraguay', 'pa-ra-guay'], ['buey', 'buey'], ['hoy', 'hoy'], ['prohibir', 'prohi-bir'],
  ['ahora', 'a-ho-ra'], ['cigüeña', 'ci-güe-ña'], ['bailar', 'bai-lar'], ['reina', 'rei-na'],
]

describe('syllabify: the split of each word', () => {
  it.each(SPLITS)('%s → %s', (word, split) => {
    expect(syllabify(word).join('-')).toBe(split.toLowerCase())
  })

  it('has at least 60 checked words', () => {
    expect(SPLITS.length).toBeGreaterThanOrEqual(60)
  })

  it('the syllables always join back into the word', () => {
    for (const [word] of SPLITS) expect(syllabify(word).join(''), word).toBe(word.toLowerCase())
  })
})

describe('stressedSyllable: the index of the stressed syllable', () => {
  it.each([
    ['mariposa', 2], // llana, acaba en vocal: penúltima
    ['lápiz', 0], // llana con tilde
    ['reloj', 1], // aguda, acaba en consonante distinta de n o s
    ['camión', 1], // aguda con tilde
    ['murciélago', 1], // esdrújula: la tilde marca la sílaba fuerte
    ['paraguas', 1], // llana, acaba en s
    ['Paraguay', 2], // aguda: acaba en y
    ['teléfono', 1],
    ['árbol', 0],
    ['sol', 0],
    ['perro', 0],
    ['ciudad', 1],
    ['día', 0], // hiato con tilde: dí-a
  ])('%s → sílaba %i', (word, index) => {
    expect(stressedSyllable(word)).toBe(index)
  })
})

describe('the stress hints: the level 3 rule is right for esdrújulas (the tilde marks the stress, antepenultimate)', () => {
  const stressOf = (word: string): LngStressExercise => ({
    id: `lng-stress:${word}`, kind: 'lng-stress', skill: 'lng:orto:tonica', difficulty: 2,
    word, syllables: syllabify(word), stressed: stressedSyllable(word),
  })

  it.each(['murciélago', 'teléfono'])('%s: the tilde is the stressed syllable, and the rule says so', (word) => {
    const ex = stressOf(word)
    expect(ex.syllables.length).toBe(4)
    expect(ex.stressed).toBe(1)
    const worked = hintsSyllables(ex)[2].text
    expect(worked).toMatch(/tilde/)
    expect(worked).toMatch(/antes del último/)
  })

  it('a word without a tilde that ends in a vowel is stressed on the penultimate, as the rule says', () => {
    const ex = stressOf('mariposa')
    expect(ex.syllables[ex.stressed]).toBe('po')
    expect(hintsSyllables(ex)[2].text).toMatch(/antes del último/)
  })
})

describe('split exercises: three options, the right cut once, wrong cuts never empty or repeated', () => {
  it('every word of the bank gets the right cut and two different wrong cuts', () => {
    for (const word of SYLLABLE_WORDS) {
      const ex = buildSyllables('lng:gram:silabas', createRng(word.length), 'split')
      const parts = syllabify(word)
      const wrong = wrongSplits(parts, createRng(7))
      if (word.length >= 4) expect(wrong.length, word).toBeGreaterThanOrEqual(2)
      expect(new Set(wrong).size, word).toBe(wrong.length)
      for (const w of wrong) {
        expect(w.split('-').every((p) => p.length > 0), `${word} ${w}`).toBe(true)
        expect(w.replace(/-/g, ''), word).toBe(parts.join(''))
        expect(w, word).not.toBe(parts.join('-'))
      }
      if (ex.word === word) {
        expect(ex.options.length, word).toBe(3)
        expect(new Set(ex.options).size, word).toBe(3)
        expect(ex.options, word).toContain(parts.join('-'))
      }
    }
  })

  it('a word with two syllables (casa) gets its two near wrong cuts, c-asa and cas-a', () => {
    expect(wrongSplits(['ca', 'sa'], createRng(3)).sort()).toEqual(['c-asa', 'cas-a'])
  })
})
