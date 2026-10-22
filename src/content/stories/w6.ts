/* World 6 — El Jardín del Arcoíris. Guardian: el Hada Iris (fairy). Predicament: fog. Letter N. */
import { cast, narrate, say, scene, story } from './dsl'

export const w6Arrival = story('w6-arrival', 'Un jardín sin colores', [
  scene('rainbow-garden', [cast('lumi', 'sad', 'left'), cast('companion', 'surprised', 'center')], [
    narrate('¡Qué tristeza! El Jardín del Arcoíris está completamente gris.'),
    narrate('La niebla de Borrón ha borrado sus siete colores.'),
    say('companion', '¡Hala, qué niebla tan espesa! ¡Voy a ver qué hay dentro!', 'cheer'),
    say('lumi', '¡{pet}, no entres en la niebla!', 'worried'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'worried', 'left'), cast('companion', 'sad', 'center', 'fog')], [
    narrate('Demasiado tarde. La niebla envuelve a {pet} y le roba todos sus colores.', 'whoosh'),
    say('companion', '¡Estoy gris! ¡Gris de la cabeza a los pies! ¡Qué aburrimiento!', 'sad'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'sad', 'center', 'fog'), cast('fairy', 'worried', 'right')], [
    say('fairy', 'Soy el Hada Iris. Un arcoíris tiene 7 colores y una semana tiene 7 días.', 'worried'),
    say('fairy', 'Necesito la tabla del 7 para volver a pintarlo todo.', 'sad'),
    narrate('—La tabla del 7 es la más difícil… —dice {child} en voz bajita.'),
    say('lumi', '¿{cg:Segura|Seguro|De verdad}? Mira bien… ¡ya te sabes casi toda!', 'happy'),
    say('fairy', 'Si pintas mi jardín con la tabla del 7, el cristal rosa será tuyo.', 'talk'),
    say('companion', '¡Y píntame a mí también, porfa! ¡Con muchos colores!', 'sad'),
  ]),
])

export const w6Mid = story('w6-mid', 'La rima del arcoíris', [
  scene('rainbow-garden', [cast('companion', 'sad', 'left', 'fog'), cast('fairy', 'happy', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Siete por siete? ¡Esa no se la sabe nadie!', 'happy'),
    say('fairy', '¡Claro que sí! Siete por siete, cuarenta y nueve…', 'happy'),
    narrate('—¡…y el arcoíris llueve! —termina {child}. ¡Y cae una lluvia de colores!', 'sparkle'),
    say('borron', 'Vaya… Todos se saben rimas menos yo.', 'sad', 'whoosh'),
    say('companion', '¡Mira! ¡La punta de mi nariz ya es de color rosa!', 'happy'),
  ]),
])

export const w6Rescue = story('w6-rescue', 'Siete colores', [
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'fog'), cast('fairy', 'cheer', 'right')], [
    say('fairy', '¡Mi jardín vuelve a tener colores! ¡Mira cuántas flores!', 'cheer'),
    narrate('Una lluvia de colores cae sobre {pet}: rojo, naranja, amarillo, verde, azul, añil y violeta.', 'rescue'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('fairy', 'happy', 'right')], [
    say('companion', '¡Vuelvo a tener mis colores! ¡Gracias, {child}! ¡Eres {cg:una artista|un artista|pura magia}!', 'cheer'),
    say('fairy', 'Para ti, el cristal rosa. ¡Que tu vida tenga siempre siete colores!', 'happy', 'crystal'),
    say('lumi', '¡Seis cristales! La letra del jardín es la N.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E, N… ¡Ya solo faltan dos letras!', 'think'),
  ]),
])
