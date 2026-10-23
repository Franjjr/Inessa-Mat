/* Privacy policy for families and schools (Spanish). Kept to the minimum, and only states facts verified in the code. */
import { AdultPage } from '../shared/AdultPage'
import { useDocumentTitle } from '@/app/useDocumentTitle'
import s from './legal.module.css'
import adult from '../shared/adult.module.css'

export default function PrivacyScreen() {
  useDocumentTitle('Privacidad y datos · Repasitos')
  return (
    <AdultPage title="Privacidad y datos" back="/">
      <article className={s.doc} aria-labelledby="privacy-doc-title">
        <h2 id="privacy-doc-title" className={adult.heading} style={{ fontSize: 'var(--fs-xl)' }}>Política de privacidad de Repasitos</h2>
        <p className={s.updated}>Última actualización: 22 de octubre de 2026</p>

        <p>
          Repasitos es una aplicación para aprender matemáticas en Primaria. Esta política explica qué datos tratamos, para qué,
          cuánto tiempo los guardamos y qué derechos tienes. Su uso es voluntario: puedes dejar de usarla y borrar los datos cuando quieras.
        </p>

        <h2>1. Quién es responsable</h2>
        <p>
          Responsable del tratamiento: Fran Julian, Calle Bellido, Jaca (Huesca), España. Correo de privacidad:{' '}
          <a href="mailto:contact@falkir.es">contact@falkir.es</a>.
        </p>
        <p>
          Si un colegio crea clases en Repasitos, el colegio es el responsable de los datos de sus alumnos dentro de la clase, y Repasitos
          solo los trata por su cuenta y siguiendo sus instrucciones, como encargado del tratamiento.
        </p>

        <h2>2. Qué datos guardamos</h2>
        <p>Solo lo necesario para que la aplicación funcione y para que los adultos vean el progreso:</p>
        <ul>
          <li><strong>Del niño:</strong> su apodo, su género gramatical (para las frases de la aplicación), su curso y su año de nacimiento si lo indicas, y el nombre y tipo del compañero animal que elija.</li>
          <li><strong>Su aprendizaje:</strong> respuestas a los ejercicios (acierto o error, tipo de error, tiempo de respuesta), sesiones de juego (fecha y minutos), avances por mundos y ajustes de juego que elijas.</li>
          <li><strong>Escritura a mano:</strong> las muestras con las que la aplicación aprende a leer su letra se guardan solo en este dispositivo y nunca se suben a la nube.</li>
          <li><strong>De los adultos:</strong> nombre, correo y contraseña de la cuenta (la contraseña la gestiona el proveedor de la base de datos y nosotros no la vemos), y el PIN de la zona de adultos, que se guarda solo en este dispositivo en forma cifrada (un resumen, no el número).</li>
        </ul>
        <p>No pedimos el nombre completo, la dirección, el teléfono ni fotos de los niños.</p>

        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Para que el juego adapte los ejercicios a lo que cada niño necesita repasar.</li>
          <li>Para mostrar a los adultos el informe de cada perfil y, en un colegio, el de su clase.</li>
          <li>Para sincronizar la información entre los dispositivos de la familia o del colegio.</li>
          <li>Para que una clase asigne prácticas cuando una familia une a su hijo con el código del colegio.</li>
        </ul>

        <h2>4. Qué no hacemos</h2>
        <ul>
          <li>No incluimos herramientas de analítica ni rastreo de terceros en la aplicación.</li>
          <li>Los niños no crean cuentas ni dan sus datos directamente: los gestiona un adulto.</li>
        </ul>

        <h2>5. Base legal y consentimiento</h2>
        <p>
          Tratamos los datos porque el adulto lo pide al crear el perfil y acepta esta política (consentimiento, artículo 6.1.a
          del Reglamento General de Protección de Datos). Cuando un colegio gestiona las clases, es el colegio quien
          determina la base legal. En España, el consentimiento para tratar datos de menores de 14 años lo dan los padres o tutores que ejercen la patria potestad o la tutela
          (artículo 7 de la Ley Orgánica 3/2018).
        </p>
        <p>Al unir a un niño a una clase, el adulto da su consentimiento expreso en ese momento, y puede pedir que lo retiren.</p>

        <h2>6. Dónde se guardan los datos</h2>
        <p>
          Los datos de cuenta y los datos sincronizados se guardan en una base de datos alojada con Supabase, que actúa como proveedor
          de la infraestructura. Región donde se alojan: Unión Europea (Irlanda). Acuerdo de tratamiento de datos:{' '}
          supabase.com/legal/dpa. Las reglas de acceso se aplican en la propia base de datos, de modo que cada familia o colegio
          solo puede ver sus propios perfiles.
        </p>
        <p>
          La web y nuestro servidor de voz están alojados en Vercel, que actúa como proveedor de alojamiento. La voz usa además Microsoft
          Azure (ver el apartado 10).
        </p>

        <h2>7. Cuánto tiempo los guardamos</h2>
        <p>
          Mientras la cuenta o el perfil exista. Si borras un perfil, sus datos se eliminan de este dispositivo y, si estaba en la nube,
          también de la nube. Pueden quedar durante un tiempo limitado en las copias de seguridad automáticas del proveedor, que se eliminan según su propio calendario.
        </p>

        <h2>8. Tus derechos</h2>
        <p>
          Puedes pedir el acceso a tus datos y los de tus hijos, corregirlos, borrarlos, limitar su uso, oponerte a su tratamiento y
          recibirlos en un formato que puedas llevarte. Para descargar todo lo que guarda un perfil, entra en su informe desde la zona
          de adultos y pulsa «Descargar sus datos». Para cualquier otra petición, escribe a <a href="mailto:contact@falkir.es">contact@falkir.es</a>.
        </p>
        <p>
          Si crees que no hemos respetado tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos
          (aepd.es).
        </p>

        <h2>9. Seguridad</h2>
        <p>
          Protegemos la información con conexiones cifradas, reglas de acceso en la propia base de datos para que cada familia o colegio
          solo vea lo suyo, contraseñas gestionadas por el proveedor de cuentas y un PIN en el dispositivo para la zona de adultos.
        </p>

        <h2>10. Lectura en voz alta</h2>
        <p>
          Repasitos lee las instrucciones en voz alta. Para que la voz suene natural, el texto de cada frase se envía a nuestro servidor, que lo
          convierte en audio con el servicio de voz de Microsoft Azure (centro de datos en la Unión Europea, Irlanda), que actúa como
          proveedor. Ese texto son las instrucciones y frases del juego y puede incluir el apodo del niño; no se envía ningún otro dato.
          El audio se guarda en el dispositivo para no tener que pedirlo otra vez. Si no hay conexión, se usan las voces del propio
          dispositivo. Si lo prefieres, en la zona de adultos, en Ajustes, puedes elegir una voz del dispositivo o apagar la voz.
        </p>

        <h2>11. Cambios en esta política</h2>
        <p>Si cambiamos esta política de forma importante, te lo diremos dentro de la aplicación antes de que el cambio entre en vigor.</p>

      </article>
    </AdultPage>
  )
}
