/* Prologue — shown once after onboarding. Home → glowing book → Lumi → Numeria and the fog → {pet} jumps through
   the portal first and lands in trouble (the cliffhanger continues in w1-arrival). */
import { cast, narrate, say, scene, story } from './dsl'

export const prologue = story('prologue', 'El libro que brilla', [
  scene('home', [cast('companion', 'happy', 'center')], [
    narrate('Es una tarde tranquila en casa de {child}.'),
    say('companion', '¡{child}! ¡Ven, corre! ¡Ese libro de la estantería está brillando!', 'surprised'),
    narrate('Es un libro muy viejo, con estrellas en la tapa. Y brilla como una lámpara.', 'sparkle'),
    say('companion', '¡Se está abriendo solo! ¡Qué emoción!', 'cheer'),
  ]),
  scene('home', [cast('companion', 'surprised', 'left'), cast('lumi', 'happy', 'center')], [
    narrate('¡FLASH! Del libro sale un unicornio blanco con la crin de siete colores.', 'sparkle'),
    say('lumi', '¡Hola, {child}! Me llamo Lumi. Vengo del Reino de Numeria.', 'happy'),
    say('lumi', 'Allí los números son mágicos: hacen crecer las flores y encienden las estrellas.', 'talk'),
    say('companion', '¡Hala! ¡Un unicornio de verdad en tu habitación!', 'cheer'),
    say('lumi', '¡Y qué {pet_species} tan valiente! Hola, {pet}.', 'happy'),
  ]),
  scene('sky', [cast('companion', 'worried', 'left'), cast('lumi', 'sad', 'center'), cast('borron', 'happy', 'right')], [
    say('lumi', 'Pero anoche, el travieso Borrón sopló su Niebla del Olvido.', 'sad'),
    say('borron', '¡Ji, ji, ji! ¡Fuuuu! ¡Adiós, numeritos!', 'happy', 'whoosh'),
    say('lumi', 'Y todo el reino se olvidó de los números. Hasta mi cuerno se apagó.', 'sad'),
    say('companion', '¡Oh, no! ¿Y cómo se enciende otra vez?', 'worried'),
    say('lumi', 'Necesito ocho cristales mágicos. Están escondidos en ocho lugares del reino.', 'talk'),
  ]),
  scene('home', [cast('companion', 'happy', 'left'), cast('lumi', 'talk', 'center')], [
    say('lumi', 'Busco {cg:una aprendiz de maga|un aprendiz de mago|a alguien con ganas de aprender magia}. ¿Me ayudas, {child}?', 'talk'),
    say('lumi', 'Si encuentras los ocho cristales, se abrirá el Gran Cofre de Numeria.', 'happy'),
    say('lumi', 'Y recuerda: en Numeria los errores no son malos. ¡Son pistas!', 'happy'),
    say('companion', '¡Pues claro que te ayudamos! ¿Verdad, {child}?', 'cheer'),
  ]),
  scene('home', [cast('companion', 'cheer', 'center'), cast('lumi', 'surprised', 'right')], [
    narrate('Las páginas del libro giran solas y se abre un portal de luz.', 'whoosh'),
    say('companion', '¡Vamos! ¡Yo primero!', 'cheer'),
    say('lumi', '¡Espera, {pet}! ¡No corras tanto!', 'surprised'),
    narrate('Pero {pet} ya ha saltado al portal. Desde el otro lado se oye: «¡Ay, ay, ay!».'),
  ]),
  scene('home', [cast('lumi', 'worried', 'center')], [
    say('lumi', '¡Ya se ha metido en un lío! Así es {pet}…', 'worried'),
    say('lumi', '¡Vamos, {child}! ¡Salta tú también!', 'cheer', 'whoosh'),
  ]),
])
