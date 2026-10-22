/* Public front page for grown-ups (direction C «lúdica y colorista»): what Repasitos is, who it is for and who it
   is not for, how it works, real captures of the game, the trust promises, the subjects, and the choice between a
   local-only try, signing in or creating an account. Children never see this page. */
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SUBJECTS } from '@/types'
import { useAuth } from '@/data'
import { Button } from '@/ui'
import { DEFAULT_TITLE, useDocumentTitle } from '@/app/useDocumentTitle'
import s from './welcome.module.css'

const SHOTS = {
  home: { src: '/landing/nino-inicio.webp', width: 1100, height: 764 },
  world: { src: '/landing/mundo1.webp', width: 1100, height: 764 },
  lesson: { src: '/landing/leccion-grupos.webp', width: 1100, height: 764 },
} as const

const SUBJECT_TEXT: Record<string, string> = {
  math: 'Tablas, sumas, restas, multiplicaciones y divisiones.',
}

export default function WelcomeScreen() {
  const { status, backendAvailable, continueLocalOnly } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle(DEFAULT_TITLE)

  if (status === 'signed-in') return <Navigate to="/" replace />

  const tryWithoutAccount = () => {
    continueLocalOnly()
    navigate('/', { replace: true })
  }

  const accountButtons = backendAvailable && (
    <Button variant="gold" size="lg" onClick={() => navigate('/signup')}>Crear cuenta</Button>
  )

  return (
    <main className={`${s.root} scrollable`}>
      <div className={s.page}>
        <header className={s.top}>
          <a className={s.logo} href="#inicio" aria-label="Repasitos, inicio">
            <img src="/landing/lumi.svg" alt="" width={46} height={46} />
            <span>Repasitos</span>
          </a>
          <nav className={s.nav} aria-label="Secciones">
            <a href="#como">Cómo funciona</a>
            <a href="#capturas">Capturas</a>
            <a href="#confianza">Confianza</a>
            <a href="#asignaturas">Asignaturas</a>
          </nav>
          <div className={s.topCta}>
            {backendAvailable && (
              <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Button>
            )}
            {accountButtons}
          </div>
        </header>

        <section id="inicio" className={s.hero} aria-labelledby="welcome-title">
          <div className={s.heroText}>
            <span className={s.badge}>Matemáticas · 7 a 9 años</span>
            <h1 id="welcome-title" className={s.title}>
              Repasa las cuentas <span className={s.hl}>rescatando</span> a tu compañero.
            </h1>
            <p className={s.deck}>
              Tablas, sumas, restas, multiplicaciones y divisiones en ocho mundos mágicos. Cada niño elige un animal y lo
              rescata con cada respuesta.
            </p>
            <div className={s.row}>
              {accountButtons}
              <Button variant="secondary" size="lg" onClick={tryWithoutAccount}>Probar sin cuenta</Button>
            </div>
            {backendAvailable && (
              <p className={s.small}>
                ¿Ya tienes cuenta? <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Button>
              </p>
            )}
            {!backendAvailable && (
              <p className={s.small}>
                Esta versión funciona sin cuenta, así que las cuentas y las clases no están disponibles todavía.
              </p>
            )}
          </div>
          <figure className={s.heroArt}>
            <span className={s.tag}>Captura real, en iPad</span>
            <div className={s.shot}>
              <img
                src={SHOTS.home.src}
                width={SHOTS.home.width}
                height={SHOTS.home.height}
                fetchPriority="high"
                decoding="async"
                alt="Pantalla de inicio del niño con Luna, Lumi y el siguiente paso de la aventura"
              />
            </div>
            <div className={s.lumi} aria-hidden>
              <img src="/landing/lumi.svg" alt="" width={92} height={92} />
            </div>
          </figure>
        </section>

        <section className={s.trust} id="confianza" aria-labelledby="conf">
          <h2 id="conf" className={s.visuallyHiddenTitle}>Confianza</h2>
          <article className={`${s.sticker} ${s.trustCard} ${s.cGreen}`}>
            <span className={s.check} aria-hidden>✓</span>
            <div><h3>Datos que puedes borrar</h3><p>Exporta o borra los datos de tu hijo cuando quieras.</p></div>
          </article>
          <article className={`${s.sticker} ${s.trustCard} ${s.cBlue}`}>
            <span className={s.check} aria-hidden>✓</span>
            <div><h3>Prueba sin cuenta</h3><p>Sin cuenta, el progreso se guarda solo en este dispositivo. Creas la cuenta cuando quieras.</p></div>
          </article>
        </section>

        <section className={s.band} aria-labelledby="que-t">
          <div className={`${s.sticker} ${s.whatCard}`}>
            <h2 id="que-t">¿Qué es Repasitos?</h2>
            <p>
              Una app para repasar en casa y en el colegio, en tablet, móvil u ordenador. El niño practica a su ritmo; la
              familia o el colegio ven qué domina y qué toca repasar. Se escribe con el lápiz, el dedo o el teclado.
            </p>
          </div>
        </section>

        <section className={s.band} aria-labelledby="para">
          <h2 id="para">¿Para quién es?</h2>
          <div className={s.cards3}>
            <article className={`${s.sticker} ${s.card} ${s.cGreen}`}>
              <h3>Niños de 7 a 9</h3>
              <ul>
                <li>Eligen su compañero animal y le ponen nombre.</li>
                <li>Ganan un cristal por cada mundo.</li>
              </ul>
            </article>
            <article className={`${s.sticker} ${s.card} ${s.cBlue}`}>
              <h3>Familias</h3>
              <ul>
                <li>Ven qué tablas domina cada hijo.</li>
                <li>Eligen el premio del Gran Cofre.</li>
              </ul>
            </article>
            <article className={`${s.sticker} ${s.card} ${s.cPink}`}>
              <h3>Colegios</h3>
              <ul>
                <li>Crean clases con un código para las familias.</li>
                <li>Ven el progreso de la clase.</li>
              </ul>
            </article>
          </div>
          <div className={`${s.sticker} ${s.notFor}`}>
            <h3>Para quién no es</h3>
            <ul>
              <li>Para quien busque sustituir al colegio o al profesor: Repasitos es un complemento para practicar, no un sustituto de las clases.</li>
            </ul>
          </div>
        </section>

        <section className={s.band} id="como" aria-labelledby="como-t">
          <h2 id="como-t">¿Cómo funciona?</h2>
          <div className={s.steps}>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n1}`} aria-hidden>1</span>
              <h3>Elige compañero</h3>
              <p>Gato, perro, zorro, conejo, panda, pingüino, dragón o unicornio bebé.</p>
            </article>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n2}`} aria-hidden>2</span>
              <h3>Rescátalo</h3>
              <p>Cada mundo tiene un guardián y una prueba. Si su compañero se mete en un lío, la respuesta lo salva.</p>
            </article>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n3}`} aria-hidden>3</span>
              <h3>Repasa lo que toca</h3>
              <p>El Repaso del día reúne lo que cuesta. Con los ocho cristales se abre el Gran Cofre.</p>
            </article>
          </div>
        </section>

        <section className={s.band} id="capturas" aria-labelledby="cap">
          <h2 id="cap">Mira cómo se juega</h2>
          <div className={s.gallery}>
            <figure>
              <div className={`${s.sticker} ${s.frame}`}>
                <img
                  src={SHOTS.world.src}
                  width={SHOTS.world.width}
                  height={SHOTS.world.height}
                  loading="lazy"
                  decoding="async"
                  alt="Mapa del Bosque de los Grupos con el mensaje: Luna se ha enredado en las lianas de las hadas"
                />
              </div>
              <figcaption>El Bosque de los Grupos: «¡Luna se ha enredado en las lianas de las hadas!»</figcaption>
            </figure>
            <figure>
              <div className={`${s.sticker} ${s.frame}`}>
                <img
                  src={SHOTS.lesson.src}
                  width={SHOTS.lesson.width}
                  height={SHOTS.lesson.height}
                  loading="lazy"
                  decoding="async"
                  alt="Pantalla de lección por grupos: cuatro grupos de tres setas"
                />
              </div>
              <figcaption>Una lección, un paso cada vez.</figcaption>
            </figure>
          </div>
        </section>

        <section className={s.band} id="asignaturas" aria-labelledby="asig">
          <h2 id="asig">Asignaturas</h2>
          <div className={s.subjects}>
            {SUBJECTS.map((subject) => (
              <article
                key={subject.id}
                className={subject.available ? `${s.sticker} ${s.subj} ${s.subjOn}` : `${s.subj} ${s.subjOff}`}
              >
                <span className={s.pill}>{subject.available ? '¡Ya disponible!' : 'Próximamente'}</span>
                <h3>{subject.name}</h3>
                {SUBJECT_TEXT[subject.id] && <p>{SUBJECT_TEXT[subject.id]}</p>}
              </article>
            ))}
          </div>
        </section>

        <section className={`${s.sticker} ${s.closing}`} aria-label="Empezar">
          <div>
            <h2>¿Lista la primera aventura?</h2>
            <p>Crea una cuenta para guardar una copia segura, o prueba sin cuenta en este dispositivo.</p>
          </div>
          <div className={s.row}>
            {accountButtons}
            <Button variant="secondary" size="lg" onClick={tryWithoutAccount}>Probar sin cuenta</Button>
          </div>
        </section>

        <footer className={s.foot}>
          <span className={s.footLogo}>Repasitos</span>
          <span>
            <Link to="/legal/privacidad">Privacidad y datos</Link>
          </span>
        </footer>
      </div>
    </main>
  )
}
