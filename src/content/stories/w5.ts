/* World 5 — El Lago del Ocho. Guardian: el pulpo Octavio (octopus). Predicament: ink. Letter E. */
import { cast, narrate, say, scene, story } from './dsl'

export const w5Arrival = story('w5-arrival', '¡Achís de tinta!', [
  scene('lake', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('octopus', 'happy', 'right')], [
    narrate('En el Lago Turquesa vive Octavio, un pulpo bromista con 8 tentáculos.'),
    narrate('Con cada tentáculo sujeta una cosa: una concha, una perla, un pincel… ¡y hasta una tetera!'),
    say('companion', '¡Qué pulpo tan gracioso! ¡Voy a decirle hola de cerca!', 'cheer'),
    say('octopus', '¡Hola! Ay… ay… ¡AAACHÍS!', 'surprised'),
  ]),
  scene('lake', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'ink'), cast('octopus', 'worried', 'right')], [
    narrate('¡Splash! {pet} se queda {pg:cubierta|cubierto|cubierto} de tinta morada de la cabeza a los pies.', 'pop'),
    say('companion', '¡No veo nada! ¿Dónde está el lago? ¿Dónde estoy yo?', 'scared'),
  ]),
  scene('lake', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'ink'), cast('octopus', 'sad', 'right')], [
    say('octopus', '¡Perdón, perdón! Es que Borrón me ha dejado sin la tabla del 8.', 'sad'),
    say('octopus', 'Mañana hay una carrera de pulpos y no sé cuántos tentáculos habrá en la salida.', 'worried'),
    say('lumi', 'La tabla del 8 tiene el truco más divertido de todos: doble, doble y doble.', 'happy'),
    say('octopus', 'Si me ayudas, {child}, limpiaré a {pet} con agua del lago.', 'talk'),
    say('octopus', '¡Y el cristal violeta será tuyo!', 'happy'),
    say('companion', '¡Sí, por favor! ¡Ahora mismo parezco una mora gigante!', 'worried'),
  ]),
])

export const w5Mid = story('w5-mid', 'Los dorsales de la carrera', [
  scene('lake', [cast('companion', 'worried', 'left', 'ink'), cast('octopus', 'worried', 'center'), cast('borron', 'happy', 'right')], [
    say('octopus', '¡Glu, glu! ¡Borrón ha mezclado los números de la carrera!', 'worried'),
    say('borron', '¡Ji, ji! ¡Nadie sabrá cuánto es ocho por siete!', 'happy'),
    narrate('{child} dobla tres veces: 7, 14, 28… ¡56! Ocho por siete, cincuenta y seis.'),
    say('borron', '¿Doblar tres veces? ¡Qué truco tan raro… y tan bueno!', 'surprised', 'whoosh'),
    say('companion', '¡Ya te veo un poco, {child}! Bueno… veo una mancha con tu forma.', 'happy'),
  ]),
])

export const w5Rescue = story('w5-rescue', 'Ocho chorritos de agua', [
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ink'), cast('octopus', 'cheer', 'right')], [
    say('octopus', '¡Glu, glu, hurra! ¡La tabla del 8 ha vuelto a mis tentáculos!', 'cheer'),
    narrate('Octavio lava a {pet} con ocho chorritos de agua del lago. ¡Fiu, fiu!', 'rescue'),
  ]),
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('octopus', 'happy', 'right')], [
    say('companion', '¡Vuelvo a ver! ¡Y lo primero que veo eres tú! ¡Gracias, {child}!', 'cheer'),
    say('octopus', 'Toma el cristal violeta, {child}. ¡Y ocho abrazos de pulpo!', 'happy', 'crystal'),
    say('lumi', '¡Cinco cristales! La letra del lago es la E.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E… ¡Ya casi la tengo!', 'think'),
  ]),
])
