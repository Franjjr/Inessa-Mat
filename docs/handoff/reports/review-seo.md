# Auditoría SEO y visibilidad en IA: repasitos.es

Fecha: 22-10-2026. Método: agente-seo (capas 0 a 3). Solo lectura: no se ha tocado el código.

Notas de método. El DNS local no resuelve repasitos.es ni www.repasitos.es, así que las pruebas en vivo usan
`curl --resolve repasitos.es:443:216.198.79.1`. No hay acceso a Search Console ni a Bing Webmaster, ni a herramientas
de pago: los volúmenes de búsqueda no están medidos y las cifras de competencia son orientativas (búsqueda web).

Marcas: ✅ verificado · ⚠️ parcial o a confirmar · ❌ fallo.

---

## Resumen de hallazgos clave

- ❌ La portada es una cáscara vacía para cualquiera que no ejecute JavaScript: `curl` de `/` y de `/welcome` devuelve
  solo «Cargando…», 0 etiquetas `<h1>`, 0 `og:`, 0 canonical y 0 JSON-LD. GPTBot, ClaudeBot y PerplexityBot no
  ejecutan JS en la mayoría de los casos, así que para ellos la web no tiene contenido.
- ❌ No hay sitemap.xml (404) ni llms.txt (404). robots.txt no declara sitemap.
- ❌ Todas las rutas comparten el mismo `<title>` (no hay título por ruta).
- ❌ Cualquier URL inventada responde 200 (soft 404), por el rewrite catch-all de vercel.json.
- ✅ http → https 308 y www → apex 308 (verificado en vivo, vía Vercel).
- ✅ robots.txt en vivo coincide con public/robots.txt; las zonas de niños y adultos están fuera.

---

## ERRORES

### E1. La portada no tiene contenido rastreable sin JavaScript (crítico)
- Dónde: index.html:20-22 (shell `#root` con «Cargando…»); toda la portada está en
  src/adult/welcome/WelcomeScreen.tsx, que es un componente React montado en el cliente.
- Qué pasa hoy (verificado en vivo): `GET https://repasitos.es/` y `/welcome` devuelven 200 con 1,8 KB de HTML,
  «Cargando…» como único texto, 0 `<h1>`. Google puede renderizar JS, pero con cola diferida (segunda ola) y en un
  dominio nuevo eso tarda. Bing y los rastreadores de IA no lo garantizan.
- Por qué importa: es la única página con valor de búsqueda; sin HTML del servidor no hay palabras clave indexadas
  ni citas de IA.
- Arreglo: generar una versión estática de `/welcome` con el texto real (H1, subtítulos, «¿Para quién es?», pasos,
  asignaturas, pie). Opción inmediata: `public/welcome/index.html` con el mismo contenido que WelcomeScreen y su
  propio `<head>` (título, description, canonical, OG, JSON-LD). Vercel sirve los ficheros estáticos antes que el
  rewrite, así que `/welcome` llega ya renderizada; luego React la sustituye en el cliente. Coste: mantener el texto
  en dos sitios. Opción después: prerender automático tras `vite build` con Playwright (un script en tools/).

### E2. Sin sitemap.xml
- Dónde: no existe `public/sitemap.xml` (verificado: `https://repasitos.es/sitemap.xml` → 404).
- Arreglo: crear `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://repasitos.es/welcome</loc><lastmod>2026-10-22</lastmod></url>
  <url><loc>https://repasitos.es/legal/privacidad</loc><lastmod>2026-10-22</lastmod></url>
</urlset>
```
  Y añadir al final de public/robots.txt (ver E4): `Sitemap: https://repasitos.es/sitemap.xml`.
  Ojo: `/` no se incluye, porque para un visitante anónimo redirige a `/welcome` (src/app/EntryScreen.tsx:11).

### E3. Sin llms.txt (la convención está muy extendida, pero no es un estándar del W3C)
- Verificado: `https://repasitos.es/llms.txt` → 404.
- Arreglo: crear `public/llms.txt`:
```
# Repasitos

> Repasitos es una app web en español para que niños de 7 a 9 años repasen tablas de multiplicar, sumas, restas y divisiones con un juego de aventuras. La familia o el colegio ven qué domina cada niño. Se puede probar sin cuenta.

## Páginas
- [Portada y explicación](https://repasitos.es/welcome): qué es, para quién es, cómo funciona y asignaturas (~1.500 tokens)
- [Privacidad y datos](https://repasitos.es/legal/privacidad): qué datos se guardan, para qué y cómo borrarlos

## Notas
- Dirigida a niños de 7 a 9 años; las cuentas las gestionan los adultos.
- Matemáticas disponible; Lengua, Inglés, Ciencias e Historia, próximamente.
```
  Mantener al día: si cambia una página o una asignatura, cambiar este fichero.

### E4. robots.txt incompleto
- Dónde: public/robots.txt (líneas 2-9). Verificado en vivo, igual que el fichero local.
- Qué falta: (a) `Sitemap:`; (b) `/login` y `/signup` quedan rastreables (páginas sin contenido que pueden
  indexarse como finas); (c) la decisión sobre rastreadores de IA no está escrita.
- Arreglo exacto (sustituye el fichero completo):
```
# Repasitos es una app para niños: las zonas de niños y de adultos quedan fuera de los buscadores.
User-agent: *
Allow: /$
Allow: /welcome
Allow: /legal/
Disallow: /kids
Disallow: /play
Disallow: /adult
Disallow: /dev/
Disallow: /login
Disallow: /signup

# Rastreadores de IA: permitidos (generan citas y visitas). Decisión del dueño, documentada aquí.
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /$
Allow: /welcome
Allow: /legal/
Disallow: /kids
Disallow: /play
Disallow: /adult
Disallow: /dev/
Disallow: /login
Disallow: /signup

Sitemap: https://repasitos.es/sitemap.xml
```
  Nota: con reglas por agente, cada bloque debe repetir las `Disallow`. Google-Extended, Applebot-Extended y CCBot
  siguen el bloque `*`: si el dueño quiere bloquearlos, añadir su bloque con `Disallow: /`.

### E5. Un único `<title>` y `description` para todas las rutas
- Dónde: index.html:15 (description) y index.html:17 (title). No hay ningún `document.title` en src (verificado con grep).
- Qué pasa: `/legal/privacidad` y `/welcome` tienen el mismo título, y el de la app (`/kids`) también, aunque no se
  indexen.
- Arreglo (mínimo, sin dependencias): hook `src/app/useDocumentMeta.ts` que fije `document.title` y la meta description
  en un `useEffect` por pantalla. En la portada y en privacidad, con estos textos:
  - `/welcome`: «Repasitos: repasar tablas y operaciones de 7 a 9 años»
  - `/legal/privacidad`: «Privacidad y datos · Repasitos»
  El fallback de index.html se queda como está.

### E6. Soft 404: cualquier URL responde 200
- Dónde: vercel.json:6 (`"source": "/((?!assets/|api/|.*\\..*).*)"`, rewrite a `/index.html` para todo).
- Verificado: `https://repasitos.es/xyz-no-existe` → 200. Además, routes.tsx:81 redirige el resto a `/`, así que
  Google ve miles de URL falsas duplicadas que acaban en la portada.
- Arreglo: limitar el rewrite a las rutas de la app y añadir una página 404 real:
```json
"rewrites": [
  { "source": "/", "destination": "/index.html" },
  { "source": "/(welcome|login|signup|kids|play|adult|legal|dev)(/.*)?", "destination": "/index.html" }
]
```
  Y crear `public/404.html` con `<meta name="robots" content="noindex">`, un `<title>` propio y un enlace a `/welcome`.
  Verificar después de desplegar: `/xyz-no-existe` debe dar 404, y `/welcome`, `/kids` y `/play/w/w1` deben seguir dando 200.
  (Comprobar que la sintaxis de rewrite de Vercel acepta el grupo; si no, enumerar las rutas una a una.)

### E7. Sin Open Graph, Twitter Card ni imagen para compartir
- Dónde: index.html (ausente; el head termina en la línea 18). Ni `og:` ni `twitter:` en src ni en public (verificado).
- Qué pasa: compartir en WhatsApp, Facebook, X o LinkedIn muestra solo el título genérico, sin imagen.
- Arreglo: en index.html, después de la línea 15:
```html
<link rel="canonical" href="https://repasitos.es/welcome" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Repasitos" />
<meta property="og:locale" content="es_ES" />
<meta property="og:title" content="Repasitos: repasar tablas y operaciones de 7 a 9 años" />
<meta property="og:description" content="Repasa tablas de multiplicar, sumas, restas y divisiones con un juego de aventuras. Prueba sin cuenta." />
<meta property="og:url" content="https://repasitos.es/welcome" />
<meta property="og:image" content="https://repasitos.es/og/repasitos-1200x630.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Repasitos: repasar tablas y operaciones de 7 a 9 años" />
<meta name="twitter:description" content="Repasa tablas de multiplicar, sumas, restas y divisiones con un juego de aventuras. Prueba sin cuenta." />
<meta name="twitter:image" content="https://repasitos.es/og/repasitos-1200x630.png" />
```
  La imagen `public/og/repasitos-1200x630.png` no existe: hay que crearla (1200×630, Lumi y el título). Sin ella, el enlace
  no tendrá miniatura. Mientras tanto, quitar las dos líneas `og:image` y `twitter:image`.
  Nota: la canonical de arriba está en el shell, así que se aplica a todas las rutas (incluidas las de la app). Como
  esas rutas van con `Disallow`, no hay daño de indexación, pero lo correcto es que la canonical salga solo en la
  versión estática de `/welcome` (E1) y no en el shell. Si se aplica E1, quitar la canonical de index.html.

### E8. Títulos y descripción sin palabras de búsqueda
- Dónde: index.html:15 y :17.
- Qué pasa hoy: «Repasitos · Aventuras matemáticas» no contiene ninguna consulta que busque una familia o un profesor.
  La description empieza por el nombre de marca (bien para marca, pobre para consulta genérica).
- Propuesta con las consultas reales (ver PROPUESTAS P6): título «Repasitos: repasar tablas y operaciones de 7 a 9 años»
  (53 caracteres); description «Repasitos ayuda a repasar tablas de multiplicar, sumas, restas y divisiones con un juego
  de aventuras para niños de 7 a 9 años. Prueba sin cuenta.» (≈150 caracteres).

### E9. La imagen del héroe se carga en diferido (afecta a LCP)
- Dónde: src/adult/welcome/WelcomeScreen.tsx:89 (`loading="lazy"` en la captura de la portada, que está en el primer
  pliegue en escritorio y en móvil).
- Arreglo: en esa línea, `loading="eager"` y `fetchPriority="high"` (`decoding="async"` se queda). Las capturas
  siguientes (líneas 185 y 198) sí pueden seguir en `lazy`.
```tsx
<img src={SHOTS.home.src} width={SHOTS.home.width} height={SHOTS.home.height}
     loading="eager" fetchPriority="high" decoding="async" alt="…" />
```

### E10. El zoom del móvil está bloqueado (accesibilidad; afecta a la valoración de móvil)
- Dónde: index.html:8 (`maximum-scale=1.0, user-scalable=no`).
- Por qué importa: impide ampliar el texto (WCAG 1.4.4 y 1.4.10). Lighthouse lo marca, y las personas con baja visión
  salen de la web.
- Arreglo: `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`. Revisar si la app depende del
  bloqueo para evitar gestos en el juego (mejor `touch-action` en el lienzo que bloquear el zoom en toda la página).

### E11. Datos del responsable visibles en la política de privacidad (aviso al dueño, no es SEO)
- Dónde: src/adult/legal/PrivacyScreen.tsx:21 (calle y localidad del responsable, junto al nombre y el correo).
- Por qué importa: la dirección postal de una persona física queda indexada y pública. Revisar si es necesaria
  (un apartado o una razón social lo evitarían). Lo decide el dueño; no lo he cambiado.

### E12. Documento de revisión desactualizado (aviso)
- Dónde: docs/handoff/reports/review-marketing.md:14 recomienda la franja «Sin publicidad». El dueño la ha retirado
  (último commit: «remove the no-advertising claims»). No reintroducir ese texto en ninguna superficie, ni en
  el título, la description ni los datos estructurados.

---

## PROPUESTAS (priorizadas: impacto alto → bajo; esfuerzo: B = bajo, M = medio, A = alto)

### Fase 1, días 1-3

**P1. Verificar propiedad en Google Search Console y Bing Webmaster Tools, y enviar el sitemap.** Esfuerzo B · impacto alto
(sin ello no hay medición). Requiere que el dueño pegue el código de verificación (meta o registro TXT en el DNS).

**P2. Sitemap, robots y 404 (E2, E4, E6).** Esfuerzo B · impacto alto. Es el paquete más barato de rastreo.

**P3. Versión estática de /welcome con contenido real y su propio `<head>` (E1).** Esfuerzo M · impacto alto: es la
única página que puede posicionarse y citarse. Incluye title, description, canonical, OG y JSON-LD (P5).

### Fase 2, días 3-7

**P4. Títulos por ruta (E5) y OG/Twitter (E7).** Esfuerzo B · impacto medio-alto. Crear antes la imagen OG 1200×630.

**P5. Datos estructurados (JSON-LD) en la versión estática de /welcome.** Esfuerzo B · impacto medio. Propuesta:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://repasitos.es/#organization",
      "name": "Repasitos",
      "url": "https://repasitos.es/",
      "email": "mailto:contact@falkir.es"
    },
    {
      "@type": "WebSite",
      "@id": "https://repasitos.es/#website",
      "url": "https://repasitos.es/",
      "name": "Repasitos",
      "inLanguage": "es-ES",
      "publisher": { "@id": "https://repasitos.es/#organization" }
    },
    {
      "@type": "SoftwareApplication",
      "name": "Repasitos",
      "url": "https://repasitos.es/welcome",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Navegador web",
      "inLanguage": "es-ES",
      "description": "Juego de aventuras para repasar tablas de multiplicar, sumas, restas y divisiones, para niños de 7 a 9 años.",
      "audience": { "@type": "EducationalAudience", "educationalRole": "student", "audienceType": "Niños de 7 a 9 años" },
      "publisher": { "@id": "https://repasitos.es/#organization" }
    }
  ]
}
</script>
```
  Antes de publicar: (a) confirmar con el dueño el nombre legal y el correo que se muestran (la política dice
  «Fran Julian» y el correo es contact@falkir.es; no inventar razón social); (b) no añadir `offers` hasta saber el precio
  real (la portada dice «Probar sin cuenta», no un precio). Validar con el validador de datos estructurados de Google
  y comprobar que lo marcado aparece en la página.

**P6. Lenguaje de la portada con consultas reales.** Esfuerzo B · impacto medio-alto. Consultas que encontré en la
búsqueda web (sin volúmenes medidos): «repasar tablas de multiplicar juego online primaria app» y «juegos matemáticas
primaria 7 8 años app colegio repaso». Competencia visible: Educación 3.0 (artículos de recursos), Genbeta,
Common Sense Media, Matlapp, Educapeques, Math Workout, Bmath, DragonBox y Sushi Monster. Ninguna es una web de
un proyecto de este tipo en primera posición, lo que deja hueco para una página propia con esas palabras.
  - Añadir un subtítulo o bloque visible (H2) con: «Juego para repasar tablas de multiplicar, sumas, restas y divisiones en 2.º y 3.º de primaria» (sin cambiar la voz de marca del H1, que es del dueño).
  - Palabras a usar de forma natural: tablas de multiplicar, repasar matemáticas, juegos de matemáticas, primaria, 7 a 9 años, para casa y para el colegio.
  - Crear luego una página por tema (p. ej. `/tablas-de-multiplicar`, `/sumas-y-restas`) solo cuando el contenido real
    exista. No crear páginas vacías. Antes, revisar canibalización: la portada y las páginas de tema no pueden competir
    por la misma consulta (regla de agente-seo).

**P7. Imagen OG y JSON-LD de la imagen.** Esfuerzo B · impacto medio. Ya cubierto en E7.

**P8. llms.txt (E3) y decisión explícita sobre rastreadores de IA (E4).** Esfuerzo B · impacto bajo-medio hoy, creciente.
Mantener el fichero al día cada trimestre.

### Fase 3, días 7-30

**P9. Rendimiento de la portada.** Esfuerzo M · impacto medio. Medidas en el build local: el chunk principal
`index-*.js` pesa 583 KB sin comprimir (185 KB con gzip), y el chunk de WelcomeScreen se carga aparte. Es recomendable
medir Core Web Vitals con datos de campo cuando haya tráfico (Search Console, Chrome UX Report) antes de optimizar
más. Objetivos: LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Las imágenes ya tienen `width` y `height` (buen CLS).
Además, precargar solo la fuente Baloo2-800 (index.html:16): comprobar si la portada usa otros pesos.

**P10. Página de privacidad con su propio título y sin datos personales innecesarios (E11, E5).** Esfuerzo B · impacto bajo.

**P11. Enlaces externos y autoridad (no tocar hasta tener analítica).** Esfuerzo A · impacto alto a medio plazo.
Ideas que encajan con la marca y no requieren al dueño dando la cara: nota de prensa sin firma personal sobre el
proyecto («Repasitos, juego para repasar tablas en primaria, ya disponible sin cuenta»), inclusión en directorios de
recursos educativos (p. ej. listados de apps para colegios), contacto con blogs de recursos para familias que ya
publican listas de apps de tablas. Sin esquemas de enlaces.

**P12. Preguntas frecuentes en la portada (FAQPage).** Esfuerzo B · impacto medio para citas de IA. Preguntas
que haría una familia: «¿Para qué edad es?», «¿Hace falta cuenta?», «¿Qué pasa con los datos del niño?», «¿Sirve para
el colegio?». Respuestas cortas, con el dato exacto (7 a 9 años; sí se puede probar sin cuenta; los datos se pueden
exportar o borrar; sí, las clases tienen código).

**P13. Medición continua.** Esfuerzo B · impacto alto. Revisión mensual de Search Console (impresiones y consultas
de la portada), y repetir la batería de consultas en ChatGPT, Claude, Gemini y Perplexity a los 30 días
(sin garantizar citas; respuestas no deterministas).

---

## Lo que ya funciona (✅)
- ✅ `lang="es"` en html; meta charset y viewport presentes.
- ✅ http → https y www → apex: 308 verificados en vivo.
- ✅ robots.txt en vivo responde 200 y las zonas de niños y de adultos quedan fuera.
- ✅ Imágenes de la portada con `alt` descriptivo, `width`/`height` (buen CLS) y `decoding="async"`.
- ✅ Estructura de encabezados de la portada: un único H1 visible, H2 por sección.
- ✅ Manifest con `lang: 'es'`, nombre y descripción coherentes (vite.config.ts:38-53).
- ✅ Sin referencias a «sin publicidad» en la portada actual (verificado con grep).

## Pendientes de confirmar con el dueño
- Razón social y correo público para Organization (E11, P5).
- Si `/welcome` debe ser la URL canónica (recomendado) o si prefiere `/` (exige cambiar la lógica de EntryScreen).
- Si la portada de producción muestra el aviso «las cuentas no están disponibles todavía» (WelcomeScreen.tsx:77-78):
  depende de que el despliegue tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. No he podido comprobarlo (sin CLI de
  Vercel autenticado). Si falta, la portada indexable dice eso.
- Autorización para generar la imagen OG (1200×630) con Lumi.
