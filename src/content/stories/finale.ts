/* Finale — after the 8th crystal: the horn lights up, the fog disappears, Borrón confesses, the child teaches him a
   trick (teach-back), says the secret word VALIENTE, the Gran Cofre opens, the diploma, and the season-2 teaser. */
import { cast, narrate, say, scene, story } from './dsl'

export const finale = story('finale', '¡La luz vuelve a Numeria!', [
  scene('castle', [cast('companion', 'happy', 'left'), cast('lumi', 'happy', 'center'), cast('queen', 'happy', 'right')], [
    narrate('{child} coloca los ocho cristales en el cuerno de Lumi, uno a uno.', 'crystal'),
    narrate('Verde, azul, rojo, celeste, violeta, rosa, naranja… y dorado.'),
    narrate('¡FLASH! Una luz de mil colores llena todo el reino.', 'fanfare'),
    say('lumi', '¡Mi cuerno brilla otra vez! ¡La Niebla del Olvido se ha ido!', 'cheer'),
    say('companion', '¡Mira, {child}! ¡Los números vuelven a brillar por todas partes!', 'cheer'),
  ]),
  scene('castle', [cast('companion', 'surprised', 'left'), cast('lumi', 'idle', 'center'), cast('borron', 'sad', 'right')], [
    narrate('Detrás de una roca asoma una nubecita gris con los ojos llorosos. Es Borrón.'),
    say('borron', 'Yo… borré los números porque nunca los entendí.', 'sad'),
    say('borron', 'Todos los sabían menos yo. Me sentía muy solo.', 'sad'),
    narrate('{child} se acuerda de lo difícil que le parecía la tabla del 7 al principio.'),
    narrate('—¿Quieres que te enseñe un truco? —dice {child}, y se sienta a su lado.'),
    say('borron', '¿A mí? ¿De verdad? ¿Aunque yo borrara los números?', 'surprised'),
  ]),
  scene('castle', [cast('companion', 'happy', 'left'), cast('lumi', 'happy', 'center'), cast('borron', 'think', 'right')], [
    narrate('—Mira: cinco, seis, siete, ocho. ¡Cincuenta y seis es siete por ocho! —explica {child}.'),
    say('borron', 'Cinco, seis, siete, ocho… ¡56 = 7 × 8! ¡Qué fácil!', 'think'),
    narrate('—Y si se te olvida, haces doble, doble y doble —añade {child}.'),
    say('borron', '¡Lo he entendido! ¡Los números no muerden!', 'cheer', 'sparkle'),
    say('lumi', 'Explicar es la mejor forma de aprender. ¡Lo has hecho genial, {child}!', 'happy'),
    say('companion', '¡Bienvenido al equipo, Borrón! ¿Me das un abrazo de nube?', 'cheer'),
  ]),
  scene('castle', [cast('companion', 'happy', 'left'), cast('lumi', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('lumi', 'Ahora, {child}, di la palabra secreta. Es lo que has sido en toda la aventura.', 'talk'),
    narrate('V, A, L, I, E, N, T, E…'),
    narrate('—¡VALIENTE! —dice {child} en voz alta.', 'fanfare'),
    narrate('¡Clac! El Gran Cofre de Numeria se abre despacito…', 'chest-open'),
    say('lumi', 'Dentro hay una sorpresa solo para ti… ¡y tu diploma de magia!', 'happy'),
    say('companion', '¡Lo hemos conseguido, {child}! ¡Tú y yo! ¡Eres {cg:la mejor amiga|el mejor amigo} del mundo!', 'cheer'),
  ]),
  scene('sky', [cast('companion', 'surprised', 'left'), cast('lumi', 'think', 'center')], [
    say('lumi', 'Por cierto… ¿veis esas islas a lo lejos, entre las nubes?', 'think'),
    say('lumi', 'Son las Islas de las Fracciones. Pero esa… es otra aventura.', 'talk'),
    narrate('Próximamente: Las Islas de las Fracciones.', 'sparkle'),
    say('companion', '¡Yo salto primero!', 'cheer'),
  ]),
])
