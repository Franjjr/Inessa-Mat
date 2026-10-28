/* Clases de dinero de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato que las
   demás: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una frase que resume la
   regla. Las prácticas usan solo habilidades de su propio tema, y su texto sirve para todas las variantes del generador
   (src/engine/money.ts). Las piezas que se dibujan son monedas y billetes reales del euro. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Monedas y billetes: el número impreso es el valor de cada pieza. */
const monedasBilletes = clase({
  id: 'c3-dinero-monedas-billetes',
  topicId: 'monedas-billetes',
  title: 'Monedas y billetes',
  para: [
    show('money', { items: '200' }, 'Esta moneda tiene impreso 2 €: vale dos euros.', 'frog'),
    show('money', { items: '500' }, 'Este billete tiene impreso 5 €: vale cinco euros. Los billetes son de papel y de colores.', 'ladybug'),
  ],
  ejemplo: [
    show('money', { items: '1,2,5' }, 'Estas monedas son de cobre y valen céntimos: 1 céntimo, 2 céntimos y 5 céntimos.'),
    show('money', { items: '10,20,50' }, 'Estas monedas son doradas: 10 céntimos, 20 céntimos y 50 céntimos.'),
    show('money', { items: '100,200' }, 'La moneda de 1 € tiene el borde plateado y el centro dorado. La de 2 € es al revés: borde dorado y centro plateado.'),
    show('money', { items: '500,1000,2000,5000' }, 'Los billetes de 5 €, 10 €, 20 € y 50 € son de papel y de colores distintos.'),
  ],
  guiada: [
    tryIt('money', { items: '200,50' }, '¡Te toca! Mira el número que lleva impreso: ese número es su valor.', { skills: ['money:recognise'] }),
    tryIt('money', { items: '500' }, '¡Otra! Si es un billete, es de papel y de colores; si es una moneda, es de metal. Mira también el número.', { skills: ['money:recognise'] }),
  ],
  sola: [
    tryIt('money', { items: '20' }, '¡Tu turno! Lee el número que tiene impreso la moneda o el billete.', { skills: ['money:recognise'] }),
    tryIt('money', { items: '1000' }, '¡Tu turno! Fíjate en el valor impreso, aunque la pieza sea pequeña.', { skills: ['money:recognise'] }),
    tryIt('money', { items: '100' }, '¡Tu turno! Las monedas de céntimos también tienen su valor escrito: léelo con calma.', { skills: ['money:recognise'] }),
  ],
  cierre: show('money', { items: '200,500' }, 'La regla: cada moneda y cada billete tiene impreso su valor. Mira el número.'),
})

/* Pagar justo y dar el cambio: con las piezas que suman el precio, o con un billete que cubre más y lo que sobra. */
const pagarCambio = clase({
  id: 'c3-dinero-pagar-cambio',
  topicId: 'pagar-cambio',
  title: 'Pagar y dar el cambio',
  para: [
    show('money', { items: '100,20,10,5', price: 135 }, 'Un zumo cuesta 1,35 €. Podemos pagarlo justo con 1 €, 20 céntimos, 10 céntimos y 5 céntimos: no sobra nada.', 'frog'),
    show('money', { items: '500', price: 120 }, 'Un helado cuesta 1,20 €. Si pagamos con un billete de 5 €, nos dan el cambio.', 'ladybug'),
  ],
  ejemplo: [
    show('money', { items: '100,20,10,5', price: 135 }, 'Pagar justo es poner monedas que sumen el precio: 1 € + 20 céntimos + 10 céntimos + 5 céntimos = 1,35 €.'),
    show('money', { items: '500', price: 120 }, 'Con un billete de 5 € y un helado de 1,20 €, el cambio es lo que sobra de los 5 €.'),
    show('money', { items: '500', price: 120 }, 'Para contar el cambio, empezamos en 1,20 € y subimos: 80 céntimos hasta 2 €, y 3 € más hasta 5 €. En total, 3,80 €.'),
    show('money', { items: '1000', price: 650 }, 'Con un billete de 10 € y un cómic de 6,50 €, el cambio es 3,50 €: 6,50 € + 3,50 € = 10 €.'),
  ],
  guiada: [
    tryIt('money', { items: '200,50' }, '¡Te toca! Pon en la bandeja monedas y billetes que sumen justo el precio.', { skills: ['money:pay'] }),
    tryIt('money', { items: '500', price: 120 }, '¡Otra! Lee el precio y con qué billete paga. Después cuenta cuánto le devuelven.', { skills: ['money:change'] }),
  ],
  sola: [
    tryIt('money', { items: '200' }, '¡Tu turno! Paga justo: ni te pases ni te quedes corto.', { skills: ['money:pay'] }),
    tryIt('money', { items: '1000', price: 650 }, '¡Tu turno! Mira el precio y con qué billete paga, y calcula lo que le devuelven.', { skills: ['money:change'] }),
    tryIt('money', { items: '500' }, '¡Tu turno! Mira primero si te piden pagar justo o cuánto te devuelven.', { skills: ['money:pay', 'money:change'] }),
    tryIt('money', { items: '200,100' }, '¡Tu turno! Cuando pagues, compruébalo cuenta a cuenta antes de seguir.', { skills: ['money:pay'] }),
  ],
  cierre: show('money', { items: '500', price: 120 }, 'La regla: si el dinero que das es igual al precio, pagas justo; si das más, el cambio es lo que sobra.'),
})

/* Sumar precios y comparar: los euros se suman con los euros y los céntimos con los céntimos; para comparar, primero los euros. */
const sumarPrecios = clase({
  id: 'c3-dinero-sumar-precios',
  topicId: 'sumar-precios',
  title: 'Sumar precios y comparar',
  para: [
    show('money', { items: '200,50' }, 'Un bocadillo cuesta 2,50 €: 2 € y 50 céntimos.', 'frog'),
    show('money', { items: '100,50,20,10' }, 'Un cuaderno cuesta 1,80 €: 1 €, 50 céntimos, 20 céntimos y 10 céntimos. ¿Cuánto pagamos por los dos?', 'ladybug'),
  ],
  ejemplo: [
    show('money', { items: '200,50,100,50,20,10' }, 'Un bocadillo de 2,50 € y un cuaderno de 1,80 €: juntos son 4,30 €.'),
    show('money', { items: '200,50,100,50,20,10' }, 'Primero sumamos los céntimos: 50 + 80 = 130 céntimos. Como pasan de 100, 100 céntimos son 1 €, y quedan 30 céntimos.'),
    show('money', { items: '200,100,100,20,10' }, 'Después sumamos los euros: 2 € + 1 € + 1 € (el euro que salió de los céntimos) = 4 €. El total es 4,30 €.'),
    show('money', { items: '200,50,100,50,20,10' }, 'Un bocadillo de 2,50 € y un cuaderno de 1,80 €. Para comparar precios, mira primero los euros: 2,50 € tiene 2 € y 1,80 € tiene 1 €. Como 2 € es más que 1 €, el bocadillo es el más caro.'),
  ],
  guiada: [
    tryIt('money', { items: '200,50' }, '¡Te toca! Suma los euros con los euros y los céntimos con los céntimos.', { skills: ['money:add'] }),
    tryIt('money', { items: '100,50' }, '¡Otra! Para comparar, mira primero los euros; si son iguales, mira los céntimos.', { skills: ['money:compare'] }),
  ],
  sola: [
    tryIt('money', { items: '200,50,100,20' }, '¡Tu turno! Suma todos los precios, también los que tienen céntimos.', { skills: ['money:add'] }),
    tryIt('money', { items: '100,50' }, '¡Tu turno! Si los céntimos pasan de 100, cambia 100 céntimos por 1 € y sigue sumando los euros.', { skills: ['money:add'] }),
    tryIt('money', { items: '200,20' }, '¡Tu turno! Lee los dos precios con calma y elige según te pidan: cuál cuesta más o cuál cuesta menos.', { skills: ['money:compare'] }),
    tryIt('money', { items: '100,50' }, '¡Tu turno! Mira qué te piden: un total, o cuál cuesta más o menos.', { skills: ['money:add', 'money:compare'] }),
  ],
  cierre: show('money', { items: '200,50,100,50,20,10' }, 'La regla: los euros se suman con los euros y los céntimos con los céntimos. Si los céntimos pasan de 100, se cambian por 1 €.'),
})

/* Euros y céntimos: un euro son cien céntimos; de euros a céntimos se multiplica por cien, y de céntimos a euros se cuentan
   los grupos de cien. */
const eurosCentimos = clase({
  id: 'c3-dinero-euros-centimos',
  topicId: 'euros-centimos',
  title: 'Euros y céntimos',
  para: [
    show('money', { items: '100' }, 'Un euro es una moneda de 1 €. Un euro tiene cien céntimos.', 'frog'),
    show('money', { items: '100,100,50' }, 'Dos monedas de 1 € y una de 50 céntimos son 2,50 €. En céntimos, son 250.', 'ladybug'),
  ],
  ejemplo: [
    show('money', { items: '100,100,100' }, 'Tres monedas de 1 €: son 3 €. Cada euro son 100 céntimos, así que 3 € son 300 céntimos.'),
    show('money', { items: '200,20,10,5' }, '2,35 € son 235 céntimos: 2 € son 200 céntimos, y 35 céntimos se suman: 200 + 35 = 235.'),
    show('money', { items: '100,20,5' }, '125 céntimos son 1 € y 25 céntimos: se escribe 1,25 €. Cada cien céntimos forman un euro.'),
    show('money', { items: '100,100,50' }, 'Para pasar de céntimos a euros, cuenta los grupos de cien: 250 céntimos tienen dos grupos de cien, son 2 €, y quedan 50 céntimos: 2,50 €.'),
  ],
  guiada: [
    tryIt('money', { items: '100,50' }, '¡Te toca! Mira la pregunta: ¿piden céntimos o euros? Recuerda que un euro son cien céntimos.', { skills: ['money:convert'] }),
    tryIt('money', { items: '100,100' }, '¡Otra! Si te piden céntimos, cuenta cien por cada euro. Si te piden euros, cuenta grupos de cien céntimos.', { skills: ['money:convert'] }),
  ],
  sola: [
    tryIt('money', { items: '200' }, '¡Tu turno! Lee la pregunta con calma: ¿piden céntimos o euros?', { skills: ['money:convert'] }),
    tryIt('money', { items: '100,50' }, '¡Tu turno! Un euro tiene cien céntimos: piensa en eso antes de contar.', { skills: ['money:convert'] }),
    tryIt('money', { items: '100,20,5' }, '¡Tu turno! Haz la cuenta despacio: la pregunta dice si quiere euros o céntimos.', { skills: ['money:convert'] }),
  ],
  cierre: show('money', { items: '100,100,50' }, 'La regla: un euro son cien céntimos. Para pasar de céntimos a euros, cada cien forman un euro, y lo que sobra son céntimos.'),
})

/** The money classes (3.º): one per money topic of the temario. */
export const DINERO_CLASSES: ClassDef[] = [monedasBilletes, pagarCambio, sumarPrecios, eurosCentimos]
