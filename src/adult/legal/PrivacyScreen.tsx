/* Privacy policy for families and schools (Spanish). Facts that only the owner can confirm are marked as
   placeholders with a visible tag, so nothing unverified is published as true. */
import type { ReactNode } from 'react'
import { AdultPage } from '../shared/AdultPage'
import s from './legal.module.css'
import adult from '../shared/adult.module.css'

/** Visible marker for information the owner must complete or verify before publishing. */
function Todo({ children }: { children: ReactNode }) {
  return <span className={s.todo}>[{children}]</span>
}

export default function PrivacyScreen() {
  return (
    <AdultPage title="Privacidad y datos" back="/">
      <div className={adult.notice} role="note" style={{ background: 'var(--c-gold-soft)' }}>
        <span className={adult.noticeMark} aria-hidden>!</span>
        <span>
          Texto en revisión. Las partes marcadas así <Todo>COMPLETAR</Todo> o <Todo>REVISAR</Todo> deben confirmarse
          antes de publicar esta política.
        </span>
      </div>

      <article className={s.doc} aria-labelledby="privacy-doc-title">
        <h2 id="privacy-doc-title" className={adult.heading} style={{ fontSize: 'var(--fs-xl)' }}>Política de privacidad de Numeria</h2>
        <p className={s.updated}>Última actualización: <Todo>FECHA</Todo></p>

        <p>
          Numeria es una aplicación para aprender matemáticas en Primaria. Esta política explica qué datos tratamos, para qué,
          cuánto tiempo los guardamos y qué derechos tienes. Está escrita para las familias y los colegios que la usan.
        </p>

        <h2>1. Quién es responsable</h2>
        <p>
          Responsable del tratamiento: Fran Julian, <Todo>DIRECCIÓN</Todo>. Correo de privacidad:{' '}
          <Todo>CORREO DE PRIVACIDAD</Todo>.
        </p>
        <p>
          Si un colegio crea clases en Numeria, el colegio decide cómo se usan los datos de su alumnado dentro de la clase.
          En ese caso Numeria actúa como proveedor que trata los datos por cuenta del colegio. <Todo>REVISAR con asesoría antes de publicar</Todo>
        </p>

        <h2>2. Qué datos guardamos</h2>
        <p>Solo lo necesario para que la aplicación funcione y para que las personas adultas vean el progreso:</p>
        <ul>
          <li><strong>De la niña o el niño:</strong> su apodo, su género gramatical (para las frases de la aplicación), su curso y su año de nacimiento si lo indicas, y el nombre y tipo del compañero animal que elija.</li>
          <li><strong>Su aprendizaje:</strong> respuestas a los ejercicios (acierto o error, tipo de error, tiempo de respuesta), sesiones de juego (fecha y minutos), avances por mundos y ajustes de juego que elijas.</li>
          <li><strong>Escritura a mano:</strong> las muestras con las que la aplicación aprende a leer su letra se guardan solo en este dispositivo y nunca se suben a la nube.</li>
          <li><strong>De las personas adultas:</strong> nombre, correo y contraseña de la cuenta (la contraseña la gestiona el proveedor de la base de datos y nosotros no la vemos), y el PIN de la zona de adultos, que se guarda solo en este dispositivo en forma cifrada (un resumen, no el número).</li>
        </ul>
        <p>No pedimos el nombre completo, la dirección, el teléfono ni fotos de los niños.</p>

        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Para que el juego adapte los ejercicios a lo que cada niña o niño necesita repasar.</li>
          <li>Para mostrar a las personas adultas el informe de cada perfil y, en un colegio, el de su clase.</li>
          <li>Para sincronizar la información entre los dispositivos de la familia o del colegio.</li>
          <li>Para que una clase asigne prácticas cuando una familia une a su peque con el código del colegio.</li>
        </ul>

        <h2>4. Qué no hacemos</h2>
        <ul>
          <li>No usamos publicidad ni la vendemos.</li>
          <li>No incluimos herramientas de analítica ni rastreo de terceros en la aplicación.</li>
          <li>Los niños y niñas no crean cuentas ni dan sus datos directamente: los gestiona una persona adulta.</li>
        </ul>

        <h2>5. Base legal y consentimiento</h2>
        <p>
          Tratamos los datos porque la persona adulta lo pide al crear el perfil y acepta esta política (consentimiento, artículo 6.1.a
          del Reglamento General de Protección de Datos). Cuando un colegio gestiona las clases, la base es la función educativa del centro
          <Todo>REVISAR</Todo>. En España, el consentimiento para tratar datos de menores de 14 años lo dan quienes ejercen su patria potestad o tutela
          (artículo 7 de la Ley Orgánica 3/2018).
        </p>
        <p>Al unir a un peque a una clase, la persona adulta da su consentimiento expreso en ese momento, y puede pedir que lo retiren.</p>

        <h2>6. Dónde se guardan los datos</h2>
        <p>
          Los datos de cuenta y los datos sincronizados se guardan en una base de datos alojada con Supabase, que actúa como proveedor
          de la infraestructura. Región donde se alojan: <Todo>COMPLETAR, según el proyecto</Todo>. Acuerdo de tratamiento de datos:{' '}
          supabase.com/legal/dpa. Las reglas de acceso se aplican en la propia base de datos, de modo que cada familia o colegio
          solo puede ver sus propios perfiles.
        </p>

        <h2>7. Cuánto tiempo los guardamos</h2>
        <p>
          Mientras la cuenta o el perfil exista. Si borras un perfil, sus datos se eliminan de este dispositivo y, si estaba en la nube,
          también de la nube. Las copias de seguridad del proveedor se borran según su calendario <Todo>COMPLETAR plazo</Todo>.
        </p>

        <h2>8. Tus derechos</h2>
        <p>
          Puedes pedir el acceso a tus datos y los de tus hijos, corregirlos, borrarlos, limitar su uso, oponerte a su tratamiento y
          recibirlos en un formato que puedas llevarte. Para descargar todo lo que guarda un perfil, entra en su informe desde la zona
          de adultos y pulsa «Descargar sus datos». Para cualquier otra petición, escribe a <Todo>CORREO DE PRIVACIDAD</Todo>.
        </p>
        <p>
          Si crees que no hemos respetado tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos
          (aepd.es).
        </p>

        <h2>9. Seguridad</h2>
        <p>
          Protegemos la información con controles de acceso en la base de datos, contraseñas gestionadas por el proveedor de cuentas y un PIN
          en el dispositivo para la zona de adultos. <Todo>COMPLETAR: medidas técnicas concretas verificadas</Todo>
        </p>

        <h2>10. Lectura en voz alta</h2>
        <p>
          Numeria puede leer las instrucciones en voz alta usando las voces del propio dispositivo, y elige siempre que puede una voz que funciona
          sin conexión. En iPad y iPhone las voces son del propio sistema. En algunos navegadores, como Chrome, ciertas voces envían el texto a
          los servidores del fabricante del navegador para pronunciarlo. Ese texto son las instrucciones del juego y puede incluir el apodo del
          peque. Si lo prefieres, puedes apagar la voz en la zona de adultos, en Ajustes.
        </p>

        <h2>11. Cambios en esta política</h2>
        <p>Si cambiamos esta política de forma importante, te lo diremos dentro de la aplicación antes de que el cambio entre en vigor.</p>

        <p className={s.updated}>Esta página es un resumen para familias y colegios. No sustituye el asesoramiento jurídico.</p>
      </article>
    </AdultPage>
  )
}
