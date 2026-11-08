# Cómo configurar Supabase para Numeria (paso a paso)

## Paso 1 · Crear el proyecto (5 minutos, puedes hacerlo ya)

1. Entra en https://supabase.com/dashboard e inicia sesión.
2. Pulsa **New project**.
3. Rellena:
   - **Name:** `numeria`
   - **Database password:** pulsa *Generate a password* y **guárdala en tu gestor de contraseñas**.
     No se la mandes a nadie (tampoco a Claude).
   - **Region:** *West EU (Ireland)* o *Central EU (Frankfurt)*. Os conviene que los datos estén en la UE
     porque son datos de menores (RGPD).
   - **Plan:** Free para empezar.
4. Pulsa **Create new project** y espera unos 2 minutos a que termine.

## Paso 2 · Copiar las 2 claves públicas y mandármelas

1. Dentro del proyecto, ve a **Project Settings** (rueda dentada abajo a la izquierda).
2. Entra en **Data API** (o **API Keys**, según la versión del panel).
3. Copia y pégame en el chat:
   - **Project URL** → algo como `https://abcdxyz.supabase.co`
   - **anon public** key (o la *publishable key*, que empieza por `sb_publishable_`)

Estas dos son **públicas**: van dentro de la app y la seguridad la ponen las reglas de la base de datos (RLS).

⚠️ **Nunca** pegues en el chat la clave `service_role` / *secret key* ni la contraseña de la base de datos.

## Paso 3 · Crear las tablas (cuando Claude te avise de que el SQL está listo)

1. En el menú de la izquierda abre **SQL Editor** → **New query**.
2. Abre el archivo `supabase/migrations/0001_init.sql` de este repositorio, copia todo su contenido y pégalo.
3. Pulsa **Run**. Debe terminar con *Success. No rows returned*.

## Paso 4 · Configurar el inicio de sesión

1. Ve a **Authentication → Sign In / Providers** y comprueba que **Email** está activado.
2. Ve a **Authentication → URL Configuration**:
   - **Site URL:** la dirección que te dé Vercel (la de producción es `https://repasitos.es`).
   - **Redirect URLs:** añade esa misma dirección con `/**` al final, y también `http://localhost:5173/**`.
   - Comprueba que la **Site URL** es `https://repasitos.es` y no `localhost`: si no, los enlaces de los correos abren localhost.

## Paso 4b · Correo propio con Resend (imprescindible para que lleguen los correos)

El correo que trae Supabase por defecto **solo entrega a los miembros del equipo del proyecto** y como mucho
**2 correos por hora** en total. Además no deja cambiar las plantillas. Con él, las familias no reciben ni la
confirmación de la cuenta ni el código para entrar. Se arregla con un servicio de correo propio:

1. **Instala Resend desde Vercel:** https://vercel.com/marketplace → busca **Resend** → **Install** en el proyecto
   de Repasitos. Así se paga en la misma factura (tiene un plan gratuito suficiente para empezar).
2. **Da de alta el dominio en Resend:** en el panel de Resend → **Domains** → **Add domain** → `repasitos.es`
   (región UE). Resend te enseña unos registros DNS (SPF y DKIM, y uno para los rebotes). Añádelos tal cual en
   el sitio donde gestionas el dominio y espera a que Resend lo marque como **Verified** (suele tardar minutos,
   a veces horas). Recomendable también un registro DMARC: `_dmarc` TXT `v=DMARC1; p=none;`.
3. **Crea una clave:** Resend → **API Keys** → **Create** con permiso *Sending access*, limitada al dominio
   `repasitos.es`. Guárdala en tu gestor de contraseñas. No la pegues en el chat.
4. **Ponla en Supabase:** **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - **Sender email:** `hola@repasitos.es` (cualquier dirección del dominio) · **Sender name:** `Repasitos`
   - **Host:** `smtp.resend.com` · **Port:** `465` · **Username:** `resend` · **Password:** la clave de Resend
5. **Límites:** **Authentication → Rate Limits** → correos por hora: al menos `30` (súbelo si hay muchas familias).
6. **Plantillas en español** (**Authentication → Emails → Templates**). Tienen que llevar el **código**
   (`{{ .Token }}`): en la tableta es lo más cómodo, porque el enlace se abre en el navegador y no en la app.

   **Magic Link** — asunto `Tu código para entrar en Repasitos`:
   ```html
   <h2>Tu código para entrar</h2>
   <p>Escribe este código en Repasitos:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>O pulsa <a href="{{ .ConfirmationURL }}">este enlace</a> si lo abres en el mismo dispositivo.</p>
   <p>Si no lo has pedido tú, ignora este correo.</p>
   ```
   **Reset Password** — asunto `Tu código para elegir una contraseña nueva`:
   ```html
   <h2>Elige una contraseña nueva</h2>
   <p>Escribe este código en Repasitos:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>O pulsa <a href="{{ .ConfirmationURL }}">este enlace</a> si lo abres en el mismo dispositivo.</p>
   <p>Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.</p>
   ```
   **Confirm signup** — asunto `Confirma tu cuenta de Repasitos`:
   ```html
   <h2>Confirma tu cuenta</h2>
   <p><a href="{{ .ConfirmationURL }}">Pulsa aquí para confirmar tu correo</a>.</p>
   <p>Si no has creado tú la cuenta, ignora este correo.</p>
   ```
7. **Comprueba:** en la app, **Iniciar sesión → Entrar con un código por correo** con tu correo. Debe llegar en
   menos de un minuto (mira también en spam la primera vez). Si no llega, mira **Authentication → Logs**.

## Paso 4c · Entrar con Google (opcional)

Sin este paso la app funciona igual: el botón «Continuar con Google» simplemente no aparece.

1. **Google Cloud.** Entra en https://console.cloud.google.com, crea un proyecto (por ejemplo «Repasitos») y abre
   **Google Auth Platform**.
   - **Branding:** nombre de la app «Repasitos», correo de soporte, logo, y en **Dominios autorizados** `repasitos.es`.
     Pon la dirección de la política de privacidad: `https://repasitos.es/legal/privacidad`.
   - **Audience:** tipo **External**. Mientras esté en «Testing» solo pueden entrar los correos que añadas como
     usuarios de prueba; para abrirlo a todas las familias pulsa **Publish app** (Google puede tardar unos días en
     verificar la marca).
   - **Data Access:** deja solo `openid`, `.../auth/userinfo.email` y `.../auth/userinfo.profile`. No añadas nada más.
   - **Clients → Create client**, tipo **Web application**:
     - **Authorized JavaScript origins:** `https://repasitos.es` y `http://localhost:5173`.
     - **Authorized redirect URIs:** `https://yronrdmbgtdcxhfvfjdx.supabase.co/auth/v1/callback`.
     - Google no admite comodines: en las vistas previas de Vercel (`*.vercel.app`) el botón dará error. Para probar
       una vista previa, añade su dirección exacta como origen o prueba en `localhost`.
     - Copia el **Client ID** y el **Client secret**. El secret no lo pegues en ningún chat.
2. **Supabase.** **Authentication → Sign In / Providers → Google**: actívalo y pega el **Client ID** y el
   **Client secret**. Deja **Skip nonce check** desactivado (la app envía el nonce).
3. **Vercel.** **Settings → Environment Variables**: añade `VITE_GOOGLE_CLIENT_ID` = el Client ID (es público; no es
   el secret) en Production y Preview, y vuelve a desplegar. En local, ponlo en `.env.local`.
4. **Comprueba** en la tablet, en la app instalada y en el navegador:
   - Con un correo nuevo: **Continuar con Google** → sale «Completa tu cuenta» → después, la zona de familia.
   - Con tu correo de siempre: entras en tu cuenta de siempre, con tu familia (Supabase une Google a la cuenta que
     ya tiene ese correo confirmado; si alguien hubiera creado una cuenta sin confirmar con tu correo, Supabase quita
     esa alta y la app te pide completar la cuenta de nuevo).
   - Si en la app instalada el botón no abre la ventana de Google, avisa: el código por correo sigue funcionando.

## Paso 5 · Conectar Vercel (cuando el código esté en GitHub)

1. En https://vercel.com/new pulsa **Import** junto al repositorio **Inessa-Mat**.
2. Vercel detecta Vite solo. Antes de pulsar Deploy, abre **Environment Variables** y añade:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon/publishable key
   - `VITE_GOOGLE_CLIENT_ID` = el Client ID de Google (opcional, Paso 4c)
3. Pulsa **Deploy**. En 1-2 minutos tendrás la dirección de la app.
4. Vuelve al Paso 4 y pon esa dirección como Site URL.

## Alternativa · Que Claude lo haga todo

Conecta Supabase en https://claude.ai/customize/connectors y abre una **sesión nueva** de Claude Code con el
repositorio Inessa-Mat. Los conectores solo se cargan al empezar una sesión. Desde esa sesión Claude puede crear
las tablas y comprobar las reglas de seguridad directamente.
