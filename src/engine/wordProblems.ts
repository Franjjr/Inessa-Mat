/* Bank of Spanish story-problem templates featuring the Numeria cast. {a} and {b} are filled by the engine with
   numbers; {child} and {pet} stay as template placeholders for content/renderTemplate.
   Conventions per operation:
     add  {a} + {b}
     sub  {a} − {b}  ({a} is always the larger number)
     mul  {a} groups of {b}  ({a} is a single digit; {b} may be 2-digit in 2×1 problems)
     div  {a} ÷ {b}  ({a} dividend, {b} divisor) */
import type { WordOp } from './skills'

export interface WordTemplate {
  id: string
  op: WordOp
  text: string
  /** Unit word for the answer line (plural). */
  unit: string
  /** Operand sizes (digits of the largest operand) that read naturally in this story. */
  minDigits: number
  maxDigits: number
  /** Story-fixed {b} (6 legs of a ladybug, 8 tentacles, 7 days a week, 4 wheels...). */
  fixed?: number
}

export const WORD_TEMPLATES: WordTemplate[] = [
  // ---------------------------------------------------------------- add
  { id: 'add-peces', op: 'add', unit: 'peces', minDigits: 2, maxDigits: 4,
    text: 'En el río nadan {a} peces dorados y {b} peces azules. ¿Cuántos peces hay en total?' },
  { id: 'add-nenufares', op: 'add', unit: 'nenúfares', minDigits: 2, maxDigits: 3,
    text: 'La Rana Saltarina ha contado {a} nenúfares por la mañana y {b} por la tarde. ¿Cuántos nenúfares ha contado en total?' },
  { id: 'add-estrellas', op: 'add', unit: 'estrellas', minDigits: 2, maxDigits: 4,
    text: 'Lumi ha encendido {a} estrellas el lunes y {b} estrellas el martes. ¿Cuántas estrellas ha encendido en los dos días?' },
  { id: 'add-conchas', op: 'add', unit: 'conchas', minDigits: 2, maxDigits: 3,
    text: '{child} y {pet} recogen conchas en la orilla del lago. {child} encuentra {a} y {pet} encuentra {b}. ¿Cuántas conchas tienen entre los dos?' },
  { id: 'add-libros', op: 'add', unit: 'libros', minDigits: 2, maxDigits: 4,
    text: 'En la biblioteca del Búho Sabio hay {a} libros. Hoy le regalan {b} libros más. ¿Cuántos libros tiene ahora?' },
  { id: 'add-herraduras', op: 'add', unit: 'herraduras', minDigits: 3, maxDigits: 4,
    text: 'La dragona Chispa forjó {a} herraduras el año pasado y {b} este año. ¿Cuántas herraduras ha forjado en total?' },
  { id: 'add-margaritas', op: 'add', unit: 'margaritas', minDigits: 2, maxDigits: 4,
    text: 'En el Jardín del Arcoíris han florecido {a} margaritas rojas y {b} margaritas amarillas. ¿Cuántas margaritas hay?' },
  { id: 'add-borron', op: 'add', unit: 'números', minDigits: 2, maxDigits: 3,
    text: 'Borrón escondió {a} números en la niebla y después escondió {b} más. ¿Cuántos números ha escondido en total?' },
  // ---------------------------------------------------------------- sub
  { id: 'sub-tazas', op: 'sub', unit: 'tazas', minDigits: 3, maxDigits: 4,
    text: 'La osa Nieve tenía {a} tazas de chocolate y ha vendido {b}. ¿Cuántas tazas le quedan?' },
  { id: 'sub-copos', op: 'sub', unit: 'copos', minDigits: 2, maxDigits: 4,
    text: 'En la cima de la montaña había {a} copos de nieve. El sol ha derretido {b}. ¿Cuántos copos quedan?' },
  { id: 'sub-luces', op: 'sub', unit: 'luces', minDigits: 2, maxDigits: 3,
    text: 'En el castillo brillan {a} luces. Borrón sopla y apaga {b}. ¿Cuántas luces siguen encendidas?' },
  { id: 'sub-perlas', op: 'sub', unit: 'perlas', minDigits: 2, maxDigits: 3,
    text: 'El pulpo Octavio tiene {a} perlas y regala {b} a sus amigos. ¿Cuántas perlas le quedan?' },
  { id: 'sub-saltos', op: 'sub', unit: 'saltos', minDigits: 2, maxDigits: 3,
    text: 'La Rana Saltarina ha dado {a} saltos y {pet} ha dado {b}. ¿Cuántos saltos más ha dado la Rana?' },
  { id: 'sub-banderines', op: 'sub', unit: 'banderines', minDigits: 2, maxDigits: 3,
    text: 'La Reina Aurora quiere colgar {a} banderines en el castillo. Ya ha colgado {b}. ¿Cuántos le faltan por colgar?' },
  { id: 'sub-paginas', op: 'sub', unit: 'páginas', minDigits: 2, maxDigits: 3,
    text: '{child} lee un libro de magia de {a} páginas. Ya ha leído {b}. ¿Cuántas páginas le quedan por leer?' },
  { id: 'sub-pasos', op: 'sub', unit: 'pasos', minDigits: 3, maxDigits: 4,
    text: 'Para llegar a la Forja del Dragón hay que andar {a} pasos. {child} y {pet} ya han andado {b}. ¿Cuántos pasos les faltan?' },
  // ---------------------------------------------------------------- mul
  { id: 'mul-mariquitas', op: 'mul', unit: 'patas', minDigits: 1, maxDigits: 1, fixed: 6,
    text: 'En la pista de baile de la cueva hay {a} mariquitas. Cada mariquita tiene {b} patas. ¿Cuántas patas hay en la pista?' },
  { id: 'mul-pulpos', op: 'mul', unit: 'tentáculos', minDigits: 1, maxDigits: 1, fixed: 8,
    text: 'En la salida de la carrera del lago hay {a} pulpos. Cada pulpo tiene {b} tentáculos. ¿Cuántos tentáculos hay en la salida?' },
  { id: 'mul-arcoiris', op: 'mul', unit: 'franjas', minDigits: 1, maxDigits: 1, fixed: 7,
    text: 'El Hada Iris pinta {a} arcoíris. Cada arcoíris tiene {b} colores. ¿Cuántas franjas de color pinta en total?' },
  { id: 'mul-semanas', op: 'mul', unit: 'días', minDigits: 1, maxDigits: 1, fixed: 7,
    text: 'Una semana tiene {b} días. {pet} se va de excursión {a} semanas. ¿Cuántos días dura la excursión?' },
  { id: 'mul-ruedas', op: 'mul', unit: 'ruedas', minDigits: 1, maxDigits: 1, fixed: 4,
    text: 'Delante del castillo hay {a} carrozas. Cada carroza tiene {b} ruedas. ¿Cuántas ruedas hay?' },
  { id: 'mul-setas', op: 'mul', unit: 'setas', minDigits: 1, maxDigits: 1,
    text: '{pet} ha encontrado {a} cestas con {b} setas en cada una. ¿Cuántas setas hay en total?' },
  { id: 'mul-flores', op: 'mul', unit: 'flores', minDigits: 1, maxDigits: 2,
    text: 'Lumi planta {a} filas de flores con {b} flores en cada fila. ¿Cuántas flores planta?' },
  { id: 'mul-escudos', op: 'mul', unit: 'piedras', minDigits: 1, maxDigits: 2,
    text: 'La dragona Chispa fabrica {a} escudos. Cada escudo lleva {b} piedras brillantes. ¿Cuántas piedras necesita?' },
  { id: 'mul-gemas', op: 'mul', unit: 'gemas', minDigits: 2, maxDigits: 2,
    text: 'Chispa necesita {a} cajas con {b} gemas cada una. ¿Cuántas gemas son en total?' },
  { id: 'mul-cromos', op: 'mul', unit: 'cromos', minDigits: 1, maxDigits: 2,
    text: '{child} tiene {a} sobres de cromos mágicos. En cada sobre hay {b} cromos. ¿Cuántos cromos tiene?' },
  // ---------------------------------------------------------------- div
  { id: 'div-hadas', op: 'div', unit: 'estrellas', minDigits: 1, maxDigits: 2,
    text: 'La Reina Aurora reparte {a} estrellas entre {b} hadas, las mismas para cada una. ¿Cuántas estrellas recibe cada hada?' },
  { id: 'div-torres', op: 'div', unit: 'estrellas', minDigits: 2, maxDigits: 2,
    text: 'La reina tiene {a} estrellas y quiere repartirlas por igual entre las {b} torres del castillo. ¿Cuántas estrellas pondrá en cada torre?' },
  { id: 'div-mariquitas', op: 'div', unit: 'mariquitas', minDigits: 1, maxDigits: 2, fixed: 6,
    text: 'En la cueva se ven {a} patas de mariquita. Cada mariquita tiene {b} patas. ¿Cuántas mariquitas hay?' },
  { id: 'div-pulpos', op: 'div', unit: 'pulpos', minDigits: 1, maxDigits: 2, fixed: 8,
    text: 'Octavio cuenta {a} tentáculos en el agua. Cada pulpo tiene {b} tentáculos. ¿Cuántos pulpos hay?' },
  { id: 'div-semanas', op: 'div', unit: 'semanas', minDigits: 1, maxDigits: 2, fixed: 7,
    text: 'Faltan {a} días para la gran fiesta de Numeria. Una semana tiene {b} días. ¿Cuántas semanas faltan?' },
  { id: 'div-conchas', op: 'div', unit: 'bolsas', minDigits: 1, maxDigits: 2,
    text: 'El pulpo Octavio guarda {a} conchas en bolsas de {b} conchas. ¿Cuántas bolsas llena?' },
  { id: 'div-galletas', op: 'div', unit: 'galletas', minDigits: 1, maxDigits: 2,
    text: '{child} reparte {a} galletas entre {b} amigos, a partes iguales. ¿Cuántas galletas le tocan a cada uno?' },
  { id: 'div-libros', op: 'div', unit: 'libros', minDigits: 1, maxDigits: 2,
    text: 'El Búho Sabio coloca {a} libros en {b} estanterías, los mismos en cada una. ¿Cuántos libros pone en cada estantería?' },
  { id: 'div-chuches', op: 'div', unit: 'chuches', minDigits: 1, maxDigits: 2,
    text: '{pet} tiene {a} chuches y hace {b} montones iguales. ¿Cuántas chuches hay en cada montón?' },
]

export function templatesFor(op: WordOp, digits: number, fixedAllowed: (n: number) => boolean): WordTemplate[] {
  return WORD_TEMPLATES.filter((t) =>
    t.op === op && digits >= t.minDigits && digits <= t.maxDigits && (t.fixed === undefined || fixedAllowed(t.fixed)))
}

export function fillTemplate(text: string, a: number, b: number): string {
  return text.replace(/\{a\}/g, String(a)).replace(/\{b\}/g, String(b))
}

export function getWordTemplate(id: string): WordTemplate | undefined {
  return WORD_TEMPLATES.find((t) => t.id === id)
}
