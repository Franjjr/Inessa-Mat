/* The Spanish syllabifier and the stressed syllable (Lengua de 3.º, gram:silabas and orto:tonica). Each word is split
   by hand: diphthongs, hiatus with a tilde, h between vowels, consonant clusters that go together (bl, br, cl, cr, dr, fl,
   fr, gl, gr, pl, pr, tl, tr), and ch, ll, rr, qu, gu, gü as single sounds. */
import { describe, expect, it } from 'vitest'
import { stressedSyllable, syllabify } from '../syllables'

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
