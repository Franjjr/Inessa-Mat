# Caligrafía con lápiz: letra ligada al final de Lengua

Fecha: 29 de octubre de 2026. Sigue a `2026-10-27-lengua-3-design.md`, que dejó la caligrafía como proyecto aparte.

## Por qué

El dueño quiere que la app ayude a su hija a escribir mejor a mano. Con sus palabras: «una parte de caligrafía,
opcional, para que lo hagan solo si tienen lápiz, y es seguir contorno y analizar lo bien que se ha escrito». A su hija
le cuesta «de todo un poco»: la forma de algunas letras, unirlas, el tamaño y la línea, la velocidad.

Lo que le haría torcer el gesto: que la app sea **demasiado blanda** y no la corrija de verdad.

## Lo que ha decidido el dueño

- Solo con **tablet y lápiz**. Sin lápiz, la caligrafía no aparece.
- **Letra ligada** (la que usa su hija en el cole).
- Va **al final de la sesión de Lengua**, como un rato opcional.
- Se practica **siguiendo el contorno** y la app **analiza lo bien que se ha escrito**.
- La corrección es **exigente**: mejor que corrija de más que de menos.

## Objetivos

1. Un modelo de letra ligada para las minúsculas, las mayúsculas y los enlaces, con el trazo de cada letra como línea
   central ordenada: punto de inicio, dirección y orden de los trazos. No vale una fuente de contorno sin más: la app
   necesita saber por dónde va el trazo para corregirlo.
2. **Una práctica de unos 5 minutos** al final de la sesión de Lengua, con un botón «Caligrafía (con lápiz)» y otro
   «Ahora no». Solo se ofrece si el aparato tiene lápiz (el modo de entrada ya detecta el lápiz, `pointerType === 'pen'`)
   y el adulto no la ha desactivado.
3. Cada letra, enlace o palabra se trabaja en tres pasos sobre una **pauta de dos líneas**, como la de su cuaderno:
   - **Mirar:** Lumi traza el modelo despacio, con el punto de inicio y flechas de dirección.
   - **Repasar:** la niña sigue el contorno gris con el lápiz. Si se sale mucho o va en sentido contrario, se le marca en
     el momento.
   - **Escribir sola:** dos o tres veces sin contorno.
4. **La nota**, de una a tres estrellas, mide cuatro cosas:
   - **Forma:** se parece al modelo.
   - **Línea:** apoya en la línea de la pauta.
   - **Tamaño:** cabe en la pauta, ni grande ni pequeña.
   - **Inicio y dirección:** empieza por el sitio correcto y va hacia donde toca.

   Después dice **una sola cosa** que mejorar, concreta («la o se te queda abierta arriba», «la l pasa de la línea de
   arriba»). Tres estrellas solo cuando está bien de verdad.
5. **Progresión de menos a más:**
   - minúsculas agrupadas por familias de trazo (redondas: a, o, d, g, q, c; de bucle: l, b, h, k, f; de puente: m, n,
     ñ, v, w; las demás);
   - enlaces de dos letras (br, os, la…);
   - palabras cortas y después frases cortas;
   - las mayúsculas al final.
6. Lo que le sale peor se repite más, con el mismo dominio por *skill* que Matemáticas y Lengua (prefijo propio, por
   ejemplo `cal:`), y sin mezclarse con las *skills* de Lengua.
7. En la ficha del adulto, una sección de caligrafía: qué letras domina, cuáles le cuestan y en qué falla más (forma,
   línea, tamaño, inicio).
8. En la zona de adultos, un interruptor para activar o desactivar la caligrafía de ese niño.

## Fuera de alcance

- Letra de imprenta (se puede añadir después con el mismo sistema).
- Escribir con el dedo o con ratón.
- Reconocer letra libre: la app corrige lo que pidió escribir, no adivina lo que el niño quiso escribir.
- Caligrafía de 4.º u otros cursos (el contenido sirve igual).

## Anti-objetivos

- **Demasiado blanda:** dar tres estrellas a una letra mal hecha, o elogios genéricos. La nota debe distinguir una letra
  correcta de una casi correcta.
- Desanimar sin explicar: cada nota baja lleva qué mejorar y se puede repetir enseguida.
- Que tape la sesión de Lengua: es opcional, al final y no cuenta para las estrellas de sesión de Lengua.
- Que salga sin lápiz o en un ordenador.
- Lenguaje inclusivo (masculino genérico).
- Romper la escritura de números con lápiz que ya existe (`src/ink/`).

## Decisiones de Claude (el dueño puede cambiarlas)

- La práctica dura unos 5 minutos: dos o tres letras o enlaces nuevos o flojos, cada uno con sus tres pasos.
- El modelo de letra ligada es uno propio y estándar de Primaria en España: enlazado, con bucles en las letras altas y
  mayúsculas sencillas. Si el dueño manda una foto del cuaderno de su hija, se ajustan las letras que difieran.
- La caligrafía tiene sus propias estrellas: se suman al mismo monedero, como las de las dos asignaturas.
- Se aprovecha lo que ya existe para trazar números con lápiz: `TraceDigit`, `ModelDigit`, la captura de trazos y el
  rechazo de la palma.
- Las notas se calculan en el aparato, sin enviar los trazos a ningún servidor. Se guardan el resultado y la nota, no el
  dibujo.

- **Tiempo:** los 5 minutos de caligrafía van **después** de los 15 de Lengua, no dentro: el planificador de Lengua no
  cambia y la caligrafía tiene su propio plan.
- **Cuándo hay lápiz:** el botón sale en un aparato donde ya se ha usado el lápiz alguna vez (`penSeen` de
  `src/ink/policy.ts`) o cuyo modo de entrada es lápiz. Además, el interruptor del adulto puede desactivarla para ese
  niño. En un aparato donde nunca se ha usado el lápiz, no sale.
- **Ajuste de la nota con trazos reales:** los umbrales se dejan en un solo archivo de configuración. Antes de darlos
  por buenos, la niña prueba una página de ensayo y el dueño dice si las estrellas le parecen justas; se ajustan con
  esos trazos.

## Lo que queda para quien lo construya

- Cómo se dibuja y se guarda el modelo de cada letra (trazos, puntos de control) y cómo se enlazan las letras en una
  palabra.
- El algoritmo de comparación y los umbrales de cada estrella. Deben ser exigentes y probarse con trazos buenos, casi
  buenos y malos.
- El orden exacto de las letras y los enlaces.
- El diseño de la pantalla en tablet horizontal y vertical.
