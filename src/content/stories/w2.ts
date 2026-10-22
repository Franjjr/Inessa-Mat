/* World 2 — El Río de las Sumas. Guardian: la Rana Saltarina (frog). Predicament: bubble. Letter A. */
import { cast, narrate, say, scene, story } from './dsl'

export const w2Arrival = story('w2-arrival', 'El puente de piedras mágicas', [
  scene('river', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('Para cruzar el Río de las Sumas hay un puente de piedras mágicas.'),
    narrate('Cada piedra tiene un número. Pero la niebla de Borrón los ha desordenado todos.'),
    say('companion', '¡Yo salto primero! ¡Hop, hop, hop…!', 'cheer'),
    say('lumi', '¡{pet}, esa piedra no!', 'worried'),
  ]),
  scene('river', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'bubble')], [
    narrate('¡Plof! {pet} resbala y cae dentro de una burbuja gigante.', 'pop'),
    say('companion', '¡Estoy flotando! ¡El río me lleva! ¡Socorro!', 'scared'),
  ]),
  scene('river', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'bubble'), cast('frog', 'talk', 'right')], [
    say('frog', '¡Croac! Soy la Rana Saltarina, la guardiana del puente.', 'talk'),
    say('frog', 'Las piedras solo obedecen a quien sabe sumar números grandes.', 'think'),
    say('frog', 'Recuerda: cada número vive en su casa. Si te equivocas de casa… ¡plof!, al agua.', 'talk'),
    say('lumi', 'Son sumas de números grandes, {child}. Pero tenemos trucos para eso.', 'happy'),
    say('frog', 'Suma bien y te daré el cristal azul. La burbuja traerá a {pet} a la orilla.', 'happy'),
    say('companion', '¡Mientras, yo floto aquí sin prisa! ¡Qué vistas tan bonitas!', 'happy'),
  ]),
])

export const w2Mid = story('w2-mid', '¡Borrón quiere las mochilas!', [
  scene('river', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center', 'bubble'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¡Me llevo todas las llevadas! ¡Así nadie sabrá sumar!', 'happy'),
    say('lumi', 'La llevada es como una mochila. Y {child} nunca se olvida de su mochila.', 'happy'),
    narrate('{child} escribe la llevada pequeñita, arriba, en la casa de al lado. ¡Y no se escapa!'),
    say('borron', '¡Grrr! ¡Así no hay manera de liarla!', 'sad', 'whoosh'),
    say('companion', '¡La burbuja se acerca a la orilla! ¡Sigue así, {child}!', 'cheer'),
  ]),
])

export const w2Rescue = story('w2-rescue', '¡Pop! ¡Fuera burbuja!', [
  scene('river', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'bubble'), cast('frog', 'cheer', 'right')], [
    say('frog', '¡Croac, croac! ¡Has cruzado el río sin mojarte ni un pie!', 'cheer'),
    narrate('La burbuja llega flotando a la orilla y… ¡pop! {pet} sale de un salto.', 'pop'),
  ]),
  scene('river', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('frog', 'happy', 'right')], [
    say('companion', '¡Tierra firme! ¡Gracias, {child}! ¡Qué bien sumas!', 'cheer', 'rescue'),
    narrate('{pet} se sacude las gotas y moja a todo el mundo. ¡Ja, ja!'),
    say('frog', 'Aquí tienes el cristal azul. ¡Te lo has ganado, {child}!', 'happy', 'crystal'),
    say('lumi', '¡Ya brillan dos cristales en mi cuerno! La nueva letra secreta es la A.', 'cheer', 'sparkle'),
    say('companion', 'V… A… ¡Esto se pone interesante!', 'think'),
    say('frog', 'Al otro lado del río hay una cueva que brilla. ¡Id con cuidado!', 'talk'),
  ]),
])
