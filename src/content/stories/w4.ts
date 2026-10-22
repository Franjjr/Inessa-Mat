/* World 4 — La Montaña de las Restas. Guardian: la osa Nieve (polar bear). Predicament: ice. Letter I. */
import { cast, narrate, say, scene, story } from './dsl'

export const w4Arrival = story('w4-arrival', 'Un bloque de hielo', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('companion', 'cheer', 'center')], [
    narrate('La Montaña de las Restas es altísima y está cubierta de nieve.'),
    narrate('En la cima vive Nieve, una osa polar que hace el chocolate caliente más rico del reino.'),
    say('companion', '¡Cuánta nieve! ¡Voy a bajar rodando como una bola! ¡Yuju!', 'cheer'),
    say('lumi', '¡No, {pet}, que la cuesta resbala mucho!', 'worried'),
  ]),
  scene('mountain', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'ice')], [
    narrate('{pet} baja rodando, rodando… y acaba dentro de un bloque de hielo.', 'whoosh'),
    say('companion', '¡Brrr! ¡Qué frío! ¡Estoy {pg:congelada|congelado|congelado} como un polo de limón!', 'scared'),
  ]),
  scene('mountain', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'ice'), cast('polarbear', 'sad', 'right')], [
    say('polarbear', '¡Ay, mi tienda! Borrón me ha hecho una trastada: ha mezclado todos mis números.', 'sad'),
    say('polarbear', 'Tenía 1250 tazas de chocolate y he vendido 475. ¿Cuántas me quedan?', 'think'),
    say('polarbear', '¡No me acuerdo de cómo se resta!', 'worried'),
    say('lumi', 'Para ayudar a Nieve hay que RESTAR. Y su chocolate caliente derretirá el hielo.', 'talk'),
    say('polarbear', '¡Eso es! Ayúdame, {child}, y te daré el cristal celeste.', 'happy'),
    say('companion', '¡Que sea rápido, porfa! ¡Se me está congelando la nariz!', 'worried'),
  ]),
])

export const w4Mid = story('w4-mid', 'La trampa del cero', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('companion', 'worried', 'center', 'ice'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Pedir ayuda a la vecina? ¡He puesto ceros en todas las puertas!', 'happy'),
    say('lumi', 'Es la trampa del cero. Si la vecina tiene un 0, se pide a la siguiente casa.', 'talk'),
    narrate('{child} pide ayuda a la casa de las centenas… ¡y la resta sale perfecta!'),
    say('borron', '¡Bah! Yo nunca entiendo estas restas…', 'sad', 'whoosh'),
    say('companion', '¡Plic, plic! ¡El hielo empieza a gotear!', 'happy'),
  ]),
])

export const w4Rescue = story('w4-rescue', 'Chocolate para todos', [
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ice'), cast('polarbear', 'cheer', 'right')], [
    say('polarbear', '¡Brrr-avo! ¡Ya sé cuántas tazas me quedan: setecientas setenta y cinco!', 'cheer'),
    narrate('Nieve echa chocolate calentito sobre el hielo… y el bloque se derrite.', 'rescue'),
  ]),
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('polarbear', 'happy', 'right')], [
    say('companion', '¡Ya no tengo frío! ¡Gracias, {child}! ¡Eres un sol!', 'cheer'),
    narrate('{pet} se bebe tres tazas seguidas. ¡Y se queda con bigote de chocolate!'),
    say('polarbear', 'Para ti, el cristal celeste. ¡Y una taza bien calentita!', 'happy', 'crystal'),
    say('lumi', '¡Cuatro cristales! ¡Ya vamos por la mitad! La letra de la montaña es la I.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I… ¡Al otro lado de la montaña hay un lago enorme!', 'happy'),
  ]),
])
