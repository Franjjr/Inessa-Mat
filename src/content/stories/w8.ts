/* World 8 — El Castillo del Reparto. Guardian: la Reina Aurora (queen). Predicament: net. Letter E. */
import { cast, narrate, say, scene, story } from './dsl'

export const w8Arrival = story('w8-arrival', 'La red de Borrón', [
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'happy', 'center'), cast('queen', 'happy', 'right')], [
    narrate('¡Por fin, el Castillo de Numeria! La Reina Aurora espera en la torre más alta.'),
    say('queen', '¡Hola, {child}! Te estaba esperando. Mira cuántos tesoros: gemas, monedas y estrellas.', 'happy'),
    say('queen', 'Quiero repartirlos entre todo el reino. Pero a todos lo mismo, para que nadie se enfade.', 'talk'),
    say('queen', 'Y Borrón me ha borrado las divisiones…', 'sad'),
  ]),
  scene('castle', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'net'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji, ji! ¡Si consigues el último cristal, mi niebla desaparecerá!', 'happy'),
    narrate('¡Zas! Borrón lanza una red y atrapa a {pet}.', 'whoosh'),
    say('companion', '¡Eh! ¡Suéltame, nubecilla gruñona!', 'scared'),
    say('borron', '¡Así no terminarás nunca la aventura! ¡Ji, ji!', 'happy', 'whoosh'),
  ]),
  scene('castle', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'net'), cast('queen', 'talk', 'right')], [
    say('lumi', '{child}, este es el último cristal. Dividir es repartir en partes iguales.', 'talk'),
    say('lumi', '¡Y es la multiplicación al revés! Todo lo que has aprendido te va a ayudar.', 'happy'),
    say('queen', 'Reparte con justicia y el cristal dorado será tuyo.', 'happy'),
    say('companion', '¡Tú puedes, {child}! ¡Yo, mientras, me columpio en la red! ¡Uiii!', 'happy'),
  ]),
])

export const w8Mid = story('w8-mid', 'Borrón mira desde la torre', [
  scene('castle', [cast('companion', 'worried', 'left', 'net'), cast('lumi', 'idle', 'center'), cast('borron', 'think', 'right')], [
    narrate('Desde lo alto de una torre, Borrón mira cómo {child} reparte las gemas.'),
    say('borron', 'Doce gemas entre tres cofres… ¿cuatro para cada uno? ¿Cómo lo hace?', 'think'),
    say('lumi', 'Piensa en la tabla: ¿tres por cuánto da doce? ¡Por cuatro!', 'talk'),
    say('borron', 'Hum… Eso casi lo he entendido. ¡Pero no se lo digáis a nadie!', 'surprised', 'whoosh'),
    say('companion', '¡La red se está aflojando! ¡Sigue repartiendo, {child}!', 'happy'),
  ]),
])

export const w8Rescue = story('w8-rescue', 'El último cristal', [
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'net'), cast('queen', 'cheer', 'right')], [
    say('queen', '¡Todo repartido con justicia! ¡Veintiuna estrellas en cada torre!', 'cheer'),
    narrate('La red se deshace en mil estrellitas, y {pet} salta a los brazos de {child}.', 'rescue'),
  ]),
  scene('castle', [cast('lumi', 'surprised', 'left'), cast('companion', 'cheer', 'center'), cast('queen', 'happy', 'right')], [
    say('companion', '¡Gracias, {child}! ¡Me has rescatado ocho veces! ¡Eres {cg:mi heroína|mi héroe|lo más}!', 'cheer'),
    say('queen', 'Toma el cristal dorado, {child}. Es el último.', 'happy', 'crystal'),
    say('lumi', '¡La letra del castillo es la E! ¡Ya tenemos las ocho letras!', 'surprised', 'sparkle'),
    say('companion', '¡Rápido, Lumi! ¡Vamos a poner los cristales en tu cuerno!', 'cheer'),
  ]),
])
