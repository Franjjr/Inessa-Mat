/* Banco de palabras y frases de la gramática de 3.º (src/engine/lengua/grammar.ts). Vocabulario de 3.º: animales,
   aventuras, colegio y casa. Plurales regulares (vocal + s, consonante + es) y femeninos con el cambio de la -o final por -a.
   Verbos regulares en 3.ª persona del singular: presente, pretérito perfecto simple (pasado) y futuro simple.
   Cada forma tiene una sola clase: `wordClass` lo comprueba en las pruebas. Las frases se leen sin signos y se
   clasifican por búsqueda en estas listas; las palabras que no están en ellas son «otra» (preposiciones, adverbios). */

export type Tense = 'presente' | 'pasado' | 'futuro'
export type WordClass = 'articulo' | 'sustantivo' | 'adjetivo' | 'verbo' | 'otra'

/** A noun with its gender and its regular plural. `f` is the feminine of a pair (gato → gata). */
export interface Noun { sg: string; pl: string; g: 'm' | 'f'; f?: { sg: string; pl: string } }
/** An adjective: masculine and feminine, singular and plural. Adjectives in -e have the same feminine. */
export interface Adjective { m: string; f: string; mPl: string; fPl: string }
/** A regular verb: the 3.ª persona del singular in the three tenses. */
export interface Verb { inf: string; pres: string; pas: string; fut: string }
/** A sentence without its final punctuation. `subject` = how many of its first words are the subject. */
export interface Sentence { words: string[]; subject: number; tense: Tense }

export const ARTICLES = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'] as const

export const NOUNS: Noun[] = [
  // animales
  { sg: 'gato', pl: 'gatos', g: 'm', f: { sg: 'gata', pl: 'gatas' } },
  { sg: 'perro', pl: 'perros', g: 'm', f: { sg: 'perra', pl: 'perras' } },
  { sg: 'pato', pl: 'patos', g: 'm', f: { sg: 'pata', pl: 'patas' } },
  { sg: 'conejo', pl: 'conejos', g: 'm', f: { sg: 'coneja', pl: 'conejas' } },
  { sg: 'caballo', pl: 'caballos', g: 'm' },
  { sg: 'gallo', pl: 'gallos', g: 'm' },
  { sg: 'oso', pl: 'osos', g: 'm' },
  { sg: 'lobo', pl: 'lobos', g: 'm' },
  { sg: 'zorro', pl: 'zorros', g: 'm' },
  { sg: 'erizo', pl: 'erizos', g: 'm' },
  { sg: 'cangrejo', pl: 'cangrejos', g: 'm' },
  { sg: 'caracol', pl: 'caracoles', g: 'm' },
  { sg: 'pulpo', pl: 'pulpos', g: 'm' },
  { sg: 'elefante', pl: 'elefantes', g: 'm' },
  { sg: 'pájaro', pl: 'pájaros', g: 'm' },
  { sg: 'mariposa', pl: 'mariposas', g: 'f' },
  { sg: 'abeja', pl: 'abejas', g: 'f' },
  { sg: 'hormiga', pl: 'hormigas', g: 'f' },
  { sg: 'rana', pl: 'ranas', g: 'f' },
  { sg: 'tortuga', pl: 'tortugas', g: 'f' },
  { sg: 'vaca', pl: 'vacas', g: 'f' },
  { sg: 'oveja', pl: 'ovejas', g: 'f' },
  { sg: 'gallina', pl: 'gallinas', g: 'f' },
  { sg: 'ballena', pl: 'ballenas', g: 'f' },
  { sg: 'ardilla', pl: 'ardillas', g: 'f' },
  { sg: 'cabra', pl: 'cabras', g: 'f' },
  { sg: 'serpiente', pl: 'serpientes', g: 'f' },
  { sg: 'jirafa', pl: 'jirafas', g: 'f' },
  // personas de la familia y amigos
  { sg: 'niño', pl: 'niños', g: 'm', f: { sg: 'niña', pl: 'niñas' } },
  { sg: 'abuelo', pl: 'abuelos', g: 'm', f: { sg: 'abuela', pl: 'abuelas' } },
  { sg: 'hermano', pl: 'hermanos', g: 'm', f: { sg: 'hermana', pl: 'hermanas' } },
  { sg: 'amigo', pl: 'amigos', g: 'm', f: { sg: 'amiga', pl: 'amigas' } },
  { sg: 'vecino', pl: 'vecinos', g: 'm', f: { sg: 'vecina', pl: 'vecinas' } },
  { sg: 'capitán', pl: 'capitanes', g: 'm' },
  { sg: 'madre', pl: 'madres', g: 'f' },
  { sg: 'padre', pl: 'padres', g: 'm' },
  // colegio y casa
  { sg: 'cuaderno', pl: 'cuadernos', g: 'm' },
  { sg: 'libro', pl: 'libros', g: 'm' },
  { sg: 'estuche', pl: 'estuches', g: 'm' },
  { sg: 'pupitre', pl: 'pupitres', g: 'm' },
  { sg: 'cuento', pl: 'cuentos', g: 'm' },
  { sg: 'color', pl: 'colores', g: 'm' },
  { sg: 'reloj', pl: 'relojes', g: 'm' },
  { sg: 'mes', pl: 'meses', g: 'm' },
  { sg: 'casa', pl: 'casas', g: 'f' },
  { sg: 'mesa', pl: 'mesas', g: 'f' },
  { sg: 'silla', pl: 'sillas', g: 'f' },
  { sg: 'puerta', pl: 'puertas', g: 'f' },
  { sg: 'ventana', pl: 'ventanas', g: 'f' },
  { sg: 'cama', pl: 'camas', g: 'f' },
  { sg: 'cocina', pl: 'cocinas', g: 'f' },
  { sg: 'lámpara', pl: 'lámparas', g: 'f' },
  { sg: 'mochila', pl: 'mochilas', g: 'f' },
  { sg: 'pizarra', pl: 'pizarras', g: 'f' },
  { sg: 'goma', pl: 'gomas', g: 'f' },
  { sg: 'regla', pl: 'reglas', g: 'f' },
  { sg: 'escuela', pl: 'escuelas', g: 'f' },
  { sg: 'clase', pl: 'clases', g: 'f' },
  { sg: 'palabra', pl: 'palabras', g: 'f' },
  { sg: 'carta', pl: 'cartas', g: 'f' },
  { sg: 'historia', pl: 'historias', g: 'f' },
  { sg: 'canción', pl: 'canciones', g: 'f' },
  { sg: 'fiesta', pl: 'fiestas', g: 'f' },
  { sg: 'leche', pl: 'leches', g: 'f' },
  { sg: 'sopa', pl: 'sopas', g: 'f' },
  { sg: 'fruta', pl: 'frutas', g: 'f' },
  { sg: 'manzana', pl: 'manzanas', g: 'f' },
  { sg: 'naranja', pl: 'naranjas', g: 'f' },
  { sg: 'tarta', pl: 'tartas', g: 'f' },
  { sg: 'galleta', pl: 'galletas', g: 'f' },
  { sg: 'huevo', pl: 'huevos', g: 'm' },
  { sg: 'queso', pl: 'quesos', g: 'm' },
  { sg: 'pescado', pl: 'pescados', g: 'm' },
  { sg: 'pan', pl: 'panes', g: 'm' },
  { sg: 'jardín', pl: 'jardines', g: 'm' },
  { sg: 'valla', pl: 'vallas', g: 'f' },
  // naturaleza, aventuras y lugares
  { sg: 'árbol', pl: 'árboles', g: 'm' },
  { sg: 'bosque', pl: 'bosques', g: 'm' },
  { sg: 'río', pl: 'ríos', g: 'm' },
  { sg: 'mar', pl: 'mares', g: 'm' },
  { sg: 'sol', pl: 'soles', g: 'm' },
  { sg: 'lago', pl: 'lagos', g: 'm' },
  { sg: 'puerto', pl: 'puertos', g: 'm' },
  { sg: 'campo', pl: 'campos', g: 'm' },
  { sg: 'mapa', pl: 'mapas', g: 'm' },
  { sg: 'tesoro', pl: 'tesoros', g: 'm' },
  { sg: 'barco', pl: 'barcos', g: 'm' },
  { sg: 'puente', pl: 'puentes', g: 'm' },
  { sg: 'castillo', pl: 'castillos', g: 'm' },
  { sg: 'camino', pl: 'caminos', g: 'm' },
  { sg: 'tren', pl: 'trenes', g: 'm' },
  { sg: 'flor', pl: 'flores', g: 'f' },
  { sg: 'hoja', pl: 'hojas', g: 'f' },
  { sg: 'piedra', pl: 'piedras', g: 'f' },
  { sg: 'cueva', pl: 'cuevas', g: 'f' },
  { sg: 'selva', pl: 'selvas', g: 'f' },
  { sg: 'isla', pl: 'islas', g: 'f' },
  { sg: 'llave', pl: 'llaves', g: 'f' },
  { sg: 'luna', pl: 'lunas', g: 'f' },
  { sg: 'estrella', pl: 'estrellas', g: 'f' },
  { sg: 'nube', pl: 'nubes', g: 'f' },
  { sg: 'montaña', pl: 'montañas', g: 'f' },
  { sg: 'playa', pl: 'playas', g: 'f' },
]

/** Nombres propios de persona: sustantivos propios, no tienen plural ni se usan en los pares de género. */
export const PROPER_NAMES = ['Lucía', 'Pablo', 'Marta', 'Hugo', 'Carmen', 'Mario', 'Sara', 'Daniel', 'Elena', 'Julia'] as const

export const ADJECTIVES: Adjective[] = [
  { m: 'rojo', f: 'roja', mPl: 'rojos', fPl: 'rojas' },
  { m: 'verde', f: 'verde', mPl: 'verdes', fPl: 'verdes' },
  { m: 'azul', f: 'azul', mPl: 'azules', fPl: 'azules' },
  { m: 'grande', f: 'grande', mPl: 'grandes', fPl: 'grandes' },
  { m: 'pequeño', f: 'pequeña', mPl: 'pequeños', fPl: 'pequeñas' },
  { m: 'bonito', f: 'bonita', mPl: 'bonitos', fPl: 'bonitas' },
  { m: 'alto', f: 'alta', mPl: 'altos', fPl: 'altas' },
  { m: 'largo', f: 'larga', mPl: 'largos', fPl: 'largas' },
  { m: 'corto', f: 'corta', mPl: 'cortos', fPl: 'cortas' },
  { m: 'nuevo', f: 'nueva', mPl: 'nuevos', fPl: 'nuevas' },
  { m: 'viejo', f: 'vieja', mPl: 'viejos', fPl: 'viejas' },
  { m: 'rápido', f: 'rápida', mPl: 'rápidos', fPl: 'rápidas' },
  { m: 'lento', f: 'lenta', mPl: 'lentos', fPl: 'lentas' },
  { m: 'fuerte', f: 'fuerte', mPl: 'fuertes', fPl: 'fuertes' },
  { m: 'valiente', f: 'valiente', mPl: 'valientes', fPl: 'valientes' },
  { m: 'alegre', f: 'alegre', mPl: 'alegres', fPl: 'alegres' },
  { m: 'triste', f: 'triste', mPl: 'tristes', fPl: 'tristes' },
  { m: 'contento', f: 'contenta', mPl: 'contentos', fPl: 'contentas' },
  { m: 'tranquilo', f: 'tranquila', mPl: 'tranquilos', fPl: 'tranquilas' },
  { m: 'blanco', f: 'blanca', mPl: 'blancos', fPl: 'blancas' },
  { m: 'negro', f: 'negra', mPl: 'negros', fPl: 'negras' },
  { m: 'amarillo', f: 'amarilla', mPl: 'amarillos', fPl: 'amarillas' },
  { m: 'dulce', f: 'dulce', mPl: 'dulces', fPl: 'dulces' },
  { m: 'salado', f: 'salada', mPl: 'salados', fPl: 'saladas' },
  { m: 'frío', f: 'fría', mPl: 'fríos', fPl: 'frías' },
  { m: 'oscuro', f: 'oscura', mPl: 'oscuros', fPl: 'oscuras' },
  { m: 'brillante', f: 'brillante', mPl: 'brillantes', fPl: 'brillantes' },
  { m: 'misterioso', f: 'misteriosa', mPl: 'misteriosos', fPl: 'misteriosas' },
  { m: 'mágico', f: 'mágica', mPl: 'mágicos', fPl: 'mágicas' },
  { m: 'divertido', f: 'divertida', mPl: 'divertidos', fPl: 'divertidas' },
  { m: 'cansado', f: 'cansada', mPl: 'cansados', fPl: 'cansadas' },
  { m: 'tímido', f: 'tímida', mPl: 'tímidos', fPl: 'tímidas' },
  { m: 'antiguo', f: 'antigua', mPl: 'antiguos', fPl: 'antiguas' },
  { m: 'simpático', f: 'simpática', mPl: 'simpáticos', fPl: 'simpáticas' },
  { m: 'duro', f: 'dura', mPl: 'duros', fPl: 'duras' },
  { m: 'limpio', f: 'limpia', mPl: 'limpios', fPl: 'limpias' },
  { m: 'sucio', f: 'sucia', mPl: 'sucios', fPl: 'sucias' },
  { m: 'redondo', f: 'redonda', mPl: 'redondos', fPl: 'redondas' },
  { m: 'suave', f: 'suave', mPl: 'suaves', fPl: 'suaves' },
  { m: 'delgado', f: 'delgada', mPl: 'delgados', fPl: 'delgadas' },
]

export const VERBS: Verb[] = [
  { inf: 'saltar', pres: 'salta', pas: 'saltó', fut: 'saltará' },
  { inf: 'cantar', pres: 'canta', pas: 'cantó', fut: 'cantará' },
  { inf: 'bailar', pres: 'baila', pas: 'bailó', fut: 'bailará' },
  { inf: 'caminar', pres: 'camina', pas: 'caminó', fut: 'caminará' },
  { inf: 'buscar', pres: 'busca', pas: 'buscó', fut: 'buscará' },
  { inf: 'llamar', pres: 'llama', pas: 'llamó', fut: 'llamará' },
  { inf: 'mirar', pres: 'mira', pas: 'miró', fut: 'mirará' },
  { inf: 'escuchar', pres: 'escucha', pas: 'escuchó', fut: 'escuchará' },
  { inf: 'pasear', pres: 'pasea', pas: 'paseó', fut: 'paseará' },
  { inf: 'trabajar', pres: 'trabaja', pas: 'trabajó', fut: 'trabajará' },
  { inf: 'tocar', pres: 'toca', pas: 'tocó', fut: 'tocará' },
  { inf: 'visitar', pres: 'visita', pas: 'visitó', fut: 'visitará' },
  { inf: 'ayudar', pres: 'ayuda', pas: 'ayudó', fut: 'ayudará' },
  { inf: 'preparar', pres: 'prepara', pas: 'preparó', fut: 'preparará' },
  { inf: 'dibujar', pres: 'dibuja', pas: 'dibujó', fut: 'dibujará' },
  { inf: 'descansar', pres: 'descansa', pas: 'descansó', fut: 'descansará' },
  { inf: 'explorar', pres: 'explora', pas: 'exploró', fut: 'explorará' },
  { inf: 'cuidar', pres: 'cuida', pas: 'cuidó', fut: 'cuidará' },
  { inf: 'ordenar', pres: 'ordena', pas: 'ordenó', fut: 'ordenará' },
  { inf: 'llegar', pres: 'llega', pas: 'llegó', fut: 'llegará' },
  { inf: 'navegar', pres: 'navega', pas: 'navegó', fut: 'navegará' },
  { inf: 'comer', pres: 'come', pas: 'comió', fut: 'comerá' },
  { inf: 'beber', pres: 'bebe', pas: 'bebió', fut: 'beberá' },
  { inf: 'correr', pres: 'corre', pas: 'corrió', fut: 'correrá' },
  { inf: 'aprender', pres: 'aprende', pas: 'aprendió', fut: 'aprenderá' },
  { inf: 'vender', pres: 'vende', pas: 'vendió', fut: 'venderá' },
  { inf: 'esconder', pres: 'esconde', pas: 'escondió', fut: 'esconderá' },
  { inf: 'responder', pres: 'responde', pas: 'respondió', fut: 'responderá' },
  { inf: 'romper', pres: 'rompe', pas: 'rompió', fut: 'romperá' },
  { inf: 'barrer', pres: 'barre', pas: 'barrió', fut: 'barrerá' },
  { inf: 'recoger', pres: 'recoge', pas: 'recogió', fut: 'recogerá' },
  { inf: 'vivir', pres: 'vive', pas: 'vivió', fut: 'vivirá' },
  { inf: 'subir', pres: 'sube', pas: 'subió', fut: 'subirá' },
  { inf: 'escribir', pres: 'escribe', pas: 'escribió', fut: 'escribirá' },
  { inf: 'abrir', pres: 'abre', pas: 'abrió', fut: 'abrirá' },
  { inf: 'recibir', pres: 'recibe', pas: 'recibió', fut: 'recibirá' },
  { inf: 'asistir', pres: 'asiste', pas: 'asistió', fut: 'asistirá' },
  { inf: 'decidir', pres: 'decide', pas: 'decidió', fut: 'decidirá' },
  { inf: 'describir', pres: 'describe', pas: 'describió', fut: 'describirá' },
  { inf: 'permitir', pres: 'permite', pas: 'permitió', fut: 'permitirá' },
]

/** Words that are none of the four classes (prepositions, adverbs, possessives): the child does not tap them. */
export const OTHER_WORDS = ['a', 'en', 'con', 'de', 'del', 'por', 'para', 'hasta', 'sus', 'su', 'ayer', 'mañana', 'pronto', 'temprano', 'despacio', 'muy', 'todo', 'y'] as const

/** Sentences of 5 to 10 words, built from the banks above. Every verb of a sentence is in its `tense`. */
export const SENTENCES: Sentence[] = [
  // presente
  { words: ['El', 'gato', 'come', 'pescado', 'en', 'la', 'mesa'], subject: 2, tense: 'presente' },
  { words: ['La', 'niña', 'escribe', 'una', 'carta', 'a', 'su', 'abuela'], subject: 2, tense: 'presente' },
  { words: ['Lucía', 'dibuja', 'una', 'casa', 'roja', 'en', 'el', 'campo'], subject: 1, tense: 'presente' },
  { words: ['El', 'perro', 'salta', 'la', 'valla', 'del', 'jardín'], subject: 2, tense: 'presente' },
  { words: ['Pablo', 'canta', 'con', 'los', 'amigos', 'de', 'la', 'clase'], subject: 1, tense: 'presente' },
  { words: ['La', 'abeja', 'busca', 'flores', 'dulces', 'en', 'el', 'jardín'], subject: 2, tense: 'presente' },
  { words: ['El', 'niño', 'bebe', 'leche', 'fría', 'en', 'la', 'cocina'], subject: 2, tense: 'presente' },
  { words: ['El', 'caballo', 'corre', 'por', 'el', 'bosque', 'verde'], subject: 2, tense: 'presente' },
  { words: ['La', 'tortuga', 'camina', 'despacio', 'por', 'la', 'playa'], subject: 2, tense: 'presente' },
  { words: ['Hugo', 'llega', 'a', 'la', 'playa', 'muy', 'contento'], subject: 1, tense: 'presente' },
  { words: ['El', 'barco', 'llega', 'a', 'un', 'puerto', 'azul'], subject: 2, tense: 'presente' },
  { words: ['Marta', 'prepara', 'una', 'tarta', 'grande', 'para', 'sus', 'amigos'], subject: 1, tense: 'presente' },
  { words: ['Mario', 'mira', 'el', 'mapa', 'antiguo', 'del', 'tesoro'], subject: 1, tense: 'presente' },
  // pasado
  { words: ['El', 'gato', 'saltó', 'la', 'valla', 'ayer'], subject: 2, tense: 'pasado' },
  { words: ['Marta', 'cantó', 'una', 'canción', 'bonita', 'ayer'], subject: 1, tense: 'pasado' },
  { words: ['El', 'capitán', 'buscó', 'el', 'tesoro', 'en', 'la', 'isla'], subject: 2, tense: 'pasado' },
  { words: ['Elena', 'visitó', 'la', 'cueva', 'oscura', 'con', 'sus', 'amigas'], subject: 1, tense: 'pasado' },
  { words: ['La', 'hermana', 'ayudó', 'a', 'Daniel', 'con', 'el', 'mapa'], subject: 2, tense: 'pasado' },
  { words: ['Una', 'rana', 'saltó', 'en', 'el', 'río', 'verde'], subject: 2, tense: 'pasado' },
  { words: ['El', 'pájaro', 'cantó', 'una', 'canción', 'alegre'], subject: 2, tense: 'pasado' },
  { words: ['Sara', 'recogió', 'las', 'hojas', 'del', 'jardín'], subject: 1, tense: 'pasado' },
  { words: ['Carmen', 'abrió', 'la', 'ventana', 'de', 'la', 'clase'], subject: 1, tense: 'pasado' },
  { words: ['El', 'abuelo', 'escribió', 'una', 'carta', 'bonita', 'a', 'Julia'], subject: 2, tense: 'pasado' },
  { words: ['La', 'mariposa', 'descansó', 'en', 'la', 'flor', 'roja'], subject: 2, tense: 'pasado' },
  { words: ['El', 'conejo', 'bebió', 'leche', 'fría', 'en', 'el', 'lago'], subject: 2, tense: 'pasado' },
  { words: ['La', 'vecina', 'vendió', 'tartas', 'dulces', 'ayer'], subject: 2, tense: 'pasado' },
  // futuro
  { words: ['El', 'gato', 'saltará', 'la', 'valla', 'mañana'], subject: 2, tense: 'futuro' },
  { words: ['Pablo', 'cantará', 'en', 'la', 'fiesta', 'alegre'], subject: 1, tense: 'futuro' },
  { words: ['La', 'niña', 'dibujará', 'un', 'barco', 'azul', 'en', 'el', 'mar'], subject: 2, tense: 'futuro' },
  { words: ['Hugo', 'buscará', 'el', 'tesoro', 'del', 'castillo'], subject: 1, tense: 'futuro' },
  { words: ['El', 'capitán', 'navegará', 'hasta', 'la', 'isla', 'grande'], subject: 2, tense: 'futuro' },
  { words: ['La', 'abeja', 'trabajará', 'en', 'el', 'jardín', 'muy', 'temprano'], subject: 2, tense: 'futuro' },
  { words: ['Mario', 'escuchará', 'la', 'historia', 'del', 'cuento'], subject: 1, tense: 'futuro' },
  { words: ['Elena', 'escribirá', 'un', 'cuento', 'corto', 'para', 'la', 'clase'], subject: 1, tense: 'futuro' },
  { words: ['El', 'perro', 'vivirá', 'en', 'la', 'casa', 'nueva'], subject: 2, tense: 'futuro' },
  { words: ['La', 'rana', 'saltará', 'hasta', 'el', 'lago', 'pronto'], subject: 2, tense: 'futuro' },
  { words: ['El', 'pájaro', 'recibirá', 'una', 'carta', 'de', 'Lucía'], subject: 2, tense: 'futuro' },
  { words: ['Carmen', 'decidirá', 'el', 'camino', 'del', 'bosque'], subject: 1, tense: 'futuro' },
  { words: ['El', 'oso', 'escribirá', 'una', 'carta', 'a', 'sus', 'amigos'], subject: 2, tense: 'futuro' },
  { words: ['Julia', 'abrirá', 'la', 'puerta', 'de', 'la', 'escuela'], subject: 1, tense: 'futuro' },
]

/** Lowercase form → its class (and tense, for verbs). Built once from the banks. */
interface Entry { cls: WordClass; tense?: Tense }
const LOOKUP = new Map<string, Entry[]>()
function add(form: string, entry: Entry) {
  const key = form.toLocaleLowerCase('es')
  const list = LOOKUP.get(key) ?? []
  list.push(entry)
  LOOKUP.set(key, list)
}
for (const a of ARTICLES) add(a, { cls: 'articulo' })
for (const w of OTHER_WORDS) add(w, { cls: 'otra' })
for (const n of NOUNS) {
  add(n.sg, { cls: 'sustantivo' })
  add(n.pl, { cls: 'sustantivo' })
  if (n.f) { add(n.f.sg, { cls: 'sustantivo' }); add(n.f.pl, { cls: 'sustantivo' }) }
}
for (const name of PROPER_NAMES) add(name, { cls: 'sustantivo' })
for (const a of ADJECTIVES) { add(a.m, { cls: 'adjetivo' }); add(a.f, { cls: 'adjetivo' }); add(a.mPl, { cls: 'adjetivo' }); add(a.fPl, { cls: 'adjetivo' }) }
for (const v of VERBS) {
  add(v.pres, { cls: 'verbo', tense: 'presente' })
  add(v.pas, { cls: 'verbo', tense: 'pasado' })
  add(v.fut, { cls: 'verbo', tense: 'futuro' })
}

/** The class of a word, lowercase or not. Unknown words are «otra». A form listed under two classes is a bank error. */
export function wordClass(word: string): { cls: WordClass; tense?: Tense } {
  const found = LOOKUP.get(word.toLocaleLowerCase('es'))
  if (!found || found.length === 0) return { cls: 'otra' }
  return found[0]
}

/** Every form that is listed under more than one class (must be empty; the tests check it). */
export function ambiguousForms(): string[] {
  return [...LOOKUP.entries()].filter(([, list]) => new Set(list.map((e) => `${e.cls}:${e.tense ?? ''}`)).size > 1).map(([w]) => w)
}
