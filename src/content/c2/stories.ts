/* The 2.º adventure (season id 'c2'): the 24 stories, three per world (arrival, mid, rescue). Same maps, backgrounds,
   guardians, companion predicaments and secret word as the 3.º adventure ('s1'); the maths is 2.º. */
import type { StoryDef } from '@/types'
import { cast, narrate, say, scene, story } from '../stories/dsl'

// World 1: El Bosque de los Grupos. Owl. Predicament: vines. Letter V.

export const c2w1Arrival = story('c2-w1-arrival', 'Las lianas de las hadas', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('{child} y Lumi aterrizan sobre un montón de hojas. ¡Están en el Bosque de los Grupos!', 'whoosh'),
    narrate('Aquí viven las hadas jardineras. Lo plantan todo en grupos iguales: dos setas aquí, dos setas allá…'),
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
    say('owl', 'Hay un hechizo rapidísimo: contar en grupos. Y para usarlo hay que conocer los números hasta 999.', 'happy'),
    say('owl', 'Apréndelo, {child}, y te daré el cristal verde. Con su magia soltaremos a {pet}.', 'talk'),
    say('companion', '¡Tú puedes, {child}! ¡Yo te espero aquí colgando!', 'happy'),
    say('lumi', 'En este bosque también hay un mercadillo, con monedas y billetes. ¡Y contaremos de 2 en 2, de 5 en 5 y de 10 en 10!', 'happy'),
  ]),
])

export const c2w1Mid = story('c2-w1-mid', '¡Borrón desordena las setas!', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center', 'vines'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Grupos iguales? ¡Pues yo los desordeno todos!', 'happy'),
    narrate('Borrón sopla, y las setas de las hadas salen volando por el aire.', 'whoosh'),
    say('companion', '¡Eh! ¡Deja las setas en paz, nubecilla!', 'surprised'),
    say('lumi', 'No pasa nada. {child} sabe contar en grupos. ¡Mira qué rápido!', 'happy'),
    narrate('{child} cuenta de 5 en 5: 5, 10, 15, 20, 25. ¡Hay 25 setas!'),
    say('borron', '¿Cómo? ¿Tan rápido? ¡Bah! ¡Me voy a otra parte!', 'surprised', 'whoosh'),
    say('companion', '¡Mira, {child}! ¡Las lianas ya se aflojan un poquito!', 'happy'),
  ]),
])

export const c2w1Rescue = story('c2-w1-rescue', '¡{pet} está libre!', [
  scene('forest', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'vines'), cast('owl', 'cheer', 'right')], [
    say('owl', '¡Uh, uh! ¡Lo has conseguido! ¡Ya sabes contar en grupos!', 'cheer'),
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

// World 2: El Río de las Sumas. Frog. Predicament: bubble. Letter A.

export const c2w2Arrival = story('c2-w2-arrival', 'El puente de piedras mágicas', [
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
    say('frog', 'Las piedras solo obedecen a quien sabe sumar números de dos cifras.', 'think'),
    say('frog', 'Recuerda: las decenas van con las decenas y las unidades con las unidades. Si te equivocas… ¡plof!, al agua.', 'talk'),
    say('lumi', 'Son sumas con llevada, {child}. Pero tenemos un truco: la mochila.', 'happy'),
    say('frog', 'Suma bien y te daré el cristal azul. La burbuja traerá a {pet} a la orilla.', 'happy'),
    say('companion', '¡Mientras, yo floto aquí sin prisa! ¡Qué vistas tan bonitas!', 'happy'),
    say('lumi', 'Por el camino habrá piedras para completar hasta 10 y hasta 100, problemas de juntar y un reloj enorme en el embarcadero.', 'happy'),
  ]),
])

export const c2w2Mid = story('c2-w2-mid', '¡Borrón quiere las mochilas!', [
  scene('river', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center', 'bubble'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¡Me llevo todas las llevadas! ¡Así nadie sabrá sumar!', 'happy'),
    say('lumi', 'La llevada es como una mochila. Y {child} nunca se olvida de su mochila.', 'happy'),
    narrate('{child} suma 27 + 15. Primero 7 + 5 = 12: escribe el 2 y se lleva una a la mochila. Después 2 + 1 + 1 = 4. ¡Son 42!'),
    say('borron', '¡Grrr! ¡Así no hay manera de liarla!', 'sad', 'whoosh'),
    say('companion', '¡La burbuja se acerca a la orilla! ¡Sigue así, {child}!', 'cheer'),
  ]),
])

export const c2w2Rescue = story('c2-w2-rescue', '¡Pop! ¡Fuera burbuja!', [
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
    say('frog', 'Al otro lado del río hay una cueva con mariquitas que brillan. ¡Id con cuidado!', 'talk'),
  ]),
])

// World 3: La Cueva de las Mariquitas. Ladybug. Predicament: stuck. Letter L.

export const c2w3Arrival = story('c2-w3-arrival', 'Las mariquitas luminosas', [
  scene('cave', [cast('lumi', 'idle', 'left'), cast('companion', 'surprised', 'center')], [
    narrate('Dentro de la Cueva de las Mariquitas viven las mariquitas luminosas.'),
    narrate('Brillan en la oscuridad como farolillos. Y sus luces se encienden siempre en el mismo orden.'),
    say('companion', '¡Una mariquita que brilla! ¡Espera, bonita, quiero verte de cerca!', 'cheer'),
  ]),
  scene('cave', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'stuck')], [
    narrate('La mariquita se mete en un túnel diminuto. {pet} la sigue y… ¡crac!', 'pop'),
    say('companion', '¡Me he quedado {pg:atascada|atascado}! ¡Solo me asoma la colita!', 'scared'),
  ]),
  scene('cave', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'stuck'), cast('ladybug', 'talk', 'right')], [
    say('ladybug', '¡{cg:Bienvenida|Bienvenido}, {child}! Soy la Reina Mariquita.', 'happy'),
    say('ladybug', 'Esta noche es la Gran Fiesta del Baile. ¡Pero Borrón nos ha borrado las figuras!', 'worried'),
    say('ladybug', 'Sin ellas no sabemos qué forma tiene cada piedra de la pista.', 'sad'),
    narrate('Lumi le guiña un ojo a {child}.'),
    say('lumi', 'Tranquilidad. Las figuras y las series se descubren mirando con mucha atención.', 'happy'),
    say('ladybug', 'Si conoces las figuras y las series, mis mariquitas abrirán el túnel para {pet}.', 'talk'),
    say('companion', '¡Daos prisa, que me pica la nariz y no me la puedo rascar!', 'worried'),
    say('lumi', 'En esta cueva aprenderemos figuras, líneas rectas y curvas, izquierda y derecha, y series de luces que se repiten. ¡Vamos!', 'happy'),
  ]),
])

export const c2w3Mid = story('c2-w3-mid', '¡Se apagan las luces!', [
  scene('cave', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'stuck'), cast('borron', 'happy', 'right')], [
    narrate('De repente, la cueva se queda a oscuras.', 'whoosh'),
    say('borron', '¡Ji, ji! ¡He apagado las mariquitas! ¡A ver cómo bailáis ahora!', 'happy'),
    say('lumi', 'Las luces se encienden siguiendo un patrón que se repite. ¡Vamos, {child}!', 'talk'),
    narrate('Las luces dicen: 5, 10, 15, 20… {child} mira el patrón y dice: ¡el siguiente es 25! Y la cueva vuelve a brillar.', 'sparkle'),
    say('borron', '¿Otra vez? ¡{cg:Esta niña|Este niño} sabe demasiado!', 'surprised', 'whoosh'),
    say('companion', '¡El túnel se ensancha! ¡Ya puedo mover una pata!', 'happy'),
  ]),
])

export const c2w3Rescue = story('c2-w3-rescue', '¡Fiesta en la cueva!', [
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'stuck'), cast('ladybug', 'cheer', 'right')], [
    say('ladybug', '¡Las luces vuelven a brillar! ¡Que empiece la fiesta!', 'cheer'),
    narrate('Las mariquitas empujan con sus patitas… ¡y {pet} sale del túnel! ¡Plop!', 'rescue'),
  ]),
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('ladybug', 'happy', 'right')], [
    say('companion', '¡Por fin! ¡Gracias, {child}! ¡Vamos a bailar!', 'cheer'),
    narrate('{pet} baila con las mariquitas, a la izquierda y a la derecha. ¡Ja, ja!'),
    say('ladybug', 'Toma el cristal rojo, {child}. Brilla tanto como tú.', 'happy', 'crystal'),
    say('lumi', '¡Tres cristales! Y la letra secreta de la cueva es la L.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L… ¡Todavía faltan letras!', 'think'),
    say('ladybug', 'Seguid el camino hasta la Montaña de las Restas. ¡Y abrigaos bien!', 'talk'),
  ]),
])

// World 4: La Montaña de las Restas. Polar bear Nieve. Predicament: ice. Letter I.

export const c2w4Arrival = story('c2-w4-arrival', 'Un bloque de hielo', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('companion', 'cheer', 'center')], [
    narrate('La Montaña de las Restas es altísima y está cubierta de nieve.'),
    narrate('En la cima vive Nieve, una osa polar que hace el chocolate caliente más rico del reino.'),
    say('companion', '¡Cuánta nieve! ¡Voy a bajar rodando como una bola! ¡Yuju!', 'cheer'),
    say('lumi', '¡No, {pet}, que la cuesta resbala mucho!', 'worried'),
  ]),
  scene('mountain', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'ice')], [
    narrate('{pet} baja rodando, rodando… y acaba dentro de un bloque de hielo.', 'whoosh'),
    say('companion', '¡Brrr! ¡Qué frío! ¡Estoy {pg:congelada|congelado} como un polo de limón!', 'scared'),
  ]),
  scene('mountain', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'ice'), cast('polarbear', 'sad', 'right')], [
    say('polarbear', '¡Ay, mi tienda! Borrón me ha hecho una trastada: ha escondido mis números.', 'sad'),
    say('polarbear', 'Tenía 85 tazas de chocolate y he vendido 37. ¿Cuántas me quedan?', 'think'),
    say('polarbear', '¡No me acuerdo de cómo se resta!', 'worried'),
    say('lumi', 'Para ayudar a Nieve hay que RESTAR. Y su chocolate caliente derretirá el hielo.', 'talk'),
    say('polarbear', '¡Eso es! Ayúdame, {child}, y te daré el cristal celeste.', 'happy'),
    say('companion', '¡Que sea rápido, porfa! ¡Se me está congelando la nariz!', 'worried'),
    say('lumi', 'Por el camino habrá restas en las que pedir ayuda a la vecina, y en lo alto un refugio donde se paga con monedas de euro y billetes.', 'happy'),
  ]),
])

export const c2w4Mid = story('c2-w4-mid', 'La ayuda de la vecina', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('companion', 'worried', 'center', 'ice'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Pedir ayuda a la vecina? ¡He escondido todas las decenas!', 'happy'),
    say('lumi', 'Si a tus unidades no les alcanza, pides una decena a la vecina.', 'talk'),
    narrate('{child} hace 52 − 28. Como 2 no puede quitar 8, pide una decena: 12 − 8 = 4. Después, en las decenas, 4 − 2 = 2. ¡Son 24!'),
    say('borron', '¡Bah! Yo nunca entiendo estas restas…', 'sad', 'whoosh'),
    say('companion', '¡Plic, plic! ¡El hielo empieza a gotear!', 'happy'),
  ]),
])

export const c2w4Rescue = story('c2-w4-rescue', 'Chocolate para todos', [
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ice'), cast('polarbear', 'cheer', 'right')], [
    say('polarbear', '¡Brrr-avo! ¡Ya sé cuántas tazas me quedan: cuarenta y ocho!', 'cheer'),
    narrate('Nieve echa chocolate calentito sobre el hielo… y el bloque se derrite.', 'rescue'),
  ]),
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('polarbear', 'happy', 'right')], [
    say('companion', '¡Ya no tengo frío! ¡Gracias, {child}! ¡Eres un sol!', 'cheer'),
    narrate('{pet} se bebe tres tazas seguidas. ¡Y se queda con bigote de chocolate!'),
    say('polarbear', 'Para ti, el cristal celeste. ¡Y una taza bien calentita!', 'happy', 'crystal'),
    say('lumi', '¡Cuatro cristales! ¡Ya vamos por la mitad! La letra de la montaña es la I.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I… ¡Al otro lado de la montaña nos espera el Lago de los Dobles!', 'happy'),
  ]),
])

// World 5: El Lago de los Dobles. Octopus Octavio. Predicament: ink. Letter E.

export const c2w5Arrival = story('c2-w5-arrival', '¡Achís de tinta!', [
  scene('lake', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('octopus', 'happy', 'right')], [
    narrate('En el Lago Turquesa vive Octavio, un pulpo bromista con 8 brazos.'),
    narrate('Tiene 4 brazos a la izquierda y 4 a la derecha: ¡4 y 4 son 8! Con cada brazo sujeta algo: una concha, una perla, un pincel…'),
    say('companion', '¡Qué pulpo tan gracioso! ¡Voy a decirle hola de cerca!', 'cheer'),
    say('octopus', '¡Hola! Ay… ay… ¡AAACHÍS!', 'surprised'),
  ]),
  scene('lake', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'ink'), cast('octopus', 'worried', 'right')], [
    narrate('¡Splash! {pet} se queda {pg:cubierta|cubierto} de tinta morada de la cabeza a los pies.', 'pop'),
    say('companion', '¡No veo nada! ¿Dónde está el lago? ¿Dónde estoy yo?', 'scared'),
  ]),
  scene('lake', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'ink'), cast('octopus', 'sad', 'right')], [
    say('octopus', '¡Perdón, perdón! Es que Borrón me ha borrado los dobles.', 'sad'),
    say('octopus', 'Mañana hay una carrera de pulpos y no sé cuánto es el doble de cada pulpo.', 'worried'),
    say('lumi', 'Con los dobles es muy fácil: el doble de 4 es 4 + 4, y es 8.', 'happy'),
    say('octopus', 'Si me ayudas, {child}, limpiaré a {pet} con agua del lago.', 'talk'),
    say('octopus', '¡Y el cristal violeta será tuyo!', 'happy'),
    say('companion', '¡Sí, por favor! ¡Ahora mismo parezco una mora gigante!', 'worried'),
    say('lumi', 'Por el lago hay una recta de números con saltos de 10 y de 100, un calendario de días y meses, y reglas para medir.', 'happy'),
  ]),
])

export const c2w5Mid = story('c2-w5-mid', 'Los dorsales de la carrera', [
  scene('lake', [cast('companion', 'worried', 'left', 'ink'), cast('octopus', 'worried', 'center'), cast('borron', 'happy', 'right')], [
    say('octopus', '¡Glu, glu! ¡Borrón ha mezclado los números de la carrera!', 'worried'),
    say('borron', '¡Ji, ji! ¡Nadie sabrá cuánto es el doble de treinta y cinco!', 'happy'),
    narrate('{child} hace 35 + 35. Las decenas: 30 + 30 = 60. Las unidades: 5 + 5 = 10. Y 60 + 10 = 70.'),
    say('borron', '¿El doble de treinta y cinco? ¡Qué truco tan raro… y tan bueno!', 'surprised', 'whoosh'),
    say('companion', '¡Ya te veo un poco, {child}! Bueno… veo una mancha con tu forma.', 'happy'),
  ]),
])

export const c2w5Rescue = story('c2-w5-rescue', 'Cuatro chorritos y otros cuatro', [
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ink'), cast('octopus', 'cheer', 'right')], [
    say('octopus', '¡Glu, glu, hurra! ¡La magia de los dobles ha vuelto a mis brazos!', 'cheer'),
    narrate('Octavio lava a {pet} con cuatro chorritos de agua del lago, y luego con otros cuatro. ¡Fiu, fiu!', 'rescue'),
  ]),
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('octopus', 'happy', 'right')], [
    say('companion', '¡Vuelvo a ver! Y lo primero que veo eres tú. ¡Gracias, {child}!', 'cheer'),
    say('octopus', 'Toma el cristal violeta, {child}. ¡Y ocho abrazos de pulpo!', 'happy', 'crystal'),
    say('lumi', '¡Cinco cristales! La letra del lago es la E.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E… ¡Ya casi la tengo!', 'think'),
    say('lumi', 'Seguid el camino hasta el Jardín del Arcoíris. ¡Allí os espera el hada Iris!', 'happy'),
  ]),
])

// World 6: El Jardín del Arcoíris. Fairy Iris. Predicament: fog. Letter N.

export const c2w6Arrival = story('c2-w6-arrival', 'Un jardín sin colores', [
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
    say('fairy', 'Soy el Hada Iris. Cada flor vota su color favorito, pero Borrón ha borrado todas las gráficas.', 'worried'),
    say('fairy', 'Sin ellas no sé cuántas flores hay de cada color.', 'sad'),
    narrate('—Las gráficas parecen difíciles… —dice {child} en voz bajita.'),
    say('lumi', '¿{cg:Segura|Seguro}? Mira bien: las flores son muy fáciles de contar.', 'happy'),
    say('fairy', 'Si cuentas bien mis gráficas, el cristal rosa será tuyo.', 'talk'),
    say('companion', '¡Y píntame a mí también, porfa! ¡Con muchos colores!', 'sad'),
    say('lumi', 'En el jardín hay un mercado de flores, con precios en euros. Y también veremos gráficas de barras, y cubos, esferas y conos. ¡Vamos!', 'happy'),
  ]),
])

export const c2w6Mid = story('c2-w6-mid', 'Las flores votan', [
  scene('rainbow-garden', [cast('companion', 'sad', 'left', 'fog'), cast('fairy', 'happy', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¿Cuántas flores rojas hay? ¡Esa no la sabe nadie!', 'happy'),
    say('fairy', 'Cada dibujito de mi gráfica son 10 flores. Hay 3 dibujitos rojos y 2 azules.', 'happy'),
    narrate('{child} cuenta: 30 flores rojas y 20 azules. 30 + 20 = 50. ¡Son 50 flores en total!'),
    say('fairy', '¡Eso es! Las decenas se suman con decenas.', 'cheer'),
    say('borron', 'Vaya… Todos saben contar flores menos yo.', 'sad', 'whoosh'),
    say('companion', '¡Mira! ¡La punta de mi nariz ya es de color rosa!', 'happy'),
  ]),
])

export const c2w6Rescue = story('c2-w6-rescue', 'Siete colores', [
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'fog'), cast('fairy', 'cheer', 'right')], [
    say('fairy', '¡Mi jardín vuelve a tener colores! ¡Mira cuántas flores!', 'cheer'),
    narrate('Una lluvia de colores cae sobre {pet}: rojo, naranja, amarillo, verde, azul, añil y violeta.', 'rescue'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('fairy', 'happy', 'right')], [
    say('companion', '¡Vuelvo a tener mis colores! ¡Gracias, {child}! ¡Eres {cg:una artista|un artista}!', 'cheer'),
    say('fairy', 'Para ti, el cristal rosa. ¡Que tu vida tenga siempre siete colores!', 'happy', 'crystal'),
    say('lumi', '¡Seis cristales! La letra del jardín es la N.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E, N… ¡Ya solo faltan dos letras!', 'think'),
    say('fairy', 'Seguid el camino hasta la Forja del Dragón. ¡Id con cuidado, que hace calor!', 'talk'),
  ]),
])

// World 7: La Forja del Dragón. Dragon Chispa. Predicament: cage. Letter T. First use of "multiplicar".

export const c2w7Arrival = story('c2-w7-arrival', 'El farolillo de la forja', [
  scene('volcano', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('En lo alto del volcán está la forja de Chispa, una dragona enorme y muy simpática.'),
    narrate('Chispa fabrica coronas, escudos y farolillos. Todo lo hace en grupos iguales.'),
    say('companion', '¡Mira, {child}! ¡Un farolillo con forma de jaula! ¡Me meto a ver!', 'cheer'),
    say('lumi', '¡No, {pet}, que esa puerta…!', 'worried'),
  ]),
  scene('volcano', [cast('lumi', 'worried', 'left'), cast('companion', 'worried', 'center', 'cage')], [
    narrate('¡Clac! La puerta del farolillo se cierra con un candado de números.', 'pop'),
    say('companion', '¡Estoy {pg:encerrada|encerrado}! Bueno… por lo menos aquí no hace frío.', 'worried'),
  ]),
  scene('volcano', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'cage'), cast('dragon', 'talk', 'right')], [
    say('dragon', '¡GRRR! Bueno… en realidad soy muy simpática. Hola, soy Chispa.', 'happy'),
    say('dragon', 'Necesito 4 cofres con 5 gemas en cada uno. ¿Cuántas gemas son?', 'talk'),
    say('dragon', 'Pero mis tablas se quedaron en la niebla. Y ese candado solo se abre con grupos iguales.', 'sad'),
    say('lumi', 'Para sumar el mismo número muchas veces hay un hechizo nuevo. ¡Se llama MULTIPLICAR!', 'happy'),
    say('companion', '¿Multiplicar? ¿Y eso se come? ¡Yo quiero un trocito!', 'surprised'),
    say('lumi', 'Mira: 5 + 5 + 5 + 5 es lo mismo que 4 × 5. ¡Y es 20!', 'happy'),
    say('lumi', 'Aquí aprenderemos las tablas del 2, del 5 y del 10, y problemas de grupos. ¡Vamos a por el candado!', 'happy'),
  ]),
])

export const c2w7Mid = story('c2-w7-mid', 'Los farolillos en grupos', [
  scene('volcano', [cast('companion', 'worried', 'left', 'cage'), cast('dragon', 'worried', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! ¡He desordenado todos los grupos de la forja! ¡La forja se va a apagar!', 'happy', 'whoosh'),
    say('dragon', '¡Oh, no! ¡Sin grupos iguales mis farolillos saldrán torcidos!', 'worried'),
    narrate('{child} cuenta tres cajas con 5 gemas cada una: 5 + 5 + 5 = 15. Son 3 × 5 = 15.'),
    say('dragon', '¡Eso es! Cuenta cuántos grupos hay y después suma.', 'cheer'),
    say('borron', 'Ojalá alguien me enseñara a mí…', 'sad', 'whoosh'),
    say('companion', '¡El candado ha hecho clic! ¡Ya falta poquito!', 'happy'),
  ]),
])

export const c2w7Rescue = story('c2-w7-rescue', '¡Clac! ¡Candado abierto!', [
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'cage'), cast('dragon', 'cheer', 'right')], [
    say('dragon', '¡GRRRACIAS! ¡Veinte gemas, justo las que faltaban! ¡Los farolillos brillarán!', 'cheer'),
    narrate('Chispa sopla una llamita muy suave y el candado se abre. ¡Clac!', 'rescue'),
  ]),
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('dragon', 'happy', 'right')], [
    say('companion', '¡Libre otra vez! ¡Gracias, {child}! ¡Multiplicas a lo grande!', 'cheer'),
    say('dragon', 'Este es el cristal naranja. Lo he pulido solo para ti, {child}.', 'happy', 'crystal'),
    say('lumi', '¡Siete cristales! La letra de la forja es la T.', 'cheer', 'sparkle'),
    say('companion', 'V, A, L, I, E, N, T… ¡Solo falta una! ¡Vamos al Castillo de las Torres!', 'cheer'),
  ]),
])

// World 8: El Castillo de las Torres. Queen Aurora. Predicament: net. Letter E.

export const c2w8Arrival = story('c2-w8-arrival', 'La red de Borrón', [
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'happy', 'center'), cast('queen', 'happy', 'right')], [
    narrate('¡Por fin, el Castillo de Numeria! La Reina Aurora espera en la torre más alta.'),
    say('queen', '¡Hola, {child}! Te estaba esperando. Mira mis torres: cada una tiene pisos y estrellas.', 'happy'),
    say('queen', 'Quiero contar las estrellas de tres torres con cuatro pisos cada una.', 'talk'),
    say('queen', 'Pero Borrón me ha borrado las tablas del 3 y del 4…', 'sad'),
  ]),
  scene('castle', [cast('lumi', 'surprised', 'left'), cast('companion', 'scared', 'center', 'net'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji, ji! ¡Si consigues el último cristal, mi niebla desaparecerá!', 'happy'),
    narrate('¡Zas! Borrón lanza una red y atrapa a {pet}.', 'whoosh'),
    say('companion', '¡Eh! ¡Suéltame, nubecilla gruñona!', 'scared'),
    say('borron', '¡Así no terminarás nunca la aventura! ¡Ji, ji!', 'happy', 'whoosh'),
  ]),
  scene('castle', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'net'), cast('queen', 'talk', 'right')], [
    say('lumi', '{child}, este es el último cristal. Las tablas del 3 y del 4 nos ayudarán a contar las torres.', 'talk'),
    say('lumi', 'Y en las cuentas largas, a veces se esconde un error. ¡Búscalo con calma!', 'happy'),
    say('queen', 'Cuenta bien y el cristal dorado será tuyo.', 'happy'),
    say('companion', '¡Tú puedes, {child}! ¡Yo, mientras, me columpio en la red! ¡Uiii!', 'happy'),
    say('lumi', 'Por el castillo aprenderemos sumas y restas de tres cifras, las tablas del 3 y del 4, y a encontrar errores. ¡Vamos!', 'happy'),
  ]),
])

export const c2w8Mid = story('c2-w8-mid', 'Borrón mira desde la torre', [
  scene('castle', [cast('companion', 'worried', 'left', 'net'), cast('lumi', 'idle', 'center'), cast('borron', 'think', 'right')], [
    narrate('Desde lo alto de una torre, Borrón mira cómo {child} cuenta las estrellas.'),
    say('borron', '¡He puesto las estrellas en torres torcidas! ¿Cuántas hay? ¡Nadie lo sabrá!', 'think'),
    narrate('{child} piensa: 4 + 4 + 4 = 12. Son tres veces cuatro: 3 × 4 = 12. ¡Doce estrellas!'),
    say('lumi', 'Muy bien. Recuerda la tabla del 4 y la del 3, y sigue contando.', 'talk'),
    say('borron', 'Hum… Eso casi lo he entendido. ¡Pero no se lo digáis a nadie!', 'surprised', 'whoosh'),
    say('companion', '¡La red se está aflojando! ¡Sigue contando, {child}!', 'happy'),
  ]),
])

export const c2w8Rescue = story('c2-w8-rescue', 'El último cristal', [
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'net'), cast('queen', 'cheer', 'right')], [
    say('queen', '¡Todas las torres están llenas! ¡Cada piso tiene sus estrellas!', 'cheer'),
    narrate('La red se deshace en mil estrellitas, y {pet} salta a los brazos de {child}.', 'rescue'),
  ]),
  scene('castle', [cast('lumi', 'surprised', 'left'), cast('companion', 'cheer', 'center'), cast('queen', 'happy', 'right')], [
    say('companion', '¡Gracias, {child}! ¡Me has rescatado de la red! ¡Eres {cg:mi heroína|mi héroe}!', 'cheer'),
    say('queen', 'Toma el cristal dorado, {child}. Es el último.', 'happy', 'crystal'),
    say('lumi', '¡La letra del castillo es la E! ¡Ya tenemos las ocho letras!', 'surprised', 'sparkle'),
    say('companion', '¡Rápido, Lumi! ¡Vamos a poner los cristales en tu cuerno!', 'cheer'),
  ]),
])

export const c2Stories: StoryDef[] = [
  c2w1Arrival, c2w1Mid, c2w1Rescue,
  c2w2Arrival, c2w2Mid, c2w2Rescue,
  c2w3Arrival, c2w3Mid, c2w3Rescue,
  c2w4Arrival, c2w4Mid, c2w4Rescue,
  c2w5Arrival, c2w5Mid, c2w5Rescue,
  c2w6Arrival, c2w6Mid, c2w6Rescue,
  c2w7Arrival, c2w7Mid, c2w7Rescue,
  c2w8Arrival, c2w8Mid, c2w8Rescue,
]
