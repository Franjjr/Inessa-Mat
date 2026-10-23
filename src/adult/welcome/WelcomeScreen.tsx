/* Public front page for grown-ups (direction C «lúdica y colorista»), full width: every section is a band from edge to
   edge. It reads as one story: the hero says what Repasitos does (a short daily review that follows the child's course,
   inside an adventure, with a report for the grown-up) for Primaria, not only maths; then how it works in three steps,
   each with a real capture (the last one is the grown-up's report); who it is for; the subjects (Matemáticas now, the
   others later); the trust promises right before the closing choice between a local-only try, signing in or creating
   an account. Children never see this page. */
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SUBJECTS } from '@/types'
import { useAuth } from '@/data'
import { Button } from '@/ui'
import { DEFAULT_TITLE, useDocumentTitle } from '@/app/useDocumentTitle'
import s from './welcome.module.css'

interface Shot { src: string; small: string; alt: string }

/** Captures are 1100 × 764 with a 660 px copy for phones. */
const shot = (name: string, alt: string): Shot => ({ src: `/landing/${name}.webp`, small: `/landing/${name}-660.webp`, alt })

const HERO = shot('nino-inicio', 'Pantalla de inicio del niño: su compañero animal, Lumi la guía y el siguiente paso de la aventura')

const STEPS: { title: string; text: string; caption: string; shot: Shot; tone: string }[] = [
  {
    title: '15 minutos al día, según su curso',
    text: 'Eliges su curso, de 2.º a 4.º de Primaria, y una prueba corta mira por dónde va. Cada día hay calentamiento, lo nuevo, un repaso mezclado y un problema; la sesión vuelve sobre lo que le cuesta y avanza en lo que ya domina.',
    caption: 'Una pregunta cada vez, con pistas que ayudan sin dar la respuesta.',
    shot: shot('leccion-grupos', 'Pantalla de lección por grupos: cuatro grupos de tres setas y Lumi con una pista'),
    tone: 'n1',
  },
  {
    title: 'Dentro de una aventura',
    text: 'El niño elige su compañero (gato, perro, zorro, conejo, panda, pingüino, dragón o unicornio bebé) y lo rescata respondiendo. Cada mundo tiene un guardián; con los ocho cristales se abre el Gran Cofre, y el premio lo elige la familia.',
    caption: 'Ocho mundos, un cristal en cada uno y un premio que pones tú.',
    shot: shot('mundo1', 'Mapa del Bosque de los Grupos con el mensaje: Luna se ha enredado en las lianas de las hadas'),
    tone: 'n2',
  },
  {
    title: 'Tú ves cómo avanza',
    text: 'El informe enseña qué domina, en qué se equivoca y qué toca repasar, tema a tema del temario de su curso.',
    caption: 'Lo que ves como familia: qué domina y qué repasar.',
    shot: shot('informe', 'Informe de una niña de 3.º: tablas que domina y las que repasa, tiempo jugado, aciertos y el tema del temario en el que está'),
    tone: 'n3',
  },
]

const SUBJECT_TEXT: Record<string, string> = {
  math: 'Números, cálculo, problemas, medidas, geometría y fracciones, con el temario de cada curso.',
}

function Capture({ shot: sh, eager = false }: { shot: Shot; eager?: boolean }) {
  return (
    <img
      src={sh.src}
      srcSet={`${sh.small} 660w, ${sh.src} 1100w`}
      sizes="(max-width: 900px) 92vw, 50vw"
      width={1100}
      height={764}
      loading={eager ? undefined : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      alt={sh.alt}
    />
  )
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
  const comingSoon = SUBJECTS.filter((subject) => !subject.available).map((subject) => subject.name)
  const available = SUBJECTS.filter((subject) => subject.available).map((subject) => subject.name)

  return (
    <div className={`${s.root} scrollable`}>
      <header className={s.top}>
        <div className={s.topInner}>
          <a className={s.logo} href="#inicio" aria-label="Repasitos, inicio">
            <img src="/landing/lumi.svg" alt="" width={46} height={46} />
            <span>Repasitos</span>
          </a>
          <nav className={s.nav} aria-label="Secciones">
            <a href="#como">Cómo funciona</a>
            <a href="#para">Para quién</a>
            <a href="#asignaturas">Asignaturas</a>
            <a href="#confianza">Tus datos</a>
          </nav>
          <div className={s.topCta}>
            {backendAvailable && (
              <Button variant="ghost" className={s.topLogin} onClick={() => navigate('/login')}>Iniciar sesión</Button>
            )}
            {accountButtons}
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className={`${s.band} ${s.heroBand}`} aria-labelledby="welcome-title">
          <div className={`${s.inner} ${s.hero}`}>
            <div className={s.heroText}>
              <span className={s.badge}>Repaso para Primaria · 2.º a 4.º</span>
              <h1 id="welcome-title" className={s.title}>
                El repaso de cada día, convertido en una <span className={s.hl}>aventura</span>.
              </h1>
              <p className={s.deck}>
                Cada día, una sesión corta con lo que toca según su curso y lo que más le cuesta, dentro de una aventura
                con su compañero animal. Tú ves en un informe qué domina y qué conviene repasar.
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
                <p className={s.small}>Hoy puedes probarlo sin cuenta. Las cuentas y las clases llegan pronto.</p>
              )}
            </div>
            <figure className={s.heroArt}>
              <span className={s.tag}>Captura real, en iPad</span>
              <div className={s.shot}>
                <Capture shot={HERO} eager />
              </div>
              <div className={s.lumi} aria-hidden>
                <img src="/landing/lumi.svg" alt="" width={92} height={92} />
              </div>
            </figure>
          </div>
        </section>

        <section className={`${s.band} ${s.howBand}`} id="como" aria-labelledby="como-t">
          <div className={`${s.inner} ${s.stack}`}>
            <h2 id="como-t">Así funciona: un ratito cada día</h2>
            <ol className={s.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title} className={s.step}>
                  <div className={s.stepText}>
                    <span className={`${s.n} ${s[step.tone]}`} aria-hidden>{i + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                  <figure className={s.stepFig}>
                    <div className={`${s.sticker} ${s.frame}`}>
                      <Capture shot={step.shot} />
                    </div>
                    <figcaption>{step.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={s.band} id="para" aria-labelledby="para-t">
          <div className={`${s.inner} ${s.stack}`}>
            <h2 id="para-t">Un repaso que el niño hace solo y el adulto puede leer</h2>
            <div className={s.cards3}>
              <article className={`${s.sticker} ${s.card} ${s.cGreen}`}>
                <h3>Niños de Primaria</h3>
                <ul>
                  <li>Practican a su ritmo lo de su curso.</li>
                  <li>Escriben con el lápiz, el dedo o el teclado.</li>
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
                  <li>Crean una clase y comparten el código con las familias.</li>
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

        <section className={`${s.band} ${s.subjectsBand}`} id="asignaturas" aria-labelledby="asig">
          <div className={`${s.inner} ${s.stack}`}>
            <h2 id="asig">Empezamos por Matemáticas; vendrán más asignaturas</h2>
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

        <section className={`${s.band} ${s.trustBand}`} id="confianza" aria-labelledby="conf">
          <div className={`${s.inner} ${s.stack}`}>
            <h2 id="conf">Tus datos, tu decisión</h2>
            <div className={s.trust}>
              <article className={`${s.sticker} ${s.trustCard} ${s.cGreen}`}>
                <span className={s.check} aria-hidden>✓</span>
                <div>
                  <h3>Datos que puedes borrar</h3>
                  <p>Exporta o borra los datos de tu hijo cuando quieras. <Link to="/legal/privacidad">Cómo los tratamos</Link></p>
                </div>
              </article>
              <article className={`${s.sticker} ${s.trustCard} ${s.cBlue}`}>
                <span className={s.check} aria-hidden>✓</span>
                <div><h3>Prueba sin cuenta</h3><p>Sin cuenta, el progreso se guarda solo en este dispositivo. Creas la cuenta cuando quieras.</p></div>
              </article>
              <article className={`${s.sticker} ${s.trustCard} ${s.cYellow}`}>
                <span className={s.check} aria-hidden>✓</span>
                <div><h3>En cualquier pantalla</h3><p>Tablet, móvil u ordenador, en casa o en el colegio.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className={`${s.band} ${s.closingBand}`} aria-labelledby="empezar">
          <div className={`${s.inner} ${s.closing}`}>
            <div>
              <h2 id="empezar">¿Empezamos la primera aventura?</h2>
              <p>Cada día, lo que toca. Cada semana, lo que cuesta. Y tú lo ves todo en el informe.</p>
            </div>
            <div className={s.row}>
              {accountButtons}
              <Button variant="secondary" size="lg" onClick={tryWithoutAccount}>Probar sin cuenta</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.foot}>
        <div className={`${s.inner} ${s.footInner}`}>
          <span className={s.footLogo}>Repasitos</span>
          <Link to="/legal/privacidad">Privacidad y datos</Link>
        </div>
      </footer>
    </div>
  )
}
