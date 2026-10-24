# Matemáticas: completar el temario de 3.º y 4.º, de menos a más

Fecha: 24 de octubre de 2026. Fuente del temario: `docs/curriculum/TEMARIO_PERPLEXITY_3-4.md` (investigación con
Perplexity sobre el Real Decreto 157/2022 y el Decreto 61/2022 de Madrid). Después de esto viene Lengua, como proyecto
aparte.

## Por qué

La app ya cubre casi todo el temario habitual de 3.º y 4.º, pero le faltan temas que los libros y los colegios dan en
esos cursos (los más grandes: números hasta 99 999 y los decimales en 4.º). Una familia que ve el temario de su hijo y
no lo encuentra en el informe deja de confiar en la app. El objetivo es que el temario de cada curso esté completo y
que cada tema se aprenda **de menos a más**.

## Lo que pide el dueño (decidido)

- **Primero Matemáticas, luego Lengua.**
- **Cada tema de menos a más, por pasos.** El ejemplo del dueño: multiplicar empieza con una cifra (las tablas),
  sigue con 2 × 1 y luego pasa a 2 × 2. Nunca se salta un paso: el siguiente se abre cuando el anterior está dominado.
- **Siempre con botones de ayuda.** Toda actividad nueva tiene sus pistas, como las que ya hay, y las pistas
  **nunca dan la respuesta** (regla de siempre del proyecto).

## Objetivos

1. Añadir a cada curso los temas que faltan (lista abajo), con ejercicios, pistas, informe del adulto y lugar en las
   etapas del curso.
2. Ordenar cada tema en pasos de menos a más y que el plan diario no abra un paso hasta dominar el anterior.
3. Mover los temas que el temario pone en otro curso cuando haga falta (multiplicar por dos cifras empieza en 3.º).

## Fuera de alcance (no se hace ahora)

- 2.º de Primaria: el temario de Perplexity no lo incluye; se queda como está.
- Programación por bloques (4.º): es otra herramienta entera; se deja como tema **pendiente** en el informe.
- Comunicación oral, exposiciones y cosas que no se pueden practicar solo delante de una pantalla.
- Lengua (proyecto siguiente).

## Anti-objetivos (fallaría aunque funcione)

- Un tema nuevo que aparece de golpe en su paso más difícil.
- Una pista que dice el resultado o lo deja a un paso trivial.
- Cambiar el orden o las etapas de forma que un niño que ya va por la mitad del curso pierda su progreso o vea temas
  ya dominados como nuevos.
- Números negativos o contenidos de cursos superiores colados en los ejercicios.

## Cómo es hoy (para quien lo construya)

- El temario de cada curso son datos: `src/content/syllabus/grade3.ts` y `grade4.ts` (bloques → temas → peldaños de
  la escalera concreto / dibujo / números / uso, `PLAN_DOCENTE.md` §2) y un orden propio en ocho etapas por trimestre.
- Cada tema se mide con *skill keys* del motor (`src/engine/skills.ts`); los ejercicios se generan en `src/engine` y
  se pintan en `src/activities/views`. Un tema sin ejercicios puede existir como `pendiente` (sale en el informe y el
  plan lo salta).
- Las pistas y los trucos de Lumi ya existen (`src/engine/hints.ts`, `strategies.ts`, `PLAN_DOCENTE.md` §4).
- La prueba inicial (`src/engine/placement.ts`) elige ítems por curso.

## Temas que faltan y sus pasos

Los pasos van en orden; cada uno es una *skill* (o grupo de skills) que se domina antes de pasar al siguiente.

### 3.º

| Tema | Pasos de menos a más |
|---|---|
| Ordinales hasta el 30 | 1.º–10.º con una fila de objetos → hasta el 20.º → hasta el 30.º; leer y escribir (1.º ↔ primero) |
| Números de 5 cifras (introducción) | la decena de millar con bloques → leer y escribir hasta 20 000 → comparar |
| Doble y triple | doble de números pequeños → triple de números pequeños → doble y triple de decenas (30 → 60, 90) |
| Multiplicar por 2 cifras (introducción) | ya hay tablas → 2 × 1 sin llevada → 2 × 1 con llevada → 3 × 1; se añade **2 × 2 por partes** (23 × 14 = 23 × 10 + 23 × 4) al final del curso |
| La prueba de la resta | ya existe «Comprobar un resultado»; se enseña como «la prueba» con ese nombre |
| La prueba de la división | divisor × cociente + resto = dividendo, primero con divisiones exactas, luego con resto |
| Rectas, semirrectas y segmentos | reconocer con dibujo → elegir el nombre → contar segmentos en una figura |
| Ángulos agudos y obtusos | recto (ya existe) → mayor o menor que un recto → nombrarlos agudo / obtuso |
| Tablas de datos | leer una tabla de doble entrada → completar una tabla a partir de un recuento → pasar la tabla a un gráfico de barras |

### 4.º

| Tema | Pasos de menos a más |
|---|---|
| Números hasta 99 999 | la decena de millar → leer, escribir y descomponer → comparar y ordenar → redondear a millares → la recta con saltos de 10 000 |
| Sumas y restas combinadas | dos operaciones sin paréntesis de izquierda a derecha (25 + 10 − 5) → con números más grandes → problemas |
| Estimar resultados | redondear los dos números y operar → ¿es razonable este resultado? |
| Multiplicar por 2 y 3 cifras | 2 × 2 por partes (ya existe) → **2 × 2 en columna** → 3 × 2 por partes (ya existe) → **3 × 2 en columna** → **por 3 cifras en columna** |
| Propiedades | conmutativa (ya existe en 3.º) → asociativa (agrupar para que sea fácil: 2 × 7 × 5) → distributiva (es la multiplicación por partes, con su nombre) |
| Orden de las operaciones | multiplicar antes que sumar (3 + 2 × 4) → dividir antes que restar → con paréntesis |
| Dividir entre 2 cifras | ya existe; se revisa que vaya de divisores redondos (20, 30) a cualquiera |
| Décimas y centésimas | décimas con dibujo (una barra en 10 partes) → centésimas (cuadrícula de 100) → leer y escribir (0,3; 2,45) → comparar y ordenar → relación con euros y céntimos |
| Sumar y restar decimales | con una cifra decimal → con dos → en columna alineando la coma → problemas de dinero |
| Medida: múltiplos y submúltiplos | km, m, cm (ya existe) → añadir dm y mm → kg, g → mg → l, ml → cl, dl, kl → pasar de una unidad a otra, primero de un salto, luego de varios |
| Horas, minutos y segundos | 1 min = 60 s → pasar de minutos a segundos y al revés → duraciones con segundos |
| Clasificar triángulos y cuadriláteros | por los lados (equilátero, isósceles, escaleno) → por los ángulos → cuadriláteros (cuadrado, rectángulo, rombo, romboide, trapecio) |
| Simetría y traslación | simetría (ya existe) → traslación en cuadrícula (mover una figura n casillas) |
| Circunferencia: radio, diámetro, cuerda y arco | señalar cada elemento → el diámetro es dos radios |
| Caras, vértices y aristas | cubo → prismas → pirámides; contar en un dibujo que se puede girar |
| Frecuencia y moda | frecuencia (contar cuántas veces) → moda (ya existe) |
| Posible y probable | seguro / posible / imposible (ya existe) → más probable / menos probable con bolas en una bolsa |
| Signos = y ≠ | ¿son iguales los dos lados? (ya existe la igualdad flexible) → elegir = o ≠ |
| Presupuesto y ahorro | ¿me llega el dinero? → cuánto me falta / me sobra → elegir la compra más barata con un presupuesto |
| Problemas de varios pasos y comprobar si tiene sentido | dos pasos (ya existe) → tres pasos → ¿tiene sentido esta solución? |
| Programación por bloques | **pendiente** (solo en el informe) |

## Ayudas

- Cada tema nuevo trae pistas por pasos que llevan a la idea (el dibujo, el truco, la operación contraria) sin dar
  el resultado, igual que las actuales.
- Los pasos de dibujo (barras, cuadrículas, bloques) sirven a la vez de ayuda para el paso siguiente.

## Orden en el curso

Los temas nuevos entran en las etapas de cada curso donde encajan (por ejemplo, decimales después de fracciones y
junto a euros y céntimos; 2 × 2 en columna después de 2 × 2 por partes). El reparto exacto de etapas lo propone
quien lo construya, respetando el orden de los pasos y que cada etapa no crezca tanto que un mundo de la aventura se
haga eterno.

## Decisiones tomadas por Claude (el dueño puede cambiarlas)

- **Niños que ya van por la mitad del curso:** el dominio se guarda por *skill*, así que lo ya dominado sigue
  dominado. Los pasos nuevos aparecen como nuevos solo donde son *skills* nuevas; ningún tema se reabre entero.
  Si una etapa ya superada gana un paso nuevo, ese paso se practica en el repaso mezclado, sin bloquear al niño.
- **2 × 2 por partes en los dos cursos:** en 3.º como introducción al final del curso y en 4.º como repaso antes de
  la cuenta en columna. Es la misma *skill*, así que lo dominado en 3.º cuenta en 4.º.
- **Qué temario manda:** el de Perplexity, que el dueño ha dado como referencia. Es para toda España (Real Decreto
  157/2022) con Madrid como ejemplo. Lo que el decreto deja en el ciclo de 3.º y 4.º se reparte como dice esa tabla.

## Lo que se deja a quien lo construya

- Qué temas reutilizan una vista existente y cuáles necesitan una nueva.
- El nombre de las *skills* nuevas, siguiendo el formato de `skills.ts`.
- El reparto exacto en etapas.
- Qué ítems nuevos entran en la prueba inicial de cada curso (sin pasar de unos 20 ítems).
- El orden de implementación: se recomienda empezar por lo más grande de 4.º (99 999 y decimales) y por la
  multiplicación de menos a más, que es el ejemplo del dueño.
