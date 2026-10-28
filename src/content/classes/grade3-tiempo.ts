/* Clases de tiempo de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato que las
   demás: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una frase que resume la
   regla. Las prácticas usan solo habilidades de su propio tema, y su texto sirve para todas las variantes del generador
   (src/engine/clock.ts). El reloj que se dibuja es el mismo de los ejercicios (src/activities/lesson/visuals/time.tsx).
   Las prácticas con reloj o con recta de tiempo llevan una tarjeta de texto y no un dibujo: el ejercicio ya pinta su
   propio reloj, y un dibujo fijo podría dar la respuesta. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* En punto, y media y cuarto: las horas exactas, las medias y los cuartos, con la aguja larga en el 12, el 6, el 3 o el 9. */
const enPuntoMediaCuarto = clase({
  id: 'c3-tiempo-en-punto-media-cuarto',
  topicId: 'reloj-en-punto-media-cuarto',
  title: 'Reloj: en punto, y media, y cuarto',
  para: [
    show('clock', { h: 3, m: 0 }, 'Este reloj tiene dos agujas. La corta marca la hora. Cuando la larga está en el 12, es en punto: son las tres en punto.', 'frog'),
    show('clock', { h: 6, m: 30 }, 'Cuando la aguja larga está en el 6, es y media: ha dado media vuelta, 30 minutos. Son las seis y media.', 'ladybug'),
  ],
  ejemplo: [
    show('clock', { h: 9, m: 0 }, 'En punto: la aguja larga está en el 12 y la corta, en el 9. Son las nueve en punto.'),
    show('clock', { h: 4, m: 15 }, 'Y cuarto: la aguja larga está en el 3. Ha pasado un cuarto de hora, 15 minutos. Son las cuatro y cuarto.'),
    show('clock', { h: 1, m: 30 }, 'Y media: la aguja larga está en el 6, y la corta, a mitad de camino entre el 1 y el 2. Son la una y media.'),
    show('clock', { h: 11, m: 45 }, 'Menos cuarto: la aguja larga está en el 9 y faltan 15 minutos para la hora siguiente. Son las doce menos cuarto.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'en punto · y media' }, '¡Te toca! Mira primero la aguja corta: dice la hora. Después mira la larga: ¿marca el 12 o el 6?', { skills: ['clock:read:30'] }),
    tryIt('big-text', { text: 'y cuarto · menos cuarto' }, '¡Otra! Mira dónde está la aguja larga y cuenta sus minutos desde el 12. Si faltan minutos para la hora siguiente, la frase lleva «menos».', { skills: ['clock:read:15'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'en punto · y media' }, '¡Tu turno! Lee la hora: la aguja corta dice la hora y la larga, si es en punto o y media.', { skills: ['clock:read:30'] }),
    tryIt('big-text', { text: 'y cuarto · menos cuarto' }, '¡Tu turno! Cuenta cuántos minutos marca la aguja larga: un cuarto de hora son 15 minutos.', { skills: ['clock:read:15'] }),
    tryIt('big-text', { text: 'la larga primero, la corta después' }, '¡Tu turno! Pon primero la aguja larga en el minuto que dice la frase y después la corta en la hora.', { skills: ['clock:set:30'] }),
    tryIt('big-text', { text: 'en punto · y media · y cuarto · menos cuarto' }, '¡Tu turno! Lee o pon la hora con calma: primero los minutos de la aguja larga y luego la hora que marca la corta.', { skills: ['clock:read:30', 'clock:read:15', 'clock:set:30'] }),
  ],
  cierre: show('clock', { h: 2, m: 45 }, 'La regla: con la aguja larga en el 12 es en punto; en el 6, y media; en el 3, y cuarto; y en el 9, menos cuarto.'),
})

/* De cinco en cinco: cada número del reloj son 5 minutos; «y» cuando ya han pasado de la hora, «menos» cuando faltan. */
const reloj5Minutos = clase({
  id: 'c3-tiempo-reloj-5-minutos',
  topicId: 'reloj-5-minutos',
  title: 'Reloj de cinco en cinco minutos',
  para: [
    show('clock', { h: 3, m: 20 }, 'Los números del reloj son de 5 en 5 minutos. Cuenta desde el 12: la aguja larga marca 20 minutos. Son las tres y veinte.', 'frog'),
    show('clock', { h: 8, m: 55 }, 'La aguja larga en el 11 son 55 minutos. Faltan 5 minutos para las nueve: son las nueve menos cinco.', 'ladybug'),
  ],
  ejemplo: [
    show('clock', { h: 3, m: 20 }, 'Veinte minutos: la aguja larga está en el 4. Como ya han pasado de la hora, decimos «y»: las tres y veinte.'),
    show('clock', { h: 5, m: 10 }, 'Diez minutos: la aguja larga está en el 2. Son las cinco y diez.'),
    show('clock', { h: 7, m: 35 }, 'Treinta y cinco minutos: la aguja larga está en el 7. Faltan 25 minutos para las ocho: son las ocho menos veinticinco.'),
    show('clock', { h: 12, m: 5 }, 'Cinco minutos: la aguja larga está en el 1. Son las doce y cinco.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'de 5 en 5' }, '¡Te toca! Cuenta de 5 en 5 desde el 12 hasta donde esté la aguja larga. Ese número son los minutos.', { skills: ['clock:read:5'] }),
    tryIt('big-text', { text: '«y» · «menos»' }, '¡Otra! Si la aguja larga está en el 12, es en punto. Hasta la y media (de 1 a 30 minutos) se dice «y»; a partir de la media, «menos».', { skills: ['clock:read:5'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'de 5 en 5' }, '¡Tu turno! Cuenta de 5 en 5 desde el 12 con la aguja larga y mira cuántos minutos son.', { skills: ['clock:read:5'] }),
    tryIt('big-text', { text: 'la larga en los minutos, la corta en la hora' }, '¡Tu turno! Pon primero la aguja larga en el número de los minutos y después la corta en la hora.', { skills: ['clock:set:5'] }),
    tryIt('big-text', { text: '«y» · «menos»' }, '¡Tu turno! Mira si los minutos faltan para la hora siguiente o si ya han pasado de la hora.', { skills: ['clock:read:5'] }),
    tryIt('big-text', { text: 'de 5 en 5' }, '¡Tu turno! Lee o pon la hora de 5 en 5 minutos: cuenta despacio y comprueba los minutos.', { skills: ['clock:read:5', 'clock:set:5'] }),
  ],
  cierre: show('clock', { h: 6, m: 40 }, 'La regla: cuenta de 5 en 5 desde el 12. Si faltan minutos para la hora siguiente, di «menos»: son las siete menos veinte.'),
})

/* Reloj digital de 24 horas: las horas se cuentan de 0 a 23; de 6 a 11, de la mañana; de 13 a 20, de la tarde; de 21 a 5, de la noche. */
const relojDigital = clase({
  id: 'c3-tiempo-reloj-digital',
  topicId: 'reloj-digital',
  title: 'Reloj digital y de 24 horas',
  para: [
    show('clock', { h: 7, m: 5, digital: 1 }, 'El reloj digital escribe la hora con dos números: primero las horas y después los minutos. Son las 07:05: las siete y cinco de la mañana.', 'frog'),
    show('clock', { h: 14, m: 30, digital: 1 }, 'Son las 14:30 en el reloj digital. Después de las 12 del mediodía, las horas siguen contando: son las dos y media de la tarde.', 'ladybug'),
  ],
  ejemplo: [
    show('clock', { h: 12, m: 0, digital: 1 }, '12:00 son las doce en punto del mediodía. Después empieza la tarde, y las horas siguen contando: 13, 14, 15…'),
    show('clock', { h: 18, m: 45, digital: 1 }, '18:45 son las siete menos cuarto de la tarde: faltan 15 minutos para las 19:00.'),
    show('clock', { h: 21, m: 10, digital: 1 }, '21:10 son las nueve y diez de la noche. De 21 a 23 también es de la noche.'),
    show('clock', { h: 9, m: 20, digital: 1 }, '09:20 son las nueve y veinte de la mañana. De 6 a 11 es de la mañana.'),
    show('clock', { h: 3, m: 0, digital: 1 }, '03:00 son las tres de la noche. De 0 a 5 es de la noche y el número no cambia: a esa hora no son las 15:00.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'mañana · tarde · noche' }, '¡Te toca! Mira la hora de 24 horas: de 6 a 11 es de la mañana; 12 es del mediodía; de 13 a 20, de la tarde; de 21 a 23 y de 0 a 5, de la noche.', { skills: ['clock:convert:day'] }),
    tryIt('big-text', { text: 'horas de 0 a 23' }, '¡Otra! De 13 a 23, las horas se cuentan con 12 más: las diez de la noche son las 22 h.', { skills: ['clock:convert:day'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'horas de 0 a 23' }, '¡Tu turno! Mira la hora con calma: en el reloj de 24 horas, cuenta las horas desde la medianoche.', { skills: ['clock:convert:day'] }),
    tryIt('big-text', { text: 'mañana · mediodía · tarde · noche' }, '¡Tu turno! Mira primero el momento del día: mañana, mediodía, tarde o noche. Después mira la hora.', { skills: ['clock:convert:day'] }),
    tryIt('big-text', { text: 'hh:mm' }, '¡Tu turno! Une la hora de 24 horas con su frase: mira primero las horas, luego los minutos y el momento del día.', { skills: ['clock:convert:day'] }),
    tryIt('big-text', { text: 'la tarde y la noche: 12 más' }, '¡Tu turno! Compara la frase con la hora de 24 horas: de 13 a 23, la hora de 24 horas es la de la frase más 12; de 0 a 5, es la misma.', { skills: ['clock:convert:day'] }),
  ],
  cierre: show('clock', { h: 19, m: 15, digital: 1 }, 'La regla: el reloj digital cuenta de 0 a 23; de 13 a 23 las horas van con 12 más que en la frase, y de 0 a 5 el número no cambia: 19:15 son las siete y cuarto de la tarde.'),
})

/* Duraciones: la duración es lo que pasa del inicio al final; para la hora de llegada, se suma la duración a la de salida. */
const duraciones = clase({
  id: 'c3-tiempo-duraciones',
  topicId: 'duraciones',
  title: 'Duraciones: cuánto dura y a qué hora acaba',
  para: [
    show('timeline', { start: 1020, end: 1050 }, 'Una actividad empieza a las 17:00 y acaba a las 17:30. Dura media hora: 30 minutos.', 'frog'),
    show('timeline', { start: 1080, end: 1170 }, 'La película empieza a las 18:00 y acaba a las 19:30. Dura una hora y media: 90 minutos.', 'ladybug'),
  ],
  ejemplo: [
    show('timeline', { start: 600, end: 645 }, 'Sale a las 10:00 y llega a las 10:45. Para saber cuánto dura, cuenta de 10:00 a 10:45: son 45 minutos.'),
    show('timeline', { start: 600, end: 660 }, 'De las 10:00 a las 11:00 pasa una hora: 60 minutos. Una hora tiene 60 minutos.'),
    show('timeline', { start: 615, end: 690 }, 'De las 10:15 a las 11:30 pasan 75 minutos: 45 minutos hasta las 11:00 y 30 minutos después.'),
    show('timeline', { start: 645, end: 765 }, 'Si empieza a las 10:45 y dura 2 horas, acaba a las 12:45: cuenta dos horas enteras, una a una.'),
  ],
  guiada: [
    tryIt('big-text', { text: '¿A qué hora acaba?' }, '¡Te toca! Dibuja la recta del tiempo: marca la hora de salida y cuenta hacia delante, primero hasta la hora en punto.', { skills: ['time:end'] }),
    tryIt('big-text', { text: '¿Cuántos minutos pasan?' }, '¡Otra! Cuenta los minutos que faltan para la hora en punto y después, si hay, las horas enteras.', { skills: ['time:elapsed'] }),
  ],
  sola: [
    tryIt('big-text', { text: '¿A qué hora acaba?' }, '¡Tu turno! Empieza en la hora de salida y cuenta la duración, paso a paso.', { skills: ['time:end'] }),
    tryIt('big-text', { text: '¿Cuántos minutos pasan?' }, '¡Tu turno! Cuenta los minutos hasta la hora en punto y después, si hay horas enteras, añádelas.', { skills: ['time:elapsed'] }),
    tryIt('big-text', { text: '¿A qué hora acaba?' }, '¡Tu turno! Si la duración pasa de la hora en punto, cuenta primero hasta la hora y después lo que falta.', { skills: ['time:end'] }),
    tryIt('big-text', { text: 'llegada o minutos que pasan' }, '¡Tu turno! Mira primero qué te piden: la hora de llegada o los minutos que pasan.', { skills: ['time:end', 'time:elapsed'] }),
  ],
  cierre: show('timeline', { start: 900, end: 1000 }, 'La regla: para saber cuánto dura, cuenta de la hora de salida a la de llegada. Para saber a qué hora acaba, suma la duración a la hora de salida.'),
})

/* Calendario y unidades de tiempo: una hora tiene 60 minutos y un día 24 horas; la semana tiene 7 días; los meses de los
   nudillos tienen 31 días y los de los huecos, 30, salvo febrero. */
const calendario = clase({
  id: 'c3-tiempo-calendario',
  topicId: 'calendario',
  title: 'Calendario y unidades de tiempo',
  para: [
    show('big-text', { text: '1 hora = 60 minutos' }, 'Una hora tiene 60 minutos. Un minuto tiene 60 segundos.', 'frog'),
    show('big-text', { text: 'lunes, martes, miércoles, jueves, viernes, sábado y domingo', sub: '7 días' }, 'La semana tiene siete días, de lunes a domingo. Después del domingo vuelve el lunes.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '1 día = 24 horas', sub: '1 semana = 7 días' }, 'Un día tiene 24 horas. Una semana tiene 7 días.'),
    show('big-text', { text: '2 horas = 120 minutos' }, 'Dos horas son 120 minutos: 60 + 60.'),
    show('big-text', { text: 'enero · marzo · mayo · julio · agosto · octubre · diciembre', sub: '31 días' }, 'Estos meses tienen 31 días. Los contamos con los nudillos: son los largos.'),
    show('big-text', { text: 'abril · junio · septiembre · noviembre', sub: '30 días' }, 'Estos meses tienen 30 días. Están en los huecos entre nudillos. Febrero tiene 28 o 29 días.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'lunes, martes, miércoles, jueves, viernes, sábado y domingo' }, '¡Te toca! Cuenta los días uno a uno, empezando por el día siguiente a hoy.', { skills: ['cal:weekday'] }),
    tryIt('big-text', { text: 'unidades de tiempo' }, '¡Otra! Piensa en la unidad que piden y en cuántas partes pequeñas tiene. Si piden dos, repite la cuenta dos veces.', { skills: ['time:units'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'los nudillos y los huecos' }, '¡Tu turno! Cuenta los meses con los nudillos: los de los nudillos son largos, y los de los huecos, cortos.', { skills: ['cal:month'] }),
    tryIt('big-text', { text: 'lunes, martes, miércoles, jueves, viernes, sábado y domingo' }, '¡Tu turno! Cuenta los días uno a uno desde hoy: al llegar al domingo, vuelve el lunes.', { skills: ['cal:weekday'] }),
    tryIt('big-text', { text: 'unidades de tiempo' }, '¡Tu turno! Piensa en la unidad que piden y en cuántas partes pequeñas tiene cada una.', { skills: ['time:units'] }),
    tryIt('big-text', { text: 'días de un mes · unidades de tiempo' }, '¡Tu turno! Mira qué te piden: los días de un mes o cuántas partes pequeñas tiene una cantidad de tiempo.', { skills: ['cal:month', 'time:units'] }),
  ],
  cierre: show('big-text', { text: 'Los nudillos tienen 31 días', sub: 'Los huecos, 30 días; febrero, 28 o 29' }, 'La regla: los meses de los nudillos tienen 31 días y los de los huecos, 30. Febrero es la excepción.'),
})

/** The time classes (3.º): one per time topic of the temario. */
export const TIEMPO_CLASSES: ClassDef[] = [enPuntoMediaCuarto, reloj5Minutos, relojDigital, duraciones, calendario]
