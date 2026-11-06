/* La Isla de las Palabras: the stories of the island, eight stages × three (arrival, mid, rescue). The narrator and Lumi
   speak Spanish; the English words and phrases go between asterisks («*Welcome!*»), so the English voice says them
   (sayMixed) and the screen shows them without the marks. Each story has 80–180 words, humour, and {pet}. Original text. */
import { cast, narrate, say, scene, story } from '../stories/dsl'

// 1 · El Puerto de los Saludos (la Rana Saltarina)
export const islaLlegada1 = story('isla-1-llegada', 'Bienvenidos al puerto', [
  scene('sky', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center')], [
    narrate('{child} y Lumi aterrizan en una playa de arena calentita. En la entrada hay un cartel de madera: *Welcome!*'),
    say('lumi', '*Welcome* quiere decir «bienvenidos». ¡Estamos en la Isla de las Palabras!', 'happy'),
    say('companion', '¡Mira, {child}! Una rana con gafas de sol nos saluda con la pata.', 'cheer'),
  ]),
  scene('sky', [cast('lumi', 'talk', 'left'), cast('companion', 'happy', 'center'), cast('frog', 'talk', 'right')], [
    say('frog', '*Hello!* Soy la Rana Saltarina. *What\'s your name?*', 'talk'),
    say('lumi', 'Te pregunta cómo te llamas. Responde: *My name is…* y luego tu nombre.', 'happy'),
    say('companion', 'Yo diré: *My name is* {pet}. ¡Qué fácil!', 'cheer'),
  ]),
  scene('sky', [cast('lumi', 'worried', 'left'), cast('companion', 'scared', 'center', 'fog'), cast('frog', 'worried', 'right')], [
    narrate('¡Zuuum! Una nube gris llamada Borrón sopla fuerte y {pet} queda atrapado en una burbuja de niebla.', 'whoosh'),
    say('frog', 'Borrón se ha llevado las palabras de los saludos. Recuérdalas conmigo, {child}: *hello*, *goodbye* y *good morning*.', 'worried'),
    say('lumi', '¡Vamos! Con esas tres palabras la niebla se deshace.', 'happy'),
  ]),
])

export const islaMitad1 = story('isla-1-mitad', 'Borrón revuelve los saludos', [
  scene('sky', [cast('lumi', 'idle', 'left'), cast('frog', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Mezclo los saludos y nadie sabe qué decir.', 'happy'),
    narrate('Borrón sopla, y las palabras salen volando: una cae al agua y otra se enreda en una palmera.', 'whoosh'),
    say('frog', 'Ay, ay. *Good morning* está en la palmera y *goodbye* flota en el mar.', 'worried'),
  ]),
  scene('sky', [cast('lumi', 'happy', 'left'), cast('frog', 'cheer', 'center'), cast('companion', 'happy', 'right')], [
    narrate('{child} repite cada palabra en voz alta, bien clarita. *Good morning* vuelve a la rana, y *hello* se posa en el hombro de Lumi.', 'sparkle'),
    say('lumi', '¡Muy bien! Por la mañana, *good morning*. Cuando llegas, *hello*. Y al irte, *goodbye*.', 'happy'),
    say('companion', '¡Borrón se va sin sus nubes! Ahora solo falta el guardián.', 'cheer'),
  ]),
])

export const islaRescate1 = story('isla-1-rescate', '¡{pet} está libre!', [
  scene('sky', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'fog'), cast('frog', 'cheer', 'right')], [
    say('frog', '*Hello, {child}!* Has recordado los saludos. ¡Qué bien suenas!', 'cheer'),
    narrate('La niebla se deshace como un azucarillo y {pet} cae sobre la arena, blandito.', 'pop'),
  ]),
  scene('sky', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('frog', 'happy', 'right')], [
    say('companion', 'Gracias, {child}. Ya me sé *hello*, *goodbye* y *good morning*.', 'cheer'),
    say('lumi', 'Mira el mar: los colores vuelven a la playa. Pronto veremos *red*, *blue* y *green*.', 'happy'),
    narrate('Los saludos suenan por toda la playa: *hello* en las olas, *goodbye* en las gaviotas y *good morning* en el sol.', 'sparkle'),
    say('lumi', 'Y tú, {child}, cuando conozcas a alguien, recuerda: primero saludas y luego preguntas.', 'happy'),
    say('frog', 'Sigue el camino hasta el Jardín de los Animales. ¡Buen viaje, {child}!', 'talk'),
  ]),
])

// 2 · El Jardín de los Animales (la Reina Mariquita)
export const islaLlegada2 = story('isla-2-llegada', 'Los animales del jardín', [
  scene('rainbow-garden', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('ladybug', 'talk', 'right')], [
    say('ladybug', '*Hello!* Soy la Reina Mariquita. En mi jardín viven muchos animales.', 'talk'),
    say('ladybug', 'Mira: *It\'s a dog*, es un perro. *It\'s a cat*, es un gato. Y *This is my mum*: esta es mi mamá.', 'happy'),
    say('companion', '¡Hay muchísimos! Cuento: *thirty* flores, *forty* hojas…', 'cheer'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'worried', 'center', 'vines'), cast('ladybug', 'think', 'right')], [
    say('lumi', '*Thirty* es treinta y *forty* es cuarenta. Cuenta de diez en diez y no te equivocas.', 'happy'),
    narrate('Las lianas de un rosal se enredan en {pet}. ¡Otra vez las nubes de Borrón!', 'whoosh'),
    say('ladybug', 'Para soltarle, dime un animal grande y otro pequeño. ¡Con *big* y *small* se suelta el nudo!', 'talk'),
  ]),
])

export const islaMitad2 = story('isla-2-mitad', 'Borrón esconde a los animales', [
  scene('rainbow-garden', [cast('lumi', 'idle', 'left'), cast('ladybug', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Me llevo a los animales a mi nube. Ya no sabréis cómo se llaman.', 'happy'),
    narrate('Borrón sopla un remolino de polvo, y el perro, el gato y el pájaro desaparecen.', 'whoosh'),
    say('ladybug', 'No pasa nada. *It\'s big!* Si es grande, dilo en inglés. *It\'s small!* Si es pequeño.', 'talk'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('borron', 'surprised', 'right')], [
    narrate('{child} describe a cada animal: un perro *big*, un gato *small*, una familia en fila.', 'sparkle'),
    say('companion', '¡Ja! Borrón, tu nube se llena de palabras y ya no cabe ni un ruido.', 'cheer'),
    say('borron', '¡Bah! ¡Me voy a otro jardín, que aquí hay demasiada familia!', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate2 = story('isla-2-rescate', '¡{pet} sale del rosal!', [
  scene('rainbow-garden', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'vines'), cast('ladybug', 'cheer', 'right')], [
    say('ladybug', '*Well done, {child}!* Sabes contar y nombrar a tu familia.', 'cheer'),
    narrate('Las lianas se aflojan y {pet} da una voltereta sobre la hierba.', 'rescue'),
  ]),
  scene('rainbow-garden', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('ladybug', 'happy', 'right')], [
    narrate('Las mariquitas bailan alrededor de {pet}, y el rosal se cubre de flores amarillas, rojas y azules.', 'sparkle'),
    say('lumi', 'Sabes contar y nombrar, {child}. ¡Qué bien suena tu inglés en el jardín!', 'happy'),
    say('companion', '¡Libre! *Thank you*, {child}. Gracias en inglés, ¡qué bonito suena!', 'cheer'),
    say('ladybug', 'Mis animales ya están en su sitio: *a dog*, *a cat* y *a bird*. ¡Qué bonito jardín!', 'happy'),
    say('ladybug', 'Sigue hasta la Torre de las Cuentas. Allí el búho te espera con sus escalones.', 'talk'),
  ]),
])

// 3 · La Torre de las Cuentas (el Búho Sabio)
export const islaLlegada3 = story('isla-3-llegada', 'Las cuentas de la torre', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('owl', 'talk', 'right')], [
    narrate('La torre tiene cien escalones, y cada uno lleva un número escrito en inglés.'),
    say('owl', 'Uh, uh. Mira este: *twenty-one*. Es veintiuno.', 'talk'),
    say('owl', 'Y *thirty-two* es treinta y dos. *Sixty-five* es sesenta y cinco. ¿Lo ves?', 'happy'),
  ]),
  scene('mountain', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'ice'), cast('owl', 'think', 'right')], [
    narrate('Un escalón de hielo se ha puesto delante de {pet}. ¡No puede subir!', 'pop'),
    say('lumi', 'Para deshacer el hielo hay que decir el número en inglés. Empieza por la decena, luego la unidad.', 'happy'),
    say('owl', 'Por ejemplo: *forty-five*. Primero *forty*, después *five*. ¡Cuéntalos tú, {child}!', 'talk'),
    say('owl', 'Cuando termines, cuenta en voz alta. Si dudas, empieza por la decena: *fifty*, *fifty-one*…', 'talk'),
  ]),
])

export const islaMitad3 = story('isla-3-mitad', 'Borrón se lleva los números', [
  scene('mountain', [cast('lumi', 'idle', 'left'), cast('owl', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Uy, qué bonitos números! Me los llevo todos a mi nube.', 'happy'),
    narrate('Borrón agita la niebla y los escalones se quedan sin cifras. Solo se ven los dibujos.', 'whoosh'),
    say('owl', 'Uh, uh. Pero los números siguen aquí, Borrón. Se leen en inglés.', 'talk'),
    narrate('El Búho Sabio sacude sus alas grandes y la niebla se aparta de los escalones, uno a uno.', 'whoosh'),
  ]),
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('owl', 'happy', 'right')], [
    say('companion', '¡{child} lee *sixty-eight* sin mirar! Borrón, ¿cuánto es?', 'cheer'),
    say('borron', '¡Ay! ¡No me gusta cuando aciertan! Me voy de la torre.', 'surprised', 'whoosh'),
    narrate('La niebla se va, y los números vuelven a brillar en cada escalón.', 'sparkle'),
  ]),
])

export const islaRescate3 = story('isla-3-rescate', '¡{pet} sube la torre!', [
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ice'), cast('owl', 'cheer', 'right')], [
    say('owl', '¡Uh, uh! *Well done!* Has contado en inglés desde veintiuno hasta sesenta y ocho.', 'cheer'),
    narrate('El hielo se rompe en mil trocitos, y {pet} salta al primer escalón.', 'rescue'),
  ]),
  scene('mountain', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('owl', 'happy', 'right')], [
    narrate('Desde lo alto de la torre se ve toda la isla. Ya sabes contar muchos números en inglés, y se nota.', 'sparkle'),
    narrate('Los escalones brillan con cada número bien dicho.', 'sparkle'),
    say('companion', '¡Arriba! {child}, eres {cg:la mejor|el mejor} contando.', 'cheer'),
    say('lumi', 'Qué bien suena tu inglés desde arriba, {child}.', 'happy'),
    say('owl', 'Baja al mercado del Oso Polar. Allí comprarás con números, y con *please*, ¡por favor!', 'talk'),
  ]),
])

// 4 · El Mercado del Oso Polar (la osa Nieve)
export const islaLlegada4 = story('isla-4-llegada', 'Compras en el mercado', [
  scene('lake', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('polarbear', 'talk', 'right')], [
    narrate('El mercado huele a fruta y a pan recién hecho. La osa Nieve atiende su puesto con un delantal.'),
    say('polarbear', '*Hello!* Soy la osa Nieve. *I like apples*, dice mi amigo pingüino. ¿Y tú?', 'talk'),
    say('lumi', 'Dile: *I like bananas*, si te gustan los plátanos. ¡Es muy fácil!', 'happy'),
  ]),
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'worried', 'center', 'bubble'), cast('polarbear', 'happy', 'right')], [
    narrate('Un globo de jabón se lleva a {pet} por encima de los puestos. ¡Uuuy!', 'whoosh'),
    say('polarbear', 'Para bajarle, pide algo con educación: *Can I have some milk, please?*', 'talk'),
    say('companion', '¿Y si pido *bread*, *cake* o *water*? ¿También sirven?', 'worried'),
    say('lumi', 'Claro, {child}. Pide con *Can I have…* y el nombre de la comida. ¡Y no olvides *please*!', 'happy'),
  ]),
])

export const islaMitad4 = story('isla-4-mitad', 'Borrón cambia los precios', [
  scene('lake', [cast('lumi', 'idle', 'left'), cast('polarbear', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Cambio los carteles. Ahora la leche es un zapato.', 'happy'),
    narrate('Borrón sopla, y las etiquetas de los puestos se mezclan. El pan parece una pelota.', 'whoosh'),
    say('polarbear', 'Ay, mi pan. Pero las palabras no se cambian tan fácil. *Bread* es pan.', 'worried'),
  ]),
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('polarbear', 'happy', 'right')], [
    say('companion', '¡Yo pido *Can I have some bread, please?* y el pan vuelve a su sitio!', 'cheer'),
    narrate('{child} pide una manzana, un plátano y un vaso de agua, todo en inglés. Borrón se rinde.', 'sparkle'),
    say('borron', 'Bah, ¿qué pasa aquí? ¡Me voy a comer nubes!', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate4 = story('isla-4-rescate', '¡{pet} vuelve al mercado!', [
  scene('lake', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'bubble'), cast('polarbear', 'cheer', 'right')], [
    say('polarbear', '*Well done, {child}!* Pediste con educación y ahora las burbujas se rompen.', 'cheer'),
    narrate('¡Pop! La burbuja explota y {pet} cae sobre un saco de harina, sin nada de daño.', 'pop'),
  ]),
  scene('lake', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('polarbear', 'happy', 'right')], [
    say('companion', 'Gracias, osa Nieve. Un bocadillo de *bread* para el camino, por favor.', 'cheer'),
    narrate('El mercado entero aplaude. Los plátanos bailan, las manzanas saltan y el pan se queda muy contento.', 'sparkle'),
    say('lumi', 'Ya sabes pedir con *please*. Eso hace que la gente sonría, {child}.', 'happy'),
    say('polarbear', 'Vuelve cuando quieras, con tu *Can I have…*, ¡y con tu mejor sonrisa!', 'happy'),
    say('polarbear', 'Ahora sube al Armario del Pulpo, donde la ropa está muy desordenada.', 'talk'),
  ]),
])

// 5 · El Armario del Pulpo (Octavio)
export const islaLlegada5 = story('isla-5-llegada', 'Un armario muy desordenado', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('octopus', 'talk', 'right')], [
    narrate('Octavio tiene ocho brazos, y los usa para ordenar un armario gigante lleno de ropa.'),
    say('octopus', '*Hello!* Soy Octavio. *I\'m wearing red shoes*: llevo zapatos rojos. ¿Y tú?', 'talk'),
    say('octopus', 'Mis ocho brazos tienen ropa diferente: *a shirt*, *socks*, *a hat*… ¡Y todo cabe!', 'happy'),
    say('lumi', 'Di: *I\'m wearing…* y luego la prenda. Por ejemplo, *a shirt*, una camiseta.', 'happy'),
  ]),
  scene('forest', [cast('lumi', 'talk', 'left'), cast('companion', 'scared', 'center', 'net'), cast('octopus', 'worried', 'right')], [
    narrate('¡Zas! Una red de calcetines cae sobre {pet}. Estaba escondida entre los pantalones.', 'pop'),
    say('octopus', 'Estoy liando la red con *socks* y *trousers*. Para salir, dime la prenda de *shoes*.', 'worried'),
    say('companion', 'Ayuda, {child}! ¡No veo nada entre tanta tela!', 'sad'),
  ]),
])

export const islaMitad5 = story('isla-5-mitad', 'Borrón esconde la ropa', [
  scene('forest', [cast('lumi', 'idle', 'left'), cast('octopus', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Escondo la ropa del cole. ¡Nadie encontrará su mochila!', 'happy'),
    narrate('Borrón sopla y los lápices, los libros y las reglas salen volando del armario.', 'whoosh'),
    say('octopus', 'En la clase se dice: *Sit down*, siéntate, y *Open your book*, abre tu libro.', 'talk'),
  ]),
  scene('forest', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('octopus', 'happy', 'right')], [
    say('companion', '¡Yo recojo el *pencil* y el *pen*! Y tú, {child}, el *book*.', 'cheer'),
    narrate('{child} ordena el estuche, dice cada cosa en inglés y el armario vuelve a estar limpio.', 'sparkle'),
    say('borron', 'No puede ser. ¡Ya no me queda ni un calcetín para esconder!', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate5 = story('isla-5-rescate', '¡{pet} sale de la red!', [
  scene('forest', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'net'), cast('octopus', 'cheer', 'right')], [
    say('octopus', '*Well done, {child}!* Con tus palabras la red se ha soltado.', 'cheer'),
    narrate('Octavio tira del último calcetín y {pet} sale de un salto, con un gorro de lana.', 'rescue'),
  ]),
  scene('forest', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('octopus', 'happy', 'right')], [
    say('companion', '¡Qué bien me queda el gorro! *I\'m wearing a hat*, ¡ya lo sé decir!', 'cheer'),
    narrate('El armario ya no es un lío: la ropa cuelga por colores y cada prenda tiene su sitio.', 'sparkle'),
    say('lumi', 'Di en voz alta la prenda que llevas hoy, {child}: *I\'m wearing…*', 'happy'),
    say('octopus', 'Ahora ve a la Casa del Escondite. Allí se juega con *in*, *on* y *under*.', 'talk'),
  ]),
])

// 6 · La Casa del Escondite (el Hada Iris)
export const islaLlegada6 = story('isla-6-llegada', 'Juegos de escondite', [
  scene('cave', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('fairy', 'talk', 'right')], [
    narrate('El Hada Iris vive en una casa con muchas puertas y muchos escondites.'),
    say('fairy', '*Hello!* Vamos a jugar. *Where\'s the cat?* ¿Dónde está el gato?', 'talk'),
    say('lumi', 'Mira: *It\'s under the bed*, está debajo de la cama. Y *on the table* es encima de la mesa.', 'happy'),
  ]),
  scene('cave', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'stuck'), cast('fairy', 'think', 'right')], [
    narrate('{pet} se ha metido en un hueco muy estrecho, entre dos rocas. ¡Está atascado!', 'pop'),
    say('fairy', 'Para salir, dime dónde está el gorro: *in the box*, *on the chair* o *under the sofa*.', 'talk'),
    say('companion', 'Yo estoy *under the table*, ¡debajo de la mesa! ¿Me sacas, {child}?', 'worried'),
  ]),
])

export const islaMitad6 = story('isla-6-mitad', 'Borrón mueve los muebles', [
  scene('cave', [cast('lumi', 'idle', 'left'), cast('fairy', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Muevo las sillas y las camas. ¡Nadie sabe dónde está nada!', 'happy'),
    narrate('Borrón sopla, y los muebles dan vueltas. La mesa acaba en el tejado y la cama en el río.', 'whoosh'),
    say('fairy', 'Ay, ay. Pero el gato sigue *on the sofa*, encima del sofá. ¡Lo veo!', 'talk'),
  ]),
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('fairy', 'happy', 'right')], [
    say('companion', 'Yo busco y digo: *It\'s in the box.* ¡El juguete está en la caja!', 'cheer'),
    narrate('{child} señala cada cosa con su frase: *in*, *on* y *under*. Los muebles vuelven a su sitio.', 'sparkle'),
    say('borron', 'Me rindo. ¡Nunca encuentro nada en esta casa!', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate6 = story('isla-6-rescate', '¡{pet} sale del hueco!', [
  scene('cave', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'stuck'), cast('fairy', 'cheer', 'right')], [
    say('fairy', '*Well done, {child}!* Has dicho dónde está cada cosa. Eso es un buen escondite.', 'cheer'),
    narrate('Las rocas se separan despacio, y {pet} sale con una sonrisa de oreja a oreja.', 'rescue'),
  ]),
  scene('cave', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('fairy', 'happy', 'right')], [
    say('companion', '¡Qué alivio! *Thank you*, {child}. Ahora quiero aprender el cuerpo y el tiempo.', 'cheer'),
    narrate('La casa del escondite se ilumina. Cada mueble tiene su sitio, y el gato duerme *on the sofa*, encima del sofá.', 'sparkle'),
    say('lumi', 'Di dónde está cada cosa: *in*, *on* o *under*. ¡Qué fácil!', 'happy'),
    say('fairy', 'Sube al Monte del Cuerpo y del Tiempo. Allí Chispa te enseñará a describirte.', 'talk'),
  ]),
])

// 7 · El Monte del Cuerpo y del Tiempo (Chispa)
export const islaLlegada7 = story('isla-7-llegada', 'Cuerpo y tiempo', [
  scene('volcano', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('dragon', 'talk', 'right')], [
    narrate('Chispa es un dragón pequeño y muy simpático. Escupe pompas de colores, no fuego.'),
    say('dragon', '*Hello!* Soy Chispa. *I\'ve got two hands*: tengo dos manos. ¿Y tú, {child}?', 'talk'),
    say('lumi', 'Di *I\'ve got*, «tengo», y luego la parte: *a nose*, *two eyes*, *a big head*.', 'happy'),
  ]),
  scene('volcano', [cast('lumi', 'talk', 'left'), cast('companion', 'scared', 'center', 'ice'), cast('dragon', 'worried', 'right')], [
    narrate('Una nube de frío envuelve a {pet}. ¡Hace muchísimo frío en el monte!', 'pop'),
    say('dragon', 'Pregunta cómo hace el tiempo: *What\'s the weather like?* Y responde: *It\'s sunny*, *It\'s rainy* o *It\'s cold*.', 'worried'),
    say('companion', 'Hace *cold*, muy *cold*. ¡Chispa, saca el sol!', 'sad'),
  ]),
])

export const islaMitad7 = story('isla-7-mitad', 'Borrón cambia el tiempo', [
  scene('volcano', [cast('lumi', 'idle', 'left'), cast('dragon', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Cambio el tiempo: ahora llueve en verano y hace frío en primavera.', 'happy'),
    narrate('Borrón sopla, y las nubes tapan el sol. Los árboles tiemblan y las flores se encogen.', 'whoosh'),
    say('dragon', 'Eso no vale, Borrón. *It\'s sunny* en verano y *It\'s cold* en invierno.', 'talk'),
  ]),
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('dragon', 'happy', 'right')], [
    say('companion', '¡Yo digo *It\'s windy* y el viento se va! ¿Y tú, {child}?', 'cheer'),
    narrate('{child} responde con el tiempo de hoy, en inglés. Las nubes se aparten y el sol vuelve.', 'sparkle'),
    say('borron', '¡Ay, me derrito! Mejor me voy a un monte más frío.', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate7 = story('isla-7-rescate', '¡{pet} entra en calor!', [
  scene('volcano', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'ice'), cast('dragon', 'cheer', 'right')], [
    say('dragon', '*Well done, {child}!* Dices el tiempo y tu cuerpo, todo en inglés.', 'cheer'),
    narrate('El hielo se derrite con un chasquido, y {pet} se sacude como un perro mojado.', 'rescue'),
  ]),
  scene('volcano', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('dragon', 'happy', 'right')], [
    say('companion', 'Ahora tengo *two hands* y *two legs*. ¡Qué bien!', 'cheer'),
    narrate('El monte se calienta y las flores se abren. Chispa da palmadas con sus alas pequeñitas.', 'sparkle'),
    say('lumi', 'Dime el tiempo de hoy, {child}: *It\'s sunny* o *It\'s cloudy*. Y tu cuerpo: *I\'ve got two hands*.', 'happy'),
    say('dragon', 'Ve al último castillo, el de los días. La Reina Aurora te espera con su calendario.', 'talk'),
  ]),
])

// 8 · El Castillo de los Días (la Reina Aurora)
export const islaLlegada8 = story('isla-8-llegada', 'El castillo de los días', [
  scene('castle', [cast('lumi', 'idle', 'left'), cast('companion', 'happy', 'center'), cast('queen', 'talk', 'right')], [
    narrate('El castillo tiene siete torres, y cada torre es un día de la semana. ¡Qué bonito calendario!'),
    say('queen', '*Hello!* Soy la Reina Aurora. *What day is it today?* ¿Qué día es hoy?', 'talk'),
    say('lumi', 'Responde: *It\'s Monday*, es lunes. Y *Today is…* sirve para decir qué día es.', 'happy'),
  ]),
  scene('castle', [cast('lumi', 'talk', 'left'), cast('companion', 'worried', 'center', 'bubble'), cast('queen', 'worried', 'right')], [
    narrate('Una burbuja de niebla se lleva a {pet} hasta la torre del domingo. ¡Qué altura!', 'whoosh'),
    say('queen', 'Para bajarle, di el día y el mes: *January*, *February*, *March*… y los días de la semana.', 'talk'),
    say('companion', 'Yo sé *Monday* y *Tuesday*. ¿Y *Sunday*? ¡Es el último!', 'worried'),
  ]),
])

export const islaMitad8 = story('isla-8-mitad', 'Borrón rompe el calendario', [
  scene('castle', [cast('lumi', 'idle', 'left'), cast('queen', 'talk', 'center'), cast('borron', 'happy', 'right')], [
    say('borron', '¡Ji, ji! Rompo el calendario y los días se caen de las torres.', 'happy'),
    narrate('Borrón sopla, y el lunes va al miércoles, el jueves se sube al tejado y el domingo se pierde en el mar.', 'whoosh'),
    say('queen', 'Ay, ay. Pero el orden de los días no se cambia. *Monday*, *Tuesday*, *Wednesday*…', 'talk'),
  ]),
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'cheer', 'center'), cast('queen', 'happy', 'right')], [
    say('companion', '¡Yo pongo cada día en su torre! *Thursday*, *Friday*, *Saturday*.', 'cheer'),
    narrate('{child} dice el día de hoy y el mes, y el calendario vuelve a estar en orden.', 'sparkle'),
    say('borron', 'Qué lío. ¡Adiós, castillo! ¡Adiós, calendario!', 'surprised', 'whoosh'),
  ]),
])

export const islaRescate8 = story('isla-8-rescate', '¡{pet} vuelve a casa!', [
  scene('castle', [cast('lumi', 'happy', 'left'), cast('companion', 'surprised', 'center', 'bubble'), cast('queen', 'cheer', 'right')], [
    say('queen', '*Well done, {child}!* Conoces todos los días. ¡Eres una gran exploradora de la isla!', 'cheer'),
    narrate('La burbuja se abre como una flor, y {pet} cae sobre una alfombra de estrellas.', 'rescue'),
  ]),
  scene('castle', [cast('lumi', 'cheer', 'left'), cast('companion', 'happy', 'center'), cast('queen', 'happy', 'right')], [
    narrate('El castillo entero canta los días: *Monday*, *Tuesday*, *Wednesday*, *Thursday*, *Friday*, *Saturday* y *Sunday*.', 'sparkle'),
    say('lumi', 'Ya sabes todos los días, {child}. ¡Ahora sí que eres una gran exploradora de la isla!', 'happy'),
    say('companion', '¡Lo has conseguido, {child}! *Goodbye*, isla. *Thank you*, Reina Aurora.', 'cheer'),
    say('queen', 'Aquí tienes el cristal celeste de la Isla de las Palabras. ¡Brilla como tu inglés!', 'happy', 'crystal'),
  ]),
])

export const ISLAND_STORIES = [
  islaLlegada1, islaMitad1, islaRescate1,
  islaLlegada2, islaMitad2, islaRescate2,
  islaLlegada3, islaMitad3, islaRescate3,
  islaLlegada4, islaMitad4, islaRescate4,
  islaLlegada5, islaMitad5, islaRescate5,
  islaLlegada6, islaMitad6, islaRescate6,
  islaLlegada7, islaMitad7, islaRescate7,
  islaLlegada8, islaMitad8, islaRescate8,
]
