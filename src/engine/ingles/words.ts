/* Vocabulario de 3.º de Inglés (src/engine/ingles/). Palabras originales en inglés británico (colour, trousers, mum).
   Los glosarios van en español de España. Los temas con dibujo llevan un emoji en cada palabra (Unicode ≤ 13); si no
   hay un emoji claro para una palabra, se elige otra palabra. `saludos` y `dias` no llevan emoji. */

export type EnglishTheme =
  | 'saludos' | 'colores' | 'animales' | 'familia' | 'comida' | 'ropa' | 'cole' | 'casa' | 'cuerpo' | 'tiempo' | 'dias'

/** `alts` son otras respuestas aceptadas (p. ej. «bye» para «goodbye»). */
export interface EnglishWord { en: string; es: string; emoji?: string; theme: EnglishTheme; alts?: string[] }

export const ENGLISH_WORDS: EnglishWord[] = [
  // saludos
  { en: 'hello', es: 'hola', theme: 'saludos', alts: ['hi'] },
  { en: 'good morning', es: 'buenos días', theme: 'saludos' },
  { en: 'good afternoon', es: 'buenas tardes', theme: 'saludos' },
  { en: 'good night', es: 'buenas noches', theme: 'saludos' },
  { en: 'goodbye', es: 'adiós', theme: 'saludos', alts: ['bye'] },
  { en: 'thank you', es: 'gracias', theme: 'saludos', alts: ['thanks'] },
  { en: 'please', es: 'por favor', theme: 'saludos' },
  { en: 'yes', es: 'sí', theme: 'saludos' },
  { en: 'no', es: 'no', theme: 'saludos' },
  { en: 'sorry', es: 'lo siento', theme: 'saludos' },

  // colores (sin «grey»: no hay un emoji gris claro)
  { en: 'red', es: 'rojo', emoji: '🔴', theme: 'colores' },
  { en: 'blue', es: 'azul', emoji: '🔵', theme: 'colores' },
  { en: 'green', es: 'verde', emoji: '🟢', theme: 'colores' },
  { en: 'yellow', es: 'amarillo', emoji: '🟡', theme: 'colores' },
  { en: 'orange', es: 'naranja', emoji: '🟠', theme: 'colores' },
  { en: 'purple', es: 'morado', emoji: '🟣', theme: 'colores' },
  { en: 'brown', es: 'marrón', emoji: '🟤', theme: 'colores' },
  { en: 'black', es: 'negro', emoji: '⚫', theme: 'colores' },
  { en: 'white', es: 'blanco', emoji: '⚪', theme: 'colores' },

  // animales
  { en: 'cat', es: 'gato', emoji: '🐱', theme: 'animales' },
  { en: 'dog', es: 'perro', emoji: '🐶', theme: 'animales' },
  { en: 'bird', es: 'pájaro', emoji: '🐦', theme: 'animales' },
  { en: 'fish', es: 'pez', emoji: '🐟', theme: 'animales' },
  { en: 'horse', es: 'caballo', emoji: '🐴', theme: 'animales' },
  { en: 'cow', es: 'vaca', emoji: '🐮', theme: 'animales' },
  { en: 'pig', es: 'cerdo', emoji: '🐷', theme: 'animales' },
  { en: 'sheep', es: 'oveja', emoji: '🐑', theme: 'animales' },
  { en: 'duck', es: 'pato', emoji: '🦆', theme: 'animales' },
  { en: 'rabbit', es: 'conejo', emoji: '🐰', theme: 'animales' },
  { en: 'mouse', es: 'ratón', emoji: '🐭', theme: 'animales' },
  { en: 'frog', es: 'rana', emoji: '🐸', theme: 'animales' },
  { en: 'monkey', es: 'mono', emoji: '🐵', theme: 'animales' },
  { en: 'lion', es: 'león', emoji: '🦁', theme: 'animales' },
  { en: 'elephant', es: 'elefante', emoji: '🐘', theme: 'animales' },
  { en: 'bear', es: 'oso', emoji: '🐻', theme: 'animales' },
  { en: 'snake', es: 'serpiente', emoji: '🐍', theme: 'animales' },
  { en: 'butterfly', es: 'mariposa', emoji: '🦋', theme: 'animales' },
  { en: 'turtle', es: 'tortuga', emoji: '🐢', theme: 'animales' },
  { en: 'tiger', es: 'tigre', emoji: '🐯', theme: 'animales' },

  // familia
  { en: 'family', es: 'familia', emoji: '👪', theme: 'familia' },
  { en: 'mum', es: 'mamá', emoji: '👩', theme: 'familia' },
  { en: 'dad', es: 'papá', emoji: '👨', theme: 'familia' },
  { en: 'baby', es: 'bebé', emoji: '👶', theme: 'familia' },
  { en: 'grandma', es: 'abuela', emoji: '👵', theme: 'familia' },
  { en: 'grandpa', es: 'abuelo', emoji: '👴', theme: 'familia' },
  { en: 'brother', es: 'hermano', emoji: '👦', theme: 'familia' },
  { en: 'sister', es: 'hermana', emoji: '👧', theme: 'familia' },

  // comida
  { en: 'apple', es: 'manzana', emoji: '🍎', theme: 'comida' },
  { en: 'banana', es: 'plátano', emoji: '🍌', theme: 'comida' },
  { en: 'orange', es: 'naranja', emoji: '🍊', theme: 'comida' },
  { en: 'strawberry', es: 'fresa', emoji: '🍓', theme: 'comida' },
  { en: 'carrot', es: 'zanahoria', emoji: '🥕', theme: 'comida' },
  { en: 'bread', es: 'pan', emoji: '🍞', theme: 'comida' },
  { en: 'cake', es: 'tarta', emoji: '🍰', theme: 'comida' },
  { en: 'egg', es: 'huevo', emoji: '🥚', theme: 'comida' },
  { en: 'milk', es: 'leche', emoji: '🥛', theme: 'comida' },
  { en: 'cheese', es: 'queso', emoji: '🧀', theme: 'comida' },
  { en: 'pizza', es: 'pizza', emoji: '🍕', theme: 'comida' },
  { en: 'sandwich', es: 'bocadillo', emoji: '🥪', theme: 'comida' },

  // ropa
  { en: 'shirt', es: 'camiseta', emoji: '👕', theme: 'ropa' },
  { en: 'trousers', es: 'pantalones', emoji: '👖', theme: 'ropa' },
  { en: 'dress', es: 'vestido', emoji: '👗', theme: 'ropa' },
  { en: 'shoes', es: 'zapatillas', emoji: '👟', theme: 'ropa' },
  { en: 'socks', es: 'calcetines', emoji: '🧦', theme: 'ropa' },
  { en: 'jacket', es: 'chaqueta', emoji: '🧥', theme: 'ropa' },
  { en: 'hat', es: 'sombrero', emoji: '👒', theme: 'ropa' },
  { en: 'scarf', es: 'bufanda', emoji: '🧣', theme: 'ropa' },
  { en: 'gloves', es: 'guantes', emoji: '🧤', theme: 'ropa' },
  { en: 'glasses', es: 'gafas', emoji: '👓', theme: 'ropa' },

  // cole
  { en: 'book', es: 'libro', emoji: '📖', theme: 'cole' },
  { en: 'notebook', es: 'cuaderno', emoji: '📓', theme: 'cole' },
  { en: 'pencil', es: 'lápiz', emoji: '✏️', theme: 'cole' },
  { en: 'pen', es: 'bolígrafo', emoji: '🖊️', theme: 'cole' },
  { en: 'ruler', es: 'regla', emoji: '📏', theme: 'cole' },
  { en: 'scissors', es: 'tijeras', emoji: '✂️', theme: 'cole' },
  { en: 'schoolbag', es: 'mochila', emoji: '🎒', theme: 'cole' },
  { en: 'crayon', es: 'lápiz de cera', emoji: '🖍️', theme: 'cole' },
  { en: 'globe', es: 'globo terráqueo', emoji: '🌍', theme: 'cole' },

  // casa
  { en: 'house', es: 'casa', emoji: '🏠', theme: 'casa' },
  { en: 'door', es: 'puerta', emoji: '🚪', theme: 'casa' },
  { en: 'window', es: 'ventana', emoji: '🪟', theme: 'casa' },
  { en: 'bed', es: 'cama', emoji: '🛏️', theme: 'casa' },
  { en: 'chair', es: 'silla', emoji: '🪑', theme: 'casa' },
  { en: 'sofa', es: 'sofá', emoji: '🛋️', theme: 'casa' },
  { en: 'bath', es: 'bañera', emoji: '🛁', theme: 'casa' },
  { en: 'toilet', es: 'servicio', emoji: '🚽', theme: 'casa' },
  { en: 'lamp', es: 'lámpara', emoji: '💡', theme: 'casa' },
  { en: 'key', es: 'llave', emoji: '🔑', theme: 'casa' },

  // cuerpo
  { en: 'eye', es: 'ojo', emoji: '👁️', theme: 'cuerpo' },
  { en: 'nose', es: 'nariz', emoji: '👃', theme: 'cuerpo' },
  { en: 'ear', es: 'oreja', emoji: '👂', theme: 'cuerpo' },
  { en: 'mouth', es: 'boca', emoji: '👄', theme: 'cuerpo' },
  { en: 'hand', es: 'mano', emoji: '✋', theme: 'cuerpo' },
  { en: 'foot', es: 'pie', emoji: '🦶', theme: 'cuerpo' },
  { en: 'leg', es: 'pierna', emoji: '🦵', theme: 'cuerpo' },
  { en: 'tooth', es: 'diente', emoji: '🦷', theme: 'cuerpo' },

  // tiempo
  { en: 'sun', es: 'sol', emoji: '☀️', theme: 'tiempo' },
  { en: 'moon', es: 'luna', emoji: '🌙', theme: 'tiempo' },
  { en: 'star', es: 'estrella', emoji: '⭐', theme: 'tiempo' },
  { en: 'cloud', es: 'nube', emoji: '☁️', theme: 'tiempo' },
  { en: 'rain', es: 'lluvia', emoji: '🌧️', theme: 'tiempo' },
  { en: 'snow', es: 'nieve', emoji: '❄️', theme: 'tiempo' },
  { en: 'wind', es: 'viento', emoji: '💨', theme: 'tiempo' },
  { en: 'rainbow', es: 'arcoíris', emoji: '🌈', theme: 'tiempo' },
  { en: 'clock', es: 'reloj', emoji: '⏰', theme: 'tiempo' },

  // dias: días de la semana y meses
  { en: 'Monday', es: 'lunes', theme: 'dias' },
  { en: 'Tuesday', es: 'martes', theme: 'dias' },
  { en: 'Wednesday', es: 'miércoles', theme: 'dias' },
  { en: 'Thursday', es: 'jueves', theme: 'dias' },
  { en: 'Friday', es: 'viernes', theme: 'dias' },
  { en: 'Saturday', es: 'sábado', theme: 'dias' },
  { en: 'Sunday', es: 'domingo', theme: 'dias' },
  { en: 'January', es: 'enero', theme: 'dias' },
  { en: 'February', es: 'febrero', theme: 'dias' },
  { en: 'March', es: 'marzo', theme: 'dias' },
  { en: 'April', es: 'abril', theme: 'dias' },
  { en: 'May', es: 'mayo', theme: 'dias' },
  { en: 'June', es: 'junio', theme: 'dias' },
  { en: 'July', es: 'julio', theme: 'dias' },
  { en: 'August', es: 'agosto', theme: 'dias' },
  { en: 'September', es: 'septiembre', theme: 'dias' },
  { en: 'October', es: 'octubre', theme: 'dias' },
  { en: 'November', es: 'noviembre', theme: 'dias' },
  { en: 'December', es: 'diciembre', theme: 'dias' },
]
