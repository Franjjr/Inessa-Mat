/* First screen for grown-ups: what Numeria is, who it is for, and the choice between a local-only try,
   signing in, or creating an account. Children never see a login. */
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Character } from '@/art'
import { useAuth } from '@/data'
import { Button, Card } from '@/ui'
import s from './welcome.module.css'
import adult from '../shared/adult.module.css'

export default function WelcomeScreen() {
  const { status, backendAvailable, continueLocalOnly } = useAuth()
  const navigate = useNavigate()

  if (status === 'signed-in') return <Navigate to="/" replace />

  const tryWithoutAccount = () => {
    continueLocalOnly()
    navigate('/', { replace: true })
  }

  return (
    <main className={adult.root}>
      <div className={adult.page}>
        <section className={s.hero} aria-labelledby="welcome-title">
          <div className={s.art} aria-hidden>
            <Character id="lumi" pose="happy" size={230} />
          </div>
          <div className={adult.stack} style={{ gap: 12 }}>
            <h1 id="welcome-title" className={s.brand}>Numeria</h1>
            <p className={s.tagline}>Aventuras para aprender las tablas y las cuentas jugando.</p>
            <p className={s.intro}>
              Numeria acompaña a niñas y niños de Primaria con las tablas de multiplicar, las sumas y restas de varias cifras,
              las multiplicaciones y las divisiones. Escriben las respuestas con el lápiz, el dedo o el teclado, y van
              rescatando a su compañero animal en ocho mundos mágicos.
            </p>
          </div>
        </section>

        <section className={s.cards} aria-label="Para quién es Numeria">
          <Card>
            <h2 className={adult.subheading}>Para familias</h2>
            <ul className={s.bullets}>
              <li>Ves qué tablas domina cada peque y cuáles necesitan repaso.</li>
              <li>Decides el premio real del Gran Cofre cuando completa su aventura.</li>
              <li>Puedes exportar o borrar sus datos cuando quieras.</li>
            </ul>
          </Card>
          <Card>
            <h2 className={adult.subheading}>Para colegios</h2>
            <ul className={s.bullets}>
              <li>Creas clases con un código para que las familias unan a sus hijos con consentimiento.</li>
              <li>Ves el progreso de la clase y asignas práctica sobre lo que toca esta semana.</li>
              <li>Invitas a otros docentes a la clase sin compartir contraseñas.</li>
            </ul>
          </Card>
        </section>

        <section className={s.ctaCard} aria-label="Empezar">
          <div className={adult.stack} style={{ gap: 6 }}>
            <h2 className={adult.subheading}>¿Cómo quieres empezar?</h2>
            <p className={adult.muted}>
              Puedes probar sin cuenta: todo se queda en este dispositivo. Cuando quieras, creas una cuenta y guardas
              una copia segura en la nube.
            </p>
          </div>
          <div className={s.ctaRow}>
            <Button size="lg" onClick={tryWithoutAccount} block>
              Probar sin cuenta
            </Button>
            {backendAvailable && (
              <>
                <Button variant="secondary" size="lg" block onClick={() => navigate('/login')}>Iniciar sesión</Button>
                <Button variant="ghost" size="lg" block onClick={() => navigate('/signup')}>Crear cuenta</Button>
              </>
            )}
          </div>
          {!backendAvailable && (
            <p className={adult.hint}>
              Esta versión de Numeria funciona sin cuenta, así que las cuentas y las clases no están disponibles todavía.
            </p>
          )}
        </section>

        <footer className={s.footer}>
          <Link to="/legal/privacidad">Privacidad y datos</Link>
          <span aria-hidden>·</span>
          <span>Sin publicidad</span>
        </footer>
      </div>
    </main>
  )
}
