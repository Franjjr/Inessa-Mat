/* World 7 — La Forja del Dragón. Guardian: la dragona Chispa (dragon). Predicament: cage. Letter T. */
import { cast, narrate, say, scene, story } from './dsl'

export const w7Arrival = story('w7-arrival', 'El farolillo de la forja', [
  scene('volcano', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('En lo alto del volcán está la forja de Chispa, una dragona enorme y muy simpática.'),
    narrate('Chispa fabrica coronas, escudos y farolillos con números enormes.'),
    say('companion', '¡Mira, {child}! ¡Un farolillo con forma de jaula! ¡Me meto a ver!', 'cheer'),
    say('lumi', '¡No, {pet}, que esa puerta…!', 'worried'),
  ]),
  scene('volcano', [cast('lumi', 'worried', 'left'), cast('companion', 'worried', 'center', 'cage')], [
    narrate('¡Clac! La puerta del farolillo se cierra con un candado de números.', 'pop'),
    say('companion', '¡Estoy {pg:encerrada|encerrado|encerrado}! Bueno… por lo menos aquí no hace frío.', 'worried'),
  ]),
  scene('volcano', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'cage'), cast('dragon', 'talk', 'right')], [
    say('dragon', '¡GRRR! Bueno… en realidad soy muy simpática. Hola, soy Chispa.', 'happy'),
    say('dragon', 'Necesito 6 cajas con 47 gemas cada una para las coronas de la reina.', 'talk'),
    say('dragon', 'Pero mis tablas se quedaron en la niebla. Y ese candado solo se abre multiplicando.', 'sad'),
    say('lumi', 'Las multiplicaciones grandes son como una pizza: ¡se hacen por trocitos!', 'happy'),
    say('companion', '¿Pizza? ¿Alguien ha dicho pizza? ¡Yo quiero un trocito!', 'surprised'),
  ]),
])

export const w7Mid = story('w7-mid', 'Las llevadas de la forja', [
  scene('volcano', [cast('companion', 'worried', 'left', 'cage'), cast('dragon', 'worried', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¡He soplado todas las llevadas! ¡La forja se va a apagar!', 'happy', 'whoosh'),
    say('dragon', '¡Oh, no! ¡Sin llevadas mis coronas saldrán torcidas!', 'worried'),
    narrate('{child} multiplica 6 × 7 = 42. Escribe el 2… y se lleva 4 en la mochila.'),
    say('dragon', '¡Eso es! Primero se multiplica y después se suma la mochila.', 'cheer'),
    say('borron', 'Ojalá alguien me enseñara a mí…', 'sad', 'whoosh'),
    say('companion', '¡El candado ha hecho clic! ¡Ya falta poquito!', 'happy'),
  ]),
])

export const w7Rescue = story('w7-rescue', '¡Clac! ¡Candado abierto!', [
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'cage'), cast('dragon', 'cheer', 'right')], [
    say('dragon', '¡GRRRACIAS! ¡Doscientas ochenta y dos gemas! ¡Las coronas brillarán!', 'cheer'),
    narrate('Chispa sopla una llamita muy suave y el candado se abre. ¡Clac!', 'rescue'),
  ]),
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('dragon', 'happy', 'right')], [
    say('companion', '¡Libre otra vez! ¡Gracias, {child}! ¡Multiplicas a lo grande!', 'cheer'),
    say('dragon', 'Este es el cristal naranja. Lo he pulido solo para ti, {child}.', 'happy', 'crystal'),
    say('lumi', '¡Siete cristales! La letra de la forja es la T.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E, N, T… ¡Solo falta una! ¡Vamos al castillo!', 'cheer'),
  ]),
])
