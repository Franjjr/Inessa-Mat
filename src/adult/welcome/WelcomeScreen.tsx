/* Public front page for grown-ups (direction C «lúdica y colorista»), full width: every section is a band from edge to
   edge. The hero says what Repasitos does (a short daily review that follows the child's course, inside an adventure,
   with a report for the grown-up) for Primaria, not only maths: Matemáticas is the first subject and the others come
   later. Then the trust promises, who it is for, how it works, real captures, the subjects, and the choice between a
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
  math: 'Números, cálculo, problemas, medidas, geometría y fracciones, con el temario de cada curso.',
}

/** What Repasitos does, in four tiles under the hero. */
const FEATURES = [
  { icon: '📚', title: 'Sigue su curso', text: 'El temario de 2.º, 3.º y 4.º de Primaria, por trimestres y volviendo sobre lo ya visto.', tone: 'cGreen' },
  { icon: '⏱️', title: '15 minutos al día', text: 'Calentamiento, lo nuevo, un repaso mezclado y un problema. Más práctica que juego.', tone: 'cBlue' },
  { icon: '🎯', title: 'Se adapta a cada niño', text: 'Vuelve sobre lo que le cuesta y avanza en lo que domina. Las pistas ayudan sin dar la respuesta.', tone: 'cYellow' },
  { icon: '📊', title: 'Informe para el adulto', text: 'La familia o el profesor ven qué domina, en qué se equivoca y qué conviene repasar.', tone: 'cPink' },
] as const

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
  const comingSoon = SUBJECTS.filter((subject) => !subject.available).map((subject) => subject.name)
  const available = SUBJECTS.filter((subject) => subject.available).map((subject) => subject.name)

  return (
    <main className={`${s.root} scrollable`}>
      <header className={s.top}>
        <div className={s.topInner}>
          <a className={s.logo} href="#inicio" aria-label="Repasitos, inicio">
            <img src="/landing/lumi.svg" alt="" width={46} height={46} />
            <span>Repasitos</span>
          </a>
          <nav className={s.nav} aria-label="Secciones">
            <a href="#que-hace">Qué hace</a>
            <a href="#como">Cómo funciona</a>
            <a href="#capturas">Capturas</a>
            <a href="#asignaturas">Asignaturas</a>
          </nav>
          <div className={s.topCta}>
            {backendAvailable && (
              <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Button>
            )}
            {accountButtons}
          </div>
        </div>
      </header>

      <section id="inicio" className={`${s.band} ${s.heroBand}`} aria-labelledby="welcome-title">
        <div className={`${s.inner} ${s.hero}`}>
          <div className={s.heroText}>
            <span className={s.badge}>Repaso para Primaria · 2.º a 4.º</span>
            <h1 id="welcome-title" className={s.title}>
              El repaso de cada día, convertido en una <span className={s.hl}>aventura</span>.
            </h1>
            <p className={s.deck}>
              Repasitos prepara cada día una sesión corta con lo que toca según el curso del niño y lo que más le cuesta.
              Practica dentro de una aventura con su compañero animal, y la familia o el colegio ven en un informe qué
              domina y qué conviene repasar.
            </p>
            <div className={s.subjectChips} aria-label="Asignaturas">
              {available.map((name) => (
                <span key={name} className={`${s.chip} ${s.chipOn}`}>✓ {name}</span>
              ))}
              {comingSoon.map((name) => (
                <span key={name} className={s.chip}>{name} · pronto</span>
              ))}
            </div>
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
        </div>

        <div className={`${s.inner} ${s.features}`} id="que-hace">
          <h2 className={s.visuallyHiddenTitle}>Qué hace Repasitos</h2>
          {FEATURES.map((f) => (
            <article key={f.title} className={`${s.sticker} ${s.feature} ${s[f.tone]}`}>
              <span className={s.featureIcon} aria-hidden>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${s.band} ${s.trustBand}`} id="confianza" aria-labelledby="conf">
        <div className={`${s.inner} ${s.trust}`}>
          <h2 id="conf" className={s.visuallyHiddenTitle}>Confianza</h2>
          <article className={`${s.sticker} ${s.trustCard} ${s.cGreen}`}>
            <span className={s.check} aria-hidden>✓</span>
            <div><h3>Datos que puedes borrar</h3><p>Exporta o borra los datos de tu hijo cuando quieras.</p></div>
          </article>
          <article className={`${s.sticker} ${s.trustCard} ${s.cBlue}`}>
            <span className={s.check} aria-hidden>✓</span>
            <div><h3>Prueba sin cuenta</h3><p>Sin cuenta, el progreso se guarda solo en este dispositivo. Creas la cuenta cuando quieras.</p></div>
          </article>
          <article className={`${s.sticker} ${s.trustCard} ${s.cYellow}`}>
            <span className={s.check} aria-hidden>✓</span>
            <div><h3>En cualquier pantalla</h3><p>Tablet, móvil u ordenador. Se escribe con el lápiz, el dedo o el teclado.</p></div>
          </article>
        </div>
      </section>

      <section className={s.band} aria-labelledby="para">
        <div className={`${s.inner} ${s.stack}`}>
          <h2 id="para">¿Para quién es?</h2>
          <div className={s.cards3}>
            <article className={`${s.sticker} ${s.card} ${s.cGreen}`}>
              <h3>Niños de Primaria</h3>
              <ul>
                <li>Practican a su ritmo lo de su curso.</li>
                <li>Eligen su compañero animal y ganan un cristal por cada mundo.</li>
              </ul>
            </article>
            <article className={`${s.sticker} ${s.card} ${s.cBlue}`}>
              <h3>Familias</h3>
              <ul>
                <li>Ven qué domina cada hijo y qué toca repasar.</li>
                <li>Eligen las asignaturas y el premio del Gran Cofre.</li>
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
        </div>
      </section>

      <section className={`${s.band} ${s.howBand}`} id="como" aria-labelledby="como-t">
        <div className={`${s.inner} ${s.stack}`}>
          <h2 id="como-t">¿Cómo funciona?</h2>
          <div className={s.steps}>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n1}`} aria-hidden>1</span>
              <h3>Elige curso y compañero</h3>
              <p>Una prueba corta mira por dónde va. Luego elige gato, perro, zorro, conejo, panda, pingüino, dragón o unicornio bebé.</p>
            </article>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n2}`} aria-hidden>2</span>
              <h3>Practica cada día</h3>
              <p>La sesión del día reúne lo nuevo y lo que cuesta. Cada mundo tiene un guardián y una prueba que superar.</p>
            </article>
            <article className={`${s.sticker} ${s.step}`}>
              <span className={`${s.n} ${s.n3}`} aria-hidden>3</span>
              <h3>Mira cómo avanza</h3>
              <p>El informe enseña lo que ya domina y lo que falla. Con los ocho cristales se abre el Gran Cofre.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.shotsBand}`} id="capturas" aria-labelledby="cap">
        <div className={`${s.inner} ${s.stack}`}>
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
        </div>
      </section>

      <section className={s.band} id="asignaturas" aria-labelledby="asig">
        <div className={`${s.inner} ${s.stack}`}>
          <h2 id="asig">Asignaturas</h2>
          <p className={s.lead}>
            Empezamos por Matemáticas. Las demás asignaturas llegarán con el mismo sistema: el temario del curso, una
            sesión corta cada día y el informe para el adulto.
          </p>
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
        </div>
      </section>

      <section className={`${s.band} ${s.closingBand}`} aria-label="Empezar">
        <div className={`${s.inner} ${s.closing}`}>
          <div>
            <h2>¿Empezamos la primera aventura?</h2>
            <p>Crea una cuenta para guardar una copia segura, o prueba sin cuenta en este dispositivo.</p>
          </div>
          <div className={s.row}>
            {accountButtons}
            <Button variant="secondary" size="lg" onClick={tryWithoutAccount}>Probar sin cuenta</Button>
          </div>
        </div>
      </section>

      <footer className={s.foot}>
        <div className={`${s.inner} ${s.footInner}`}>
          <span className={s.footLogo}>Repasitos</span>
          <span>
            <Link to="/legal/privacidad">Privacidad y datos</Link>
          </span>
        </div>
      </footer>
    </main>
  )
}
