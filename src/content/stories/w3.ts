/* World 3 — La Cueva del Seis. Guardian: la Reina Mariquita (ladybug). Predicament: stuck. Letter L. */
import { cast, narrate, say, scene, story } from './dsl'

export const w3Arrival = story('w3-arrival', 'Las mariquitas luminosas', [
  scene('cave', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center')], [
    narrate('Dentro de la Cueva de Cristal viven las mariquitas luminosas.'),
    narrate('Brillan en la oscuridad como farolillos. Cada mariquita tiene 6 patas… ¡y les encanta bailar!'),
    say('companion', '¡Una mariquita que brilla! ¡Espera, bonita, quiero verte de cerca!', 'cheer'),
  ]),
  scene('cave', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'stuck')], [
    narrate('La mariquita se mete en un túnel diminuto. {pet} la sigue y… ¡crac!', 'pop'),
    say('companion', '¡Me he quedado {pg:atascada|atascado|atascado}! ¡Solo me asoma la colita!', 'scared'),
  ]),
  scene('cave', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'stuck'), cast('ladybug', 'talk', 'right')], [
    say('ladybug', '¡{cg:Bienvenida|Bienvenido|Te doy la bienvenida}, {child}! Soy la Reina Mariquita.', 'happy'),
    say('ladybug', 'Esta noche es la Gran Fiesta del Baile. ¡Pero Borrón nos ha borrado la tabla del 6!', 'worried'),
    say('ladybug', 'Y sin la tabla del 6 no sabemos cuántas patas habrá en la pista.', 'sad'),
    narrate('A {child} la tabla del 6 le parece difícil. Pero Lumi le guiña un ojo.'),
    say('lumi', 'Tranquilidad. Tengo dos trucos secretos para ti.', 'happy'),
    say('ladybug', 'Si conquistas la tabla del 6, mis mariquitas abrirán el túnel para {pet}.', 'talk'),
    say('companion', '¡Daos prisa, que me pica la nariz y no me la puedo rascar!', 'worried'),
  ]),
])

export const w3Mid = story('w3-mid', '¡Se apagan las luces!', [
  scene('cave', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'stuck'), cast('borron', 'happy', 'right')], [
    narrate('De repente, la cueva se queda a oscuras.', 'whoosh'),
    say('borron', '¡Ji, ji! ¡He apagado las mariquitas! ¡A ver cómo bailáis ahora!', 'happy'),
    say('lumi', 'Cada resultado de la tabla del 6 enciende una mariquita. ¡Vamos, {child}!', 'talk'),
    narrate('—Seis por siete, cuarenta y dos —dice {child}. ¡Y la cueva vuelve a brillar!', 'sparkle'),
    say('borron', '¿Otra vez? ¡{cg:Esta niña|Este niño|Aquí alguien} sabe demasiado!', 'surprised', 'whoosh'),
    say('companion', '¡El túnel se ensancha! ¡Ya puedo mover una pata!', 'happy'),
  ]),
])

export const w3Rescue = story('w3-rescue', '¡Fiesta en la cueva!', [
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'stuck'), cast('ladybug', 'cheer', 'right')], [
    say('ladybug', '¡La tabla del 6 vuelve a brillar! ¡Que empiece la fiesta!', 'cheer'),
    narrate('Las mariquitas empujan con sus seis patitas… ¡y {pet} sale del túnel! ¡Plop!', 'rescue'),
  ]),
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('ladybug', 'happy', 'right')], [
    say('companion', '¡Por fin! ¡Gracias, {child}! ¡Vamos a bailar!', 'cheer'),
    narrate('{pet} baila con las mariquitas. ¡Y pisa más patas que nadie! ¡Ja, ja!'),
    say('ladybug', 'Toma el cristal rojo, {child}. Brilla tanto como tú.', 'happy', 'crystal'),
    say('lumi', '¡Tres cristales! Y la letra secreta de la cueva es la L.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L… ¿Será «VALE»? ¡No, que todavía faltan cristales!', 'think'),
  ]),
])
