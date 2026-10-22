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

## Paso 5 · Conectar Vercel (cuando el código esté en GitHub)

1. En https://vercel.com/new pulsa **Import** junto al repositorio **Inessa-Mat**.
2. Vercel detecta Vite solo. Antes de pulsar Deploy, abre **Environment Variables** y añade:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon/publishable key
3. Pulsa **Deploy**. En 1-2 minutos tendrás la dirección de la app.
4. Vuelve al Paso 4 y pon esa dirección como Site URL.

## Alternativa · Que Claude lo haga todo

Conecta Supabase en https://claude.ai/customize/connectors y abre una **sesión nueva** de Claude Code con el
repositorio Inessa-Mat. Los conectores solo se cargan al empezar una sesión. Desde esa sesión Claude puede crear
las tablas y comprobar las reglas de seguridad directamente.
