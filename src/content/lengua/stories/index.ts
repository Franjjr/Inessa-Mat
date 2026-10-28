/* Lectura y literatura de Lengua de 3.º: the readings (ten stories, a fable, a poem, eight riddles and two tongue twisters). */
import type { ReadingDef } from '@/types'
import { fabulaCamaleon } from './fabula-camaleon'
import { poemaLluvia } from './poema-lluvia'
import { historiaTarta } from './historia-tarta'
import { historiaLoroAlReves } from './historia-loro-al-reves'
import { historiaPatoFlota } from './historia-pato-flota'
import { historiaBiblioteca } from './historia-biblioteca'
import { historiaCumpleLumi } from './historia-cumple-lumi'
import { historiaCaracolCartero } from './historia-caracol-cartero'
import { historiaMapa } from './historia-mapa'
import { historiaCabraLola } from './historia-cabra-lola'
import {
  adivinanzaBicicleta, adivinanzaCaracol, adivinanzaGlobo, adivinanzaHuevo, adivinanzaMesa, adivinanzaParaguas,
  adivinanzaReloj, adivinanzaTijeras, trabalenguasHuesos, trabalenguasPepe,
} from './adivinanzas'

/** The ten stories and poems (120 to 250 words each, with three to five questions). */
export const STORY_READINGS: ReadingDef[] = [
  fabulaCamaleon, poemaLluvia, historiaTarta, historiaLoroAlReves, historiaPatoFlota,
  historiaBiblioteca, historiaCumpleLumi, historiaCaracolCartero, historiaMapa, historiaCabraLola,
]

/** The ten short readings: eight riddles and two tongue twisters. */
export const SHORT_READINGS: ReadingDef[] = [
  adivinanzaMesa, adivinanzaParaguas, adivinanzaReloj, adivinanzaGlobo, adivinanzaTijeras,
  adivinanzaHuevo, adivinanzaCaracol, adivinanzaBicicleta, trabalenguasPepe, trabalenguasHuesos,
]

export const READINGS: ReadingDef[] = [...STORY_READINGS, ...SHORT_READINGS]

export const readingById = (id: string): ReadingDef | undefined => READINGS.find((r) => r.id === id)
