/* Clases de geometría de 3.º de Primaria: una por tema del bloque «geometría» del temario (src/content/syllabus/grade3.ts).
   Mismo formato que las demás: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una
   frase que resume la regla. Las prácticas usan solo habilidades de su propio tema (src/engine/geometry.ts y
   src/engine/position.ts), y su texto sirve para todas las variantes del generador: cualquier polígono, cualquier recta, los
   tres ángulos y los seis cuerpos. Las prácticas llevan una tarjeta de texto y no un dibujo: el ejercicio ya pinta su propia
   figura, y un dibujo fijo podría dar la respuesta. Los dibujos de la explicación son los de src/activities/lesson/visuals/geometry.tsx,
   con las mismas figuras que los ejercicios. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Polígonos: un polígono es una figura cerrada con lados rectos; el nombre depende de cuántos lados tiene. */
const poligonos = clase({
  id: 'c3-geo-poligonos',
  topicId: 'poligonos',
  title: 'Polígonos: lados y esquinas',
  para: [
    show('polygon', { sides: 3, mark: 'sides' }, 'Un polígono es una figura cerrada con lados rectos. Aquí los números marcan sus lados.', 'frog'),
    show('polygon', { sides: 4, mark: 'corners' }, 'Cada esquina es un punto donde se juntan dos lados. Aquí los números marcan las esquinas.', 'ladybug'),
  ],
  ejemplo: [
    show('polygon', { sides: 3, mark: 'sides' }, 'Este polígono tiene 3 lados y 3 esquinas: es un triángulo.'),
    show('polygon', { sides: 4, mark: 'sides' }, 'Con 4 lados es un cuadrilátero. Si tiene 4 esquinas rectas y los 4 lados iguales, es un cuadrado. Si tiene 4 esquinas rectas y dos lados más largos, es un rectángulo. Un rombo tiene 4 lados iguales, pero no tiene esquinas rectas.'),
    show('polygon', { sides: 5, mark: 'sides' }, 'Este tiene 5 lados y 5 esquinas: es un pentágono.'),
    show('polygon', { sides: 6, mark: 'corners' }, 'Este tiene 6 lados y 6 esquinas: es un hexágono.'),
    show('polygon', { sides: 7, mark: 'sides' }, 'Con 7 lados es un heptágono.'),
    show('polygon', { sides: 8, mark: 'sides' }, 'Con 8 lados es un octógono.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'nombre · lados' }, '¡Te toca! Cuenta los lados uno a uno, tocándolos con el dedo, antes de elegir el nombre.', { skills: ['geo:poly:name'] }),
    tryIt('big-text', { text: 'lados · esquinas' }, '¡Otra! Cuenta lados o esquinas: son el mismo número. Cuenta con calma, sin saltarte ninguno.', { skills: ['geo:poly:sides'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'nombre · lados' }, '¡Tu turno! Cuenta los lados y mira si son todos iguales o no.', { skills: ['geo:poly:name'] }),
    tryIt('big-text', { text: 'lados · esquinas' }, '¡Tu turno! Te preguntan por los lados o por las esquinas: cuenta una vez y ya tienes la respuesta.', { skills: ['geo:poly:sides'] }),
    tryIt('big-text', { text: 'cuenta una vez' }, '¡Tu turno! Cuenta cada lado una sola vez, y después mira qué nombre tiene ese número de lados.', { skills: ['geo:poly:name', 'geo:poly:sides'] }),
    tryIt('big-text', { text: 'nombre de la figura' }, '¡Tu turno! Cuenta los lados con calma y recuerda el nombre que tiene ese número de lados.', { skills: ['geo:poly:name'] }),
  ],
  cierre: show('big-text', { text: '3 lados: triángulo · 4 lados: cuadrilátero', sub: '5 lados: pentágono · 6 lados: hexágono' }, 'La regla: el nombre depende de cuántos lados tiene. Con 7 lados es un heptágono, y con 8, un octógono.'),
})

/* Rectas: la recta va derecha y no tiene fin; la curva se dobla sin esquinas; la poligonal tiene esquinas. Dos rectas son
   paralelas si nunca se cruzan, y perpendiculares si se cruzan formando esquinas rectas. */
const rectas = clase({
  id: 'c3-geo-rectas',
  topicId: 'rectas',
  title: 'Rectas, curvas, paralelas y perpendiculares',
  para: [
    show('lines', { kind: 'recta' }, 'Una recta va derecha y no tiene fin: se alarga sin parar por los dos lados. Por eso tiene flechas en los dos extremos.', 'frog'),
    show('lines', { kind: 'curva' }, 'Una curva se dobla, pero no tiene esquinas.', 'ladybug'),
  ],
  ejemplo: [
    show('lines', { kind: 'poligonal' }, 'Esta línea tiene esquinas: está hecha de trozos rectos unidos. Es una línea poligonal.'),
    show('lines', { kind: 'paralelas' }, 'Dos rectas paralelas van siempre a la misma distancia: nunca se cruzan, aunque se alarguen sin fin.'),
    show('lines', { kind: 'perpendiculares' }, 'Dos rectas perpendiculares se cruzan formando esquinas rectas, como una cruz de sumar.'),
    show('big-text', { text: 'Se cruzan, pero no en esquina recta' }, 'Si dos rectas se cruzan de otra forma, no son perpendiculares.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'recta · curva · poligonal' }, '¡Te toca! Mira si la línea va derecha, si se dobla sin esquinas o si tiene esquinas.', { skills: ['geo:line:type'] }),
    tryIt('big-text', { text: 'paralelas · perpendiculares · se cruzan' }, '¡Otra! Imagina que las dos rectas se alargan sin fin: ¿llegan a tocarse en algún punto?', { skills: ['geo:line:rel'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'recta · curva · poligonal' }, '¡Tu turno! Mira si la línea tiene esquinas. Si no las tiene, mira si va derecha.', { skills: ['geo:line:type'] }),
    tryIt('big-text', { text: 'paralelas · perpendiculares · se cruzan' }, '¡Tu turno! Fíjate si las dos rectas se tocan, y si la cruz que forman tiene esquinas rectas.', { skills: ['geo:line:rel'] }),
    tryIt('big-text', { text: 'tipo de línea · cómo están' }, '¡Tu turno! Primero mira qué tipo de línea es, y después cómo están las dos rectas.', { skills: ['geo:line:type', 'geo:line:rel'] }),
    tryIt('big-text', { text: 'paralelas · perpendiculares · se cruzan' }, '¡Tu turno! Piensa en las dos rectas alargadas sin fin: mira si se tocan y cómo se cruzan.', { skills: ['geo:line:rel'] }),
  ],
  cierre: show('lines', { kind: 'perpendiculares' }, 'La regla: las paralelas no se cruzan nunca. Las perpendiculares se cruzan formando esquinas rectas, como una cruz.'),
})

/* Rectas, semirrectas y segmentos: el punto marca dónde se acaba la línea, y la flecha dice que sigue sin fin. */
const rectasSegmentos = clase({
  id: 'c3-geo-rectas-segmentos',
  topicId: 'rectas-segmentos',
  title: 'Rectas, semirrectas y segmentos',
  para: [
    show('lines', { kind: 'segmento' }, 'Un segmento tiene dos extremos, cada uno con un punto. Se acaba en los dos lados.', 'frog'),
    show('lines', { kind: 'semirrecta' }, 'Una semirrecta empieza en un punto y sigue sin fin por el otro lado. Por eso tiene un punto y una flecha.', 'ladybug'),
  ],
  ejemplo: [
    show('lines', { kind: 'recta' }, 'Una recta no tiene principio ni fin: tiene una flecha en cada extremo.'),
    show('big-text', { text: 'Dos puntos: segmento' }, 'Un trozo de regla entre dos marcas es un segmento: se acaba en los dos puntos.'),
    show('big-text', { text: 'Un punto y una flecha: semirrecta' }, 'Una línea que empieza en un punto y sigue sin fin es una semirrecta.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Te toca! Mira los dos extremos de la línea: ¿acaban en un punto, en una flecha o en las dos cosas?', { skills: ['geo:line:kind'] }),
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Otra! Un punto marca dónde se acaba la línea; una flecha dice que sigue sin fin por ese lado.', { skills: ['geo:line:kind'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Tu turno! Cuenta los extremos y mira qué tiene cada uno: punto o flecha.', { skills: ['geo:line:kind'] }),
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Tu turno! Piensa si la línea tiene principio y fin, o si sigue sin fin por un lado o por los dos.', { skills: ['geo:line:kind'] }),
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Tu turno! Mira la línea entera, con sus dos extremos, y decide.', { skills: ['geo:line:kind'] }),
    tryIt('big-text', { text: 'recta · semirrecta · segmento' }, '¡Tu turno! Mira con calma los dos extremos, sin fijarte solo en el medio de la línea.', { skills: ['geo:line:kind'] }),
  ],
  cierre: show('big-text', { text: 'Segmento: dos puntos', sub: 'Semirrecta: un punto y una flecha · Recta: dos flechas' }, 'La regla: el segmento se acaba en dos puntos; la semirrecta, en un punto, y la recta sigue sin fin por los dos lados.'),
})

/* Ángulos rectos: la esquina de una hoja de papel, de 90 grados. Se compara cada ángulo con esa esquina. */
const angulosRectos = clase({
  id: 'c3-geo-angulos-rectos',
  topicId: 'angulos-rectos',
  title: 'Ángulos rectos',
  para: [
    show('angle', { deg: 90 }, 'Un ángulo recto es como la esquina de una hoja de papel: mide 90 grados.', 'frog'),
    show('angle', { deg: 45 }, 'Este ángulo se abre menos que la esquina del papel: no es recto.', 'ladybug'),
  ],
  ejemplo: [
    show('angle', { deg: 90 }, 'Las esquinas de un libro, de una mesa o de una puerta suelen ser ángulos rectos.'),
    show('big-text', { text: 'Encaja justo en la esquina del papel' }, 'Para saber si un ángulo es recto, pon la esquina del papel encima: si encaja justo, sin que sobre ni falte, es recto.'),
    show('angle', { deg: 120 }, 'Este se abre más que la esquina del papel: es mayor que un recto.'),
    show('angle', { deg: 40 }, 'Este se abre menos que la esquina del papel: es menor que un recto.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'recto · menor · mayor' }, '¡Te toca! Pon la esquina del papel sobre el ángulo: ¿encaja justo, se abre más o se abre menos?', { skills: ['geo:angle:type'] }),
    tryIt('big-text', { text: 'toca las esquinas rectas' }, '¡Otra! Toca solo las esquinas que encajan justo en la esquina de un papel. Si ninguna encaja, no toques nada.', { skills: ['geo:angle:tap'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'recto · menor · mayor' }, '¡Tu turno! Compara el ángulo con la esquina del papel, y di si se abre igual, más o menos.', { skills: ['geo:angle:type'] }),
    tryIt('big-text', { text: 'toca las esquinas rectas' }, '¡Tu turno! Mira cada esquina por separado: ¿encaja justo, sin que sobre ni falte? Si ninguna encaja, no toques nada.', { skills: ['geo:angle:tap'] }),
    tryIt('big-text', { text: 'recto · menor · mayor' }, '¡Tu turno! No te fíes de cómo se ve: compara con la esquina del papel, que es siempre igual.', { skills: ['geo:angle:type'] }),
    tryIt('big-text', { text: 'la figura o el ángulo' }, '¡Tu turno! Mira la figura o el ángulo que te enseñan, y compáralo con la esquina del papel.', { skills: ['geo:angle:type', 'geo:angle:tap'] }),
  ],
  cierre: show('angle', { deg: 90 }, 'La regla: el ángulo recto es la esquina del papel, y mide 90 grados. Si se abre menos, es menor que un recto; si se abre más, es mayor.'),
})

/* Ángulos agudos y obtusos: el agudo se abre menos que el recto (menos de 90 grados); el obtuso, más (más de 90 grados). */
const angulosClase = clase({
  id: 'c3-geo-angulos-clase',
  topicId: 'angulos-clase',
  title: 'Ángulos agudos y obtusos',
  para: [
    show('angle', { deg: 45 }, 'Un ángulo agudo se abre menos que la esquina del papel: menos de 90 grados.', 'frog'),
    show('angle', { deg: 135 }, 'Un ángulo obtuso se abre más que la esquina del papel: más de 90 grados.', 'ladybug'),
  ],
  ejemplo: [
    show('angle', { deg: 90 }, 'El recto es justo la esquina del papel: 90 grados.'),
    show('angle', { deg: 60 }, 'Este ángulo se abre menos que el recto: es agudo.'),
    show('angle', { deg: 120 }, 'Este se abre más que el recto: es obtuso.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Te toca! Compara el ángulo con la esquina del papel: ¿encaja justo, se abre más o se abre menos?', { skills: ['geo:angle:class'] }),
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Otra! Piensa en cuántos grados se abre: menos de 90, justo 90 o más de 90.', { skills: ['geo:angle:class'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Tu turno! Mira si el ángulo se abre menos que la esquina del papel, igual o más.', { skills: ['geo:angle:class'] }),
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Tu turno! Piensa si se abre más o menos que la esquina del papel, y después dilo.', { skills: ['geo:angle:class'] }),
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Tu turno! Una esquina de papel es el recto: compara el ángulo con ella.', { skills: ['geo:angle:class'] }),
    tryIt('big-text', { text: 'agudo · recto · obtuso' }, '¡Tu turno! Decide si el ángulo es agudo, recto u obtuso: compara con la esquina del papel, con calma.', { skills: ['geo:angle:class'] }),
  ],
  cierre: show('angle', { deg: 120 }, 'La regla: los ángulos de menos de 90 grados son agudos. El de 90 grados es recto, y los de más de 90 grados, obtusos.'),
})

/* Círculo, circunferencia y cuerpos: la circunferencia es la línea que rodea; el círculo es toda la figura. Rueda lo que
   tiene una parte redonda. Las caras planas se cuentan en el cubo, el prisma y la pirámide. */
const circuloCuerpos = clase({
  id: 'c3-geo-circulo-cuerpos',
  topicId: 'circulo-cuerpos',
  title: 'Círculo, circunferencia y cuerpos',
  para: [
    show('big-text', { text: 'Circunferencia: solo la línea', sub: 'Círculo: la línea y todo lo de dentro' }, 'La circunferencia es la línea que rodea una figura, como el aro de una rueda. El círculo es toda la figura, con lo de dentro pintado.', 'frog'),
    show('solid', { name: 'esfera' }, 'Una esfera es como una pelota: no tiene caras planas y rueda en todas direcciones.', 'ladybug'),
  ],
  ejemplo: [
    show('solid', { name: 'cubo' }, 'Un cubo tiene 6 caras planas, todas cuadradas. No rueda: se queda quieto sobre la mesa.'),
    show('solid', { name: 'prisma' }, 'Este prisma tiene la base triangular: 2 caras triangulares y 3 caras de lado. Son 5 caras planas. No rueda.'),
    show('solid', { name: 'piramide' }, 'Una pirámide tiene una base y caras triangulares que llegan a una punta. Tiene 5 caras planas y no rueda.'),
    show('solid', { name: 'cilindro' }, 'Un cilindro tiene dos tapas redondas y una parte curva. Como una lata, rueda.'),
    show('solid', { name: 'cono' }, 'Un cono tiene una base redonda y una punta. También rueda.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'caras planas · partes redondas' }, '¡Te toca! Mira si tiene caras planas, partes redondas o las dos cosas.', { skills: ['geo:solid:name'] }),
    tryIt('big-text', { text: 'rueda · no rueda' }, '¡Otra! Imagina que lo pones en una mesa inclinada: ¿se queda quieto o se va rodando?', { skills: ['geo:solid:roll'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'caras planas · partes redondas' }, '¡Tu turno! Mira las caras: si todas son planas, si hay partes redondas, o si hay una punta.', { skills: ['geo:solid:name'] }),
    tryIt('big-text', { text: 'rueda · no rueda' }, '¡Tu turno! Imagina que lo empujas: mira si tiene partes redondas por donde se desliza.', { skills: ['geo:solid:roll'] }),
    tryIt('big-text', { text: 'caras planas' }, '¡Tu turno! Cuenta las caras planas una a una: la de arriba, la de abajo y las de los lados.', { skills: ['geo:solid:faces'] }),
    tryIt('big-text', { text: 'círculo · circunferencia' }, '¡Tu turno! Mira si la figura solo tiene la línea del borde o si está pintada por dentro.', { skills: ['geo:circle'] }),
  ],
  cierre: show('big-text', { text: 'Ruedan: esfera, cilindro y cono', sub: 'No ruedan: cubo, prisma y pirámide' }, 'La regla: la esfera, el cilindro y el cono ruedan, porque tienen una parte redonda. El cubo, el prisma y la pirámide no ruedan: solo tienen caras planas.'),
})

/* Perímetro: el contorno de una figura es la suma de todos sus lados. */
const perimetro = clase({
  id: 'c3-geo-perimetro',
  topicId: 'perimetro',
  title: 'Perímetro: sumar los lados',
  para: [
    show('perimeter', { sides: '3,4,3,4' }, 'El perímetro es el contorno de una figura: el camino que da la vuelta entera por sus lados.', 'frog'),
    show('big-text', { text: 'Suma la medida de todos los lados' }, 'Para medirlo, suma la medida de cada lado, uno a uno.', 'ladybug'),
  ],
  ejemplo: [
    show('perimeter', { sides: '3,4,3,4' }, 'Este rectángulo tiene dos lados de 3 cm y dos de 4 cm. Suma los cuatro: 3 + 4 + 3 + 4 = 14 cm.'),
    show('perimeter', { sides: '3,4,5' }, 'Este triángulo tiene lados de 3, 4 y 5 cm. Su perímetro: 3 + 4 + 5 = 12 cm.'),
    show('perimeter', { sides: '2,2,2,2,2' }, 'Este polígono de 5 lados mide 2 cm en cada lado: 2 + 2 + 2 + 2 + 2 = 10 cm.'),
    show('big-text', { text: 'No te dejes ningún lado' }, 'Si te dejas un lado, la suma sale mal. Cuenta cada lado una sola vez.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'suma los lados' }, '¡Te toca! Pon el dedo en una esquina y ve sumando los lados, uno a uno, hasta volver al principio.', { skills: ['geo:perimeter'] }),
    tryIt('big-text', { text: 'suma los lados' }, '¡Otra! Cuenta todos los lados, y no te saltes ninguno.', { skills: ['geo:perimeter'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'suma los lados' }, '¡Tu turno! Lee la medida de cada lado y súmalas todas.', { skills: ['geo:perimeter'] }),
    tryIt('big-text', { text: 'la unidad que te piden' }, '¡Tu turno! Mira en qué unidad te piden el contorno, y escribe la suma en esa unidad.', { skills: ['geo:perimeter'] }),
    tryIt('big-text', { text: 'suma los lados' }, '¡Tu turno! Lee bien la historia o la figura: suma todos sus lados, y no olvides ninguno.', { skills: ['geo:perimeter'] }),
    tryIt('big-text', { text: 'el jardín' }, '¡Tu turno! Si te cuentan un jardín con forma de rectángulo, tiene dos lados largos y dos anchos.', { skills: ['geo:perimeter'] }),
  ],
  cierre: show('perimeter', { sides: '3,4,3,4' }, 'La regla: el perímetro es la suma de todos los lados. Aquí: 3 + 4 + 3 + 4 = 14 cm.'),
})

/* Recorridos: la casilla dorada es la salida; cada flecha (← → ↑ ↓) es una casilla en esa dirección. Izquierda y derecha,
   como se ve la cuadrícula. Un grupo de flechas iguales es un movimiento: →→ son dos casillas a la derecha. */
const recorridos = clase({
  id: 'c3-geo-recorridos',
  topicId: 'recorridos',
  title: 'Recorridos en una cuadrícula',
  para: [
    show('grid-route', { route: 'R,R,U' }, 'Esta cuadrícula es un tablero de casillas. La casilla dorada es la salida: desde ella empiezas a caminar.', 'frog'),
    show('grid-route', { route: 'D,D,L' }, 'Las flechas son los pasos: → a la derecha, ← a la izquierda, ↑ hacia arriba y ↓ hacia abajo. Cada flecha mueve una casilla.', 'ladybug'),
  ],
  ejemplo: [
    show('grid-route', { route: 'R,R,D,D' }, 'Las flechas →→ son 2 casillas a la derecha, y ↓↓ son 2 casillas hacia abajo. En total, cuatro casillas.'),
    show('grid-route', { route: 'L,U,U' }, 'Ahora ← es 1 casilla a la izquierda, y ↑↑ son 2 casillas hacia arriba. Tres flechas en total.'),
    show('grid-route', { route: 'U,R,R,R' }, 'Un recorrido puede subir y luego ir a la derecha: ↑ es 1 casilla, y →→→ son 3 casillas a la derecha.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'casilla dorada · flechas' }, '¡Te toca! Lee la pregunta: en qué cosa empiezas, y pon el dedo en su casilla dorada.', { skills: ['pos:route'] }),
    tryIt('big-text', { text: 'casillas de cada flecha' }, '¡Otra! Cada flecha es una casilla: cuenta las flechas de cada grupo antes de moverte.', { skills: ['pos:route'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'casilla dorada · flechas' }, '¡Tu turno! Empieza en la casilla dorada y mueve el dedo casilla a casilla, siguiendo las flechas.', { skills: ['pos:route'] }),
    tryIt('big-text', { text: 'primera flecha · segunda flecha' }, '¡Tu turno! Mira la primera flecha: ¿hacia qué lado va? Después, la segunda.', { skills: ['pos:route'] }),
    tryIt('big-text', { text: 'la casilla de llegada' }, '¡Tu turno! Cuando acabes la última flecha, mira qué hay en la casilla donde está tu dedo.', { skills: ['pos:route'] }),
    tryIt('big-text', { text: 'casillas de cada flecha' }, '¡Tu turno! Cuenta bien cuántas casillas indica cada grupo de flechas antes de moverte.', { skills: ['pos:route'] }),
  ],
  cierre: show('grid-route', { route: 'R,R,U,U,L' }, 'La regla: sigue las flechas en su orden, una casilla por flecha. → es a la derecha y ← a la izquierda, como tú ves la cuadrícula.'),
})

/** The geometry classes (3.º): one per geometry topic of the temario. */
export const GEOMETRIA_CLASSES: ClassDef[] = [poligonos, rectas, rectasSegmentos, angulosRectos, angulosClase, circuloCuerpos, perimetro, recorridos]
