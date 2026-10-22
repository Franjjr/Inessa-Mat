/* The grown-ups' start page: the children of the active organisation, sync state, and links to reports,
   the school area (for schools), settings and privacy. */
import { Link, useNavigate } from 'react-router-dom'
import { CompanionArt } from '@/art'
import { useAuth, useChildren } from '@/data'
import { Button, Card, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ClaimLocalPanel } from '../shared/ClaimLocalPanel'
import { SyncBadge } from '../shared/SyncBadge'
import { plural } from '../shared/format'
import { lockAdultArea } from '../gate/AdultGate'
import s from './home.module.css'
import adult from '../shared/adult.module.css'

const KIND_LABEL = { family: 'Familia', school: 'Colegio' } as const

export default function AdultHomeScreen() {
  const { status, activeOrg, organizations, setActiveOrg, backendAvailable } = useAuth()
  const children = useChildren() ?? []
  const navigate = useNavigate()
  const isSchool = activeOrg?.kind === 'school'
  const signedIn = status === 'signed-in'

  const leave = () => {
    lockAdultArea()
    navigate('/kids')
  }

  return (
    <AdultPage title="Zona de adultos" back="/kids" actions={<Button variant="ghost" size="sm" onClick={leave}>Salir</Button>}>
      <header className={s.hero}>
        <div className={adult.stack} style={{ gap: 6 }}>
          <h2 className={adult.heading}>{activeOrg ? activeOrg.name : 'Tus perfiles en este dispositivo'}</h2>
          <p className={adult.lead}>
            {plural(children.length, 'perfil', 'perfiles')} {children.length === 1 ? 'listo' : 'listos'} para jugar.
            Aquí ves cómo avanza cada uno y qué toca repasar.
          </p>
        </div>
        {activeOrg && <span className={s.orgPill}>{KIND_LABEL[activeOrg.kind]}</span>}
      </header>

      {organizations.length > 1 && (
        <div className={adult.row} role="group" aria-label="Elige la cuenta activa">
          {organizations.map((o) => (
            <button
              key={o.id}
              type="button"
              className={adult.segment}
              aria-pressed={activeOrg?.id === o.id}
              onClick={() => setActiveOrg(o.id)}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      <SyncBadge />

      {status === 'local-only' && (
        <div className={`${adult.notice} ${adult.noticeInfo}`} role="note">
          <div className={adult.stack} style={{ gap: 6, flex: 1 }}>
            <strong>Estás usando Numeria sin cuenta.</strong>
            <span>Los datos solo están en este dispositivo. Si creas una cuenta, puedes guardarlos y verlos desde otros dispositivos.</span>
          </div>
          {backendAvailable && (
            <Button size="sm" onClick={() => navigate('/signup')}>Crear cuenta</Button>
          )}
        </div>
      )}

      {signedIn && <ClaimLocalPanel onDone={() => toast('Perfiles guardados en tu cuenta')} />}

      <section className={adult.stack} aria-labelledby="children-title">
        <div className={adult.cardHead}>
          <h2 id="children-title" className={adult.subheading}>Perfiles</h2>
          <Button onClick={() => navigate('/kids/new')}>Añadir perfil</Button>
        </div>
        {children.length === 0 ? (
          <Card>
            <p className={adult.lead}>Todavía no hay ningún perfil. Crea el primero para empezar la aventura.</p>
          </Card>
        ) : (
          <Card>
            <ul className={adult.list} aria-label="Perfiles">
              {children.map((c) => (
                <li key={c.id} className={s.childRow}>
                  <CompanionArt species={c.companion.species} size={64} colorway={c.companion.colorway} equipped={c.companion.equipped} animated={false} />
                  <div className={s.childInfo}>
                    <span className={s.childName}>{c.nickname}</span>
                    <span className={adult.muted}>
                      {c.grade ? `${c.grade}.º de Primaria` : 'Curso sin elegir'} · Compañero: {c.companion.name}
                    </span>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/adult/child/${c.id}`)}>Ver informe</Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className={s.tiles} aria-label="Secciones">
        {isSchool ? (
          <Link to="/adult/school" className={s.tile}>
            <span className={s.tileIcon} aria-hidden>C</span>
            <h3 className={s.tileTitle}>Clases y colegio</h3>
            <p className={s.tileText}>Crea clases, comparte los códigos con las familias y asigna práctica para la semana.</p>
            <span className={s.tileFoot}>Abrir clases →</span>
          </Link>
        ) : (
          signedIn && (
            <Link to="/adult/join" className={s.tile}>
              <span className={s.tileIcon} aria-hidden>C</span>
              <h3 className={s.tileTitle}>Unirse a una clase</h3>
              <p className={s.tileText}>Si el colegio de tu hijo o hija usa Numeria, introduce aquí el código de su clase.</p>
              <span className={s.tileFoot}>Introducir código →</span>
            </Link>
          )
        )}
        <Link to="/adult/settings" className={s.tile}>
          <span className={s.tileIcon} aria-hidden>A</span>
          <h3 className={s.tileTitle}>Ajustes y cuenta</h3>
          <p className={s.tileText}>Cuenta, miembros, sonido de cada perfil, cambiar el PIN y cerrar sesión.</p>
          <span className={s.tileFoot}>Abrir ajustes →</span>
        </Link>
        <Link to="/legal/privacidad" className={s.tile}>
          <span className={s.tileIcon} aria-hidden>P</span>
          <h3 className={s.tileTitle}>Privacidad y datos</h3>
          <p className={s.tileText}>Qué datos guardamos de los peques, para qué, y cómo exportarlos o borrarlos.</p>
          <span className={s.tileFoot}>Leer la política →</span>
        </Link>
      </section>
    </AdultPage>
  )
}
