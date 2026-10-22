# Auditoría de seguridad · Repasitos (repo Inessa-Mat)

**Fecha**: 2026-10-22 · **Alcance**: código del repo en `main` (commit `02b2d0c`), historial git, migraciones y suite RLS, función `api/tts.ts`, `vercel.json`, `vite.config.ts`, service worker, gate de adultos, dependencias.
**Método**: revisión estática, búsqueda de secretos en árbol e historial, lectura de políticas RLS y RPC, prueba local del handler de TTS con `fetch` de Azure simulado, suite RLS local (`bash supabase/tests/run.sh`), `npm audit --omit=dev`.
**Límites**: sin acceso a producción ni a Supabase real (no se resuelve `repasitos.es` desde este entorno, así que las cabeceras reales no se han podido comprobar). No se ha reproducido audio ni se ha llamado a Azure real.

## Resumen ejecutivo

- **Secretos**: limpio. No hay claves privadas, `service_role` ni la clave de Azure en el árbol ni en el historial (`git log -p --all`). `.env.local` nunca se ha commiteado; en el commit de scaffold solo entró `.env.example`. La clave de Azure no aparece en `dist/`. La clave pública de Supabase aparece en `docs/HANDOFF.md:88` y `:98`, lo cual es aceptable por diseño.
- **Dependencias**: `npm audit --omit=dev` devuelve 0 vulnerabilidades.
- **XSS**: sin sumideros peligrosos. No hay `dangerouslySetInnerHTML`. El único `innerHTML` (`src/fx/celebrate.ts:268`) recibe un SVG constante. Los apodos se pintan como texto de React.
- **Migraciones y RLS**: sólidas. Todas las funciones `security definer` tienen `set search_path = ''`. Las RPC están revocadas para `anon`. La suite local pasa 192/192.
- **Problemas reales**: el endpoint `/api/tts` es un proxy gratuito y sin límite de uso (ERROR 1). Las cabeceras de seguridad no existen (ERROR 3). El PIN del adulto es brute-forceable offline (ERROR 4). Los profesores ven y pueden escribir todos los niños de su colegio (ERROR 6). No existe borrado de cuenta del adulto (ERROR 7).

---

## ERRORES

### E1. `/api/tts` es un proxy de TTS gratis y sin límite (ALTA · disponibilidad y coste)
- **Archivo**: `api/tts.ts:20` (ALLOWED_HOSTS), `api/tts.ts:37-45` (allowedCaller), `api/tts.ts:62-95` (handler, sin cupo).
- **Qué pasa**: el control de origen usa `Origin` o `Referer`, que cualquier cliente HTTP puede poner. Además, la expresión `[a-z0-9-]+\.vercel\.app` acepta cualquier sitio de Vercel de cualquier usuario.
- **Prueba (local, `fetch` de Azure simulado, script en `/private/tmp/claude-501/-Users-mac13-Desktop-Inessa-Mat/617bc86f-ac41-42c6-9653-ab9e29daea63/scratchpad/probe.mjs`)**:
  - Sin cabecera: 403.
  - Con `origin: https://repasitos.es` forjado: **200** (se llama a Azure).
  - Con `origin: https://cualquier-cosa.vercel.app`: **200**.
  - Textos de 400 caracteres: **200**. No hay límite por IP, por minuto ni por día.
  - Una página en cualquier `*.vercel.app` puede además usar `<audio src="https://repasitos.es/api/tts?...">` directamente, porque los elementos multimedia no exigen CORS y el `Referer` pasa el filtro.
- **Impacto**: cualquiera puede generar voz en español de hasta 400 caracteres sin límite. Si se agota la cuota del tier F0, la voz de los niños deja de funcionar (cae al voz del dispositivo). Si el recurso pasa a un tier de pago, cada petición cuesta dinero. El CDN cachea por URL, así que el atacante solo tiene que variar el texto.
- **Arreglo exacto**:
  1. En `api/tts.ts:20`, quitar `[a-z0-9-]+\.vercel\.app`. Si se necesitan previews, usar una lista explícita de URLs de preview por variable de entorno.
  ```ts
  const ALLOWED_HOSTS = /^(localhost|127\.0\.0\.1|(www\.)?repasitos\.es|(www\.)?wopr\.es)$/
  ```
  2. Limitar el uso en el borde: regla de **Vercel WAF / Firewall rate limiting** sobre `/api/tts` (por IP, p. ej. 60 peticiones/min y 1.000/día) y alertas de presupuesto y cuota en el portal de Azure. Es configuración, no código, y es la única defensa real. Vercel Firewall debe configurarse en el dashboard porque no está en el repo.
  3. Añadir un tope de caracteres por IP mediante un almacén (Upstash o Vercel KV) si el WAF no basta.
  4. Recordar que `Origin` es un control contra incrustación, no autenticación. Nunca debe presentarse como protección de la clave.
- **Pruebas a añadir**: `api/tts.test.ts` solo prueba `referer`. Añadir un caso con `origin: https://x.vercel.app` que espere 403 tras el cambio.

### E2. Servidor de desarrollo expuesto a la red local con la clave de Azure (MEDIA · solo desarrollo)
- **Archivos**: `package.json:7` (`"dev": "vite --host 0.0.0.0"`), `vite.config.ts:8-25` (`ttsDevApi`, carga `AZURE_*` desde `.env.local`).
- **Qué pasa**: cualquiera en la misma red Wi-Fi puede llamar a `http://<ip>:5173/api/tts` forjando `Origin: http://localhost:5173`. El middleware usa la clave de `.env.local` y factura Azure. Además, todo el servidor de Vite queda accesible en la red.
- **Arreglo exacto**:
  ```json
  "dev": "vite"
  ```
  Y en `vite.config.ts`, dentro de `configureServer`, rechazar peticiones cuyo `host` no sea local:
  ```ts
  server.middlewares.use('/api/tts', async (req, res) => {
    const host = (req.headers.host ?? '').split(':')[0]
    if (!['localhost', '127.0.0.1'].includes(host)) { res.statusCode = 403; return res.end('Forbidden') }
    // ...resto igual
  })
  ```

### E3. No hay cabeceras de seguridad ni CSP (MEDIA · defensa en profundidad)
- **Archivo**: `vercel.json` (1-20). Solo define caché. No hay ningún bloque `headers` para `/(.*)`. `index.html` no tiene `<meta http-equiv="Content-Security-Policy">`.
- **Por qué importa**: la sesión de Supabase vive en `localStorage` (`src/data/supabase.ts:9`, `numeria.auth`). Un XSS futuro la robaría sin barrera. Tampoco hay protección contra clickjacking. Hoy no hay sumideros de XSS (ver resumen), por eso la gravedad es Media.
- **Verificación pendiente**: desde este entorno no se resuelve `repasitos.es`. Ejecutar `curl -sI https://repasitos.es/` en producción. Vercel puede añadir HSTS por defecto; el resto no aparece en el repo.
- **Dependencias detectadas**: no hay terceros en el cliente. Las fuentes son propias (`public/fonts`), no hay Google Fonts ni CDN, no hay `eval`, la app usa `blob:` para audio (`src/audio/neuralVoice.ts:85`) y `worker-src` (confetti). No se usa micrófono, cámara ni geolocalización (búsqueda vacía).
- **Arreglo exacto**: añadir en `vercel.json`, dentro del array `headers`:
  ```json
  {
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self' https://yronrdmbgtdcxhfvfjdx.supabase.co wss://yronrdmbgtdcxhfvfjdx.supabase.co; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
    ]
  }
  ```
  **Advertencia de compatibilidad**: `Referrer-Policy` no puede ser `no-referrer`. El control de origen de la voz (E1) depende de `Origin`/`Referer` en la petición de la propia app (`src/audio/neuralVoice.ts:81`). Con `no-referrer` la voz caería a 403 en todos los dispositivos. Probar la CSP en un despliegue de preview antes de producción (consola del navegador, sin `report-only` no hay aviso).

### E4. PIN de adultos: KDF débil y bloqueo solo en el cliente (MEDIA)
- **Archivos**: `src/data/pin.ts:16` (`ITERATIONS = 1024`), `:18-28` (derivación: SHA-256 iterado a mano), `:43-49` (`setAdultPin`), `:52-59` (`verifyAdultPin`). `src/adult/gate/AdultGate.tsx:16-17` (5 intentos, 30 s), `:24` (`LOCK_KEY` en localStorage), `:31-52` (lectura y escritura del bloqueo).
- **Qué pasa**:
  - **Offline**: el registro (`meta.adultPin`) está en IndexedDB del dispositivo. Quien tenga el dispositivo puede copiar el registro y probar los 10^4 PIN de 4 dígitos en segundos. Incluso 8 dígitos son factibles con GPU.
  - **Online en el dispositivo**: el contador de fallos vive en `localStorage` y en memoria. Borrar datos del sitio o usar DevTools lo resetea, así que el límite de 5 intentos no es un control de seguridad real.
  - El PIN admite `0000`, `1234`, etc. (`src/adult/auth/validation.ts:65-67`).
- **Arreglo exacto**: sustituir la derivación por PBKDF2 nativo y subir el mínimo a 6 dígitos:
  ```ts
  const PBKDF2_ITERATIONS = 600_000 // OWASP (2023), PBKDF2-HMAC-SHA256
  async function derivePbkdf2(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
    return toHex(new Uint8Array(bits))
  }
  ```
  Guardar `v: 2` y `kdf: 'pbkdf2'` en el registro. Mantener `derive` para verificar registros `v: 1` y, al verificar con éxito, re-derivar y reescribir como `v: 2`. En `validation.ts:66` usar `/^\d{6,8}$/` y rechazar secuencias y repetidos (`000000`, `123456`, `111111`).
  **Riesgo residual que hay que aceptar**: un PIN numérico en un dispositivo sin servidor no es un secreto fuerte. El gate es un control de UX para niños, no de seguridad frente a un adulto con acceso al dispositivo. Documentarlo así en `docs/`.

### E5. Recuperación del PIN por multiplicación alcanzable por un niño (MEDIA)
- **Archivos**: `src/adult/gate/AdultGate.tsx:76-80` (`makeMathQuestion`: dos números de 12 a 19), `:214-226` (rama `forgot-maths`, que borra el PIN al acertar).
- **Qué pasa**: en dispositivos sin cuenta, un niño de 9 años que sepa tablas resuelve 13×15 y elimina el PIN. El contador compartido frena la fuerza bruta, pero no el acierto.
- **Arreglo exacto**: en `AdultGate.tsx:77-78` cambiar a un producto de dos cifras por tres, que un niño de 7–9 años no resuelve de cabeza:
  ```ts
  const a = 23 + Math.floor(random() * 27) // 23..49
  const b = 101 + Math.floor(random() * 799) // 101..899
  ```
  Y ajustar la prueba `AdultGate.test.tsx` si fija valores.
- **Relacionado (BAJA)**: en `AdultGate.tsx:269-289` (`submitPassword`), la recuperación con contraseña de la cuenta no pasa por el contador de fallos. Depende solo del límite de Supabase Auth. Aplicar `writeLockState`/`registerFailure` también a esa rama.

### E6. Profesores con acceso a todos los niños del colegio y escritura sobre ellos (MEDIA · minimización RGPD)
- **Archivos**: `supabase/migrations/0001_init.sql:799-806` (`children_select`, `children_insert`, `children_update` usan `is_org_member`), `:815-816` y siguientes (`progress_insert` usa `can_write_child`), `:400-409` (`can_write_child` = cualquier miembro de la organización).
- **Qué pasa**: un profesor (`role = 'teacher'`) es miembro de la organización escolar. Por tanto `children_select` le devuelve **todos** los niños del colegio, no solo los de su clase, con nombre, género, año de nacimiento, grado y compañero. `can_write_child` le permite además escribir progreso, intentos y sesiones de cualquiera de ellos.
- **Contradicción**: la cabecera de `0001_init.sql:5-6` dice «Teachers can READ the learning data of children enrolled in their classes … but can never modify it». La suite no lo cubre: `supabase/tests/10_rls.sql:298-307` prueba la escritura de un niño de familia (`a1`), no de un niño del colegio (`s1`). Por eso la suite pasa y el problema no se ve.
- **Verificación**: por lectura de políticas (no reproducido en vivo). Los casos de la suite que hablan de `s1` (`10_rls.sql:315-317`, `:410`) confirman que el profesor es miembro del colegio y que el acceso depende de la membresía.
- **Arreglo exacto (lectura, mínimo)**: restringir la lectura de niños a dirección y familia, dejando al profesor solo lo que la clase enlaza:
  ```sql
  drop policy if exists children_select on public.children;
  create policy children_select on public.children for select to authenticated
    using (public.has_org_role(org_id, array['owner','admin','guardian']) or public.staff_can_read_child(id));
  ```
  **Decisión de producto antes de aplicar**: si los tablets del colegio las usa el profesor para jugar, la escritura de progreso del profesor es necesaria y no puede retirarse sin romper la app. Entonces la escritura debe limitarse a niños enlazados a una clase activa suya dentro de `can_write_child` (sustituir el `exists` de membresía por un `exists` sobre `class_enrollments` y `classes.teacher_id = auth.uid()`). Hay que ampliar la suite con casos sobre `s1` (otro profesor del colegio no debe leer ni escribir) y ejecutar `bash supabase/tests/run.sh`.

### E7. No existe borrado de cuenta del adulto (MEDIA · cumplimiento RGPD art. 17)
- **Evidencia**: búsqueda de `deleteUser`, `delete_account`, `deleteAccount` y `removeAccount` en `src/` sin resultados. `src/data/account.ts:319-323` solo tiene `signOut({ scope: 'local' })`. `eraseChild` (`src/data/dashboards.ts:53-66`) sí existe para niños, y la exportación de niños (`exportChildData`, `dashboards.ts:181-211`) cumple el art. 20.
- **Por qué es un problema de diseño**: el borrado de la cuenta chocaría con `tg_memberships_guard` (`0001_init.sql`, bloque de `tg_memberships_guard`): al borrar `auth.users`, la cascada elimina la membresía de un dueño único y el trigger lanza «an organization needs at least one owner». La cuenta no se puede borrar sin antes tratar la organización.
- **Arreglo exacto**: un Edge Function con `service_role` que, en orden: (1) exija que el usuario no sea único dueño de ninguna organización, o que confirme borrarla (y sus niños con `erase_child`); (2) borre las filas de `profiles`, `memberships` y `org_invites` del usuario; (3) llame a `auth.admin.deleteUser(id)`. Exponer el botón en `SettingsScreen` con confirmación por contraseña. Documentar el plazo de retención de copias de seguridad de Supabase en la política de privacidad.

### E8. `api/tts.ts`: voces por prototipo y excepción sin capturar (BAJA)
- **Archivo**: `api/tts.ts:73` (`if (!(character in VOICES))`), `:47-54` (`ssml`).
- **Prueba (local)**: `v=__proto__` lanza `TypeError: Cannot read properties of undefined (reading 'includes')` y la función responde 500 sin control. `v=constructor` pasa el filtro y se envía a Azure con un nombre de voz absurdo, consumiendo cupo.
- **Arreglo exacto**: `api/tts.ts:73`:
  ```ts
  if (!Object.hasOwn(VOICES, character)) return fail(400, 'Bad voice')
  ```

### E9. Llamada a Azure sin tiempo límite (BAJA)
- **Archivo**: `api/tts.ts:75-84`. El `fetch` no tiene `signal`. Una conexión colgada ocupa la función hasta el límite de Vercel.
- **Arreglo exacto**: añadir en el objeto de `fetch`: `signal: AbortSignal.timeout(8000),`.

---

## Revisado y correcto (sin hallazgo)

- **Secretos**: sin claves en el árbol ni en el historial. Búsqueda de JWT (`eyJ…`), `sb_secret_`, `service_role`, `AZURE_SPEECH_KEY=…`, `sk-…`, `AKIA…` y bloques PEM sobre `git log -p --all`: cero coincidencias reales. `.gitignore` excluye `.env` y `.env.local`. La clave de Azure no está en `dist/` (comprobado con la cadena del `.env.local`, sin imprimirla). Dato a verificar: la clave local tiene 84 caracteres, y las claves de Azure Speech suelen tener 32. Comprobar en Vercel que la variable tiene el valor correcto.
- **RLS y RPC**: todas las funciones `security definer` tienen `set search_path = ''` (23 en 0001, 3 en 0002). Las RPC se revocan de `anon` y `public` (`0001_init.sql`, bloque final). Las tablas tienen RLS activo. `attempts` es append-only. `join_class` tiene límite de 20 fallos por hora por cuenta. Los tombstones de borrado (0002) impiden la resurrección de niños.
- **Suite local**: `bash supabase/tests/run.sh` → **192 passed, 0 failed**. Incluye erasure, tombstones, RLS de profesores y migraciones re-ejecutadas.
- **XSS**: sin `dangerouslySetInnerHTML`, sin `eval`, sin `new Function`. Los `target="_blank"` llevan `rel="noreferrer"` (`src/adult/auth/SignupScreen.tsx:170`). Las rutas `/dev` se excluyen en producción (`src/app/routes.tsx:35`) y `window.__numeriaDev` solo existe en DEV (`src/data/index.ts:76`).
- **Dependencias**: `npm audit --omit=dev` → 0 vulnerabilidades.
- **Cliente Supabase**: solo la clave publishable/anon (`src/data/supabase.ts`). La clave no es secreta por diseño; la protección está en RLS.
- **Robots**: `public/robots.txt` oculta `/adult`, `/play`, `/kids`. Es ocultación, no control de acceso; no se considera hallazgo.
- **Build**: sin mapas de fuente (`find dist -name '*.map'` vacío).

---

## PROPUESTAS (endurecimiento, priorizado)

| # | Propuesta | Prioridad | Esfuerzo |
|---|---|---|---|
| 1 | E1: quitar `*.vercel.app` de `ALLOWED_HOSTS` y configurar rate limiting en Vercel Firewall para `/api/tts` más alertas de cuota/presupuesto en Azure. | Alta | S (dashboard + 1 línea) |
| 2 | E3: añadir bloque `headers` (CSP, HSTS, nosniff, frame DENY, Referrer-Policy, Permissions-Policy) en `vercel.json`, probado en preview. | Alta | S |
| 3 | CI/CD: el repo no tiene `.github/workflows`. Despliegue solo por integración de Vercel, sin puertas automáticas. Añadir un workflow en PR con `npm run build`, `npm test`, `npm audit --omit=dev --audit-level=high`, `gitleaks` y la suite `bash supabase/tests/run.sh` (requiere Python 3.9–3.12 y `pgserver`). Ejemplo: `gitleaks/gitleaks-action@v2` con `fetch-depth: 0`. | Alta | M |
| 4 | E2: `dev` sin `--host 0.0.0.0` y comprobación de `Host` en el middleware. | Alta (barato) | S |
| 5 | E6: restringir `children_select` a dirección y familia, decidir el modelo de escritura del profesor en tablets de colegio, y cubrir `s1` en la suite. | Media | M (requiere decisión de producto) |
| 6 | E7: borrado de cuenta del adulto con Edge Function de `service_role` y tratamiento del caso de dueño único. | Media | M-L |
| 7 | E4: PBKDF2 con 600.000 iteraciones, migración `v: 1 → v: 2` al verificar, PIN de 6–8 dígitos sin secuencias triviales. | Media | M |
| 8 | E5: aumentar la aritmética de recuperación (23–49 × 101–899) y aplicar contador a la rama de contraseña. | Media | S |
| 9 | Auth de Supabase (no está en el repo, revisar en el dashboard): confirmación de email activa, contraseña mínima de 8 con letras y números, protección de contraseñas filtradas, límites de tasa en registro y login, y CAPTCHA para registro (evita crear cuentas en masa y saltarse el límite de `join_class`, que es por cuenta). | Media | S |
| 10 | E8 y E9: `Object.hasOwn` para voces y `AbortSignal.timeout` en el `fetch` a Azure. | Baja | S |
| 11 | Pruebas: añadir a `api/tts.test.ts` un caso con `origin` de `*.vercel.app` (debe dar 403) y un caso con `v=__proto__`. Añadir a la suite RLS casos de profesor sobre niños de otro profesor del colegio. | Baja | S |
| 12 | `profiles_select` (0001) muestra el email a cualquier miembro de una organización compartida. Restringir a `display_name` si el email no lo necesita la UI. | Baja | S |
| 13 | `ml/__pycache__/*.pyc` están en git (`git ls-files ml/__pycache__`). Quitarlos con `git rm --cached` y revisar el `.gitignore` de `ml/`. Hygiene. | Baja | S |
| 14 | `docs/HANDOFF.md:88` y `:98` repiten la clave publishable y la URL del proyecto. Inocuo, pero conviene referenciar `.env.example` en vez de copiar valores. | Informativa | S |
| 15 | Datos de niños en IndexedDB sin cifrar (apodos, progreso, muestras de escritura). Aceptable para una PWA de dispositivo propio. Documentarlo en la política de privacidad y no guardar muestras de escritura más de lo necesario. | Informativa | M |
| 16 | `fetch` de `neuralVoice.ts`: si se añade `Referrer-Policy: no-referrer` en el futuro, la voz caerá. Dejar la advertencia en `vercel.json` como comentario o en `docs/`. | Informativa | S |

## Verificaciones pendientes (no realizadas desde este entorno)

- `curl -sI https://repasitos.es/` y `curl -sI https://repasitos.es/api/tts?t=hola` en producción para ver HSTS y cabeceras reales. Sin DNS desde el entorno de auditoría.
- Configuración de Auth, políticas de contraseña, CAPTCHA y límites de tasa de Supabase (no versionados en el repo, no hay `supabase/config.toml`).
- Reglas de Vercel Firewall y presupuesto de Azure (solo en dashboards).
- Pruebas de E1 contra producción: no se han hecho, por norma de la auditoría. La reproducción es local con el handler y `fetch` simulado.
