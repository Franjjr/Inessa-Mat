/* World 1 — El Bosque de los Grupos. Guardian: el Búho Sabio (owl). Predicament: vines. Letter V. */
import { cast, narrate, say, scene, story } from './dsl'

export const w1Arrival = story('w1-arrival', 'Las lianas de las hadas', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('{child} y Lumi aterrizan sobre un montón de hojas. ¡Están en el Bosque de los Grupos!', 'whoosh'),
    narrate('Aquí viven las hadas jardineras. Lo plantan todo en grupos iguales: tres setas aquí, tres setas allá…'),
    say('companion', '¡{child}, mira! ¡Una mariposa de colores! ¡Voy a por ella!', 'cheer'),
    say('lumi', '¡Cuidado, {pet}! ¡Esas lianas son mágicas!', 'worried'),
  ]),
  scene('forest', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'vines')], [
    narrate('¡Zas! Las lianas de las hadas se enrollan alrededor de {pet}.', 'pop'),
    say('companion', '¡Ay! ¡Estoy {pg:enredada|enredado} como un ovillo de lana!', 'scared'),
    say('companion', '¡{child}, ayúdame, porfa! ¡No me puedo mover!', 'sad'),
  ]),
  scene('forest', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'vines'), cast('owl', 'talk', 'right')], [
    say('owl', 'Uh, uh. Soy el Búho Sabio. Esas lianas solo se sueltan con magia de números.', 'talk'),
    say('owl', 'Pero la niebla ha borrado los números. Las hadas ya no saben cuántas setas tienen.', 'think'),
    say('lumi', 'Y si las cuentan una a una, ¡van a tardar cien años!', 'worried'),
    say('owl', 'Para contar grupos iguales existe un hechizo rapidísimo. Se llama MULTIPLICAR.', 'happy'),
    say('owl', 'Apréndelo, {child}, y te daré el cristal verde. Con su magia soltaremos a {pet}.', 'talk'),
    say('companion', '¡Tú puedes, {child}! ¡Yo te espero aquí colgando!', 'happy'),
  ]),
])

export const w1Mid = story('w1-mid', '¡Borrón desordena las setas!', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center', 'vines'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Grupos iguales? ¡Pues yo los desordeno todos!', 'happy'),
    narrate('Borrón sopla, y las setas de las hadas salen volando por el aire.', 'whoosh'),
    say('companion', '¡Eh! ¡Deja las setas en paz, nubecilla!', 'surprised'),
    say('lumi', 'No pasa nada. {child} sabe contar en grupos. ¡Mira qué rápido!', 'happy'),
    narrate('{child} ve 4 grupos de 3 setas y lo dice enseguida: ¡4 × 3 = 12!'),
    say('borron', '¿Cómo? ¿Tan rápido? ¡Bah! ¡Me voy a otra parte!', 'surprised', 'whoosh'),
    say('companion', '¡Mira, {child}! ¡Las lianas ya se aflojan un poquito!', 'happy'),
  ]),
])

export const w1Rescue = story('w1-rescue', '¡{pet} está libre!', [
  scene('forest', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'vines'), cast('owl', 'cheer', 'right')], [
    say('owl', '¡Uh, uh! ¡Lo has conseguido! ¡Ya sabes multiplicar!', 'cheer'),
    narrate('Las lianas brillan, se sueltan… ¡y {pet} cae en una cama de hojas blanditas!', 'rescue'),
  ]),
  scene('forest', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('owl', 'happy', 'right')], [
    say('companion', '¡Libre! ¡Gracias, {child}! ¡Eres {cg:la mejor|el mejor}!', 'cheer'),
    narrate('{pet} le da a {child} un abrazo enorme, de esos que hacen cosquillas.'),
    say('owl', 'Toma, {child}: el cristal verde. Te lo has ganado.', 'happy', 'crystal'),
    narrate('El cristal vuela hasta el cuerno de Lumi y se enciende. ¡Clic!', 'sparkle'),
    say('lumi', '¡Mi cuerno ya tiene una luz! Y el cristal trae una letra secreta: la V.', 'cheer'),
    say('companion', '¿Una V? ¿Qué palabra será? ¡Vamos a por el siguiente cristal!', 'happy'),
    say('owl', 'Seguid el camino hasta el Río de las Sumas. ¡Buen viaje!', 'talk'),
  ]),
])
