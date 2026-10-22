/* The grown-ups' start page. For the selected child: one conclusion built from the times-table data, the ten
   tables with a legend, and the most frequent mistake. Beside it, the profiles (pick one, open its report, add
   one) and the three links: settings and account, classes and school, privacy and data. */
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import { CompanionArt } from '@/art'
import { getChildSummary, useAuth, useChildren } from '@/data'
import { describeError } from '@/engine'
import type { ChildSummary, ErrorType } from '@/types'
import { BackButton, Button, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ClaimLocalPanel } from '../shared/ClaimLocalPanel'
import { SyncBadge } from '../shared/SyncBadge'
import { plural, formatPercent } from '../shared/format'
import { errorMessage } from '../shared/messages'
import { lockAdultArea } from '../gate/AdultGate'
import { readTables, TABLE_STATE_LABEL, type TableState } from '../shared/reading'
import s from './home.module.css'
import adult from '../shared/adult.module.css'

const KIND_LABEL = { family: 'Familia', school: 'Colegio' } as const
const TABLE_LEGEND: TableState[] = ['mastered', 'struggling', 'learning', 'unseen']
const WORLDS_TOTAL = 8

export default function AdultHomeScreen() {
  const { status, activeOrg, organizations, setActiveOrg, backendAvailable } = useAuth()
  const children = useChildren() ?? []
  const navigate = useNavigate()
  const isSchool = activeOrg?.kind === 'school'
  const signedIn = status === 'signed-in'

  const [pickedId, setPickedId] = useState<string | null>(null)
  const current = children.find((c) => c.id === pickedId) ?? children[0] ?? null
  const currentId = current?.id ?? null
  const [summary, setSummary] = useState<ChildSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    setSummary(null)
    setSummaryError(null)
    if (!currentId) return
    let alive = true
    getChildSummary(currentId)
      .then((sum) => {
        if (alive) setSummary(sum)
      })
      .catch((e: unknown) => {
        if (alive) setSummaryError(errorMessage(e, 'No hemos podido cargar este resumen.'))
      })
    return () => {
      alive = false
    }
  }, [currentId])

  const leave = () => {
    lockAdultArea()
    navigate('/kids')
  }

  const reading = current && summary ? readTables(summary.factGrid, current.nickname) : null
  const topError = summary?.topErrors[0] ?? null

  return (
    <AdultPage title="Zona de adultos" back="/kids" actions={<BackButton variant="exit" onClick={leave} />}>
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

      {/* Without an account the panel below already says it, with the button to create one. */}
      {status !== 'local-only' && <SyncBadge />}

      {status === 'local-only' && (
        <div className={`${adult.notice} ${adult.noticeInfo}`} role="note">
          <div className={adult.stack} style={{ gap: 6, flex: 1 }}>
            <strong>Estás usando Repasitos sin cuenta.</strong>
            <span>Los datos solo están en este dispositivo. Si creas una cuenta, puedes guardarlos y verlos desde otros dispositivos.</span>
          </div>
          {backendAvailable && (
            <Button size="sm" onClick={() => navigate('/signup')}>Crear cuenta</Button>
          )}
        </div>
      )}

      {signedIn && <ClaimLocalPanel onDone={() => toast('Perfiles guardados en tu cuenta')} />}

      {children.length === 0 ? (
        <section className={`${adult.card} ${adult.cardYellow}`} aria-label="Sin perfiles">
          <p className={adult.lead}>Todavía no hay ningún perfil. Crea el primero para empezar la aventura.</p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/kids/new')}>Añadir perfil</Button>
          </div>
        </section>
      ) : (
        <div className={s.main}>
          <div className={s.col}>
            <section className={`${adult.card} ${adult.cardYellow} ${s.verdict}`} aria-labelledby="verdict-title">
              {current && (
                <div className={s.pic} aria-hidden>
                  <CompanionArt species={current.companion.species} size={104} colorway={current.companion.colorway} equipped={current.companion.equipped} animated={false} />
                </div>
              )}
              <div className={adult.stack} style={{ gap: 6, minWidth: 0 }}>
                <span className={s.kicker}>
                  {current?.nickname} · {current?.grade ? `${current.grade}.º de Primaria` : 'Curso sin elegir'} · Matemáticas
                </span>
                {summaryError && <p className={adult.error} role="alert">{summaryError}</p>}
                {!summary && !summaryError && <p className={adult.muted} role="status">Preparando el resumen…</p>}
                {reading && summary && (
                  <>
                    <h2 id="verdict-title" className={s.verdictTitle}>{reading.headline}</h2>
                    <p className={adult.lead}>
                      {summary.worldsCompleted} de {WORLDS_TOTAL} cristales conseguidos. {reading.support}
                    </p>
                  </>
                )}
              </div>
            </section>

            <section className={`${adult.card} ${adult.cardGreen}`} aria-labelledby="tables-title">
              <header className={s.tablesHead}>
                <h2 id="tables-title" className={adult.subheading}>Tablas de multiplicar</h2>
                <ul className={s.legend} aria-label="Leyenda de las tablas">
                  {TABLE_LEGEND.map((st) => (
                    <li key={st} className={s.legendItem}>
                      <span className={clsx(s.swatch, s[st])} aria-hidden />
                      {TABLE_STATE_LABEL[st]}
                    </li>
                  ))}
                </ul>
              </header>
              {reading ? (
                <ul className={s.tableGrid} aria-label="Estado de cada tabla">
                  {reading.tables.map((t) => (
                    <li
                      key={t.n}
                      className={clsx(s.tableCell, s[t.state])}
                      aria-label={`Tabla del ${t.n}: ${TABLE_STATE_LABEL[t.state]}`}
                    >
                      <b>{t.n}</b>
                      <small>{TABLE_STATE_LABEL[t.state]}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={adult.muted}>Las tablas aparecen cuando el niño empiece a jugar.</p>
              )}
            </section>

            <section className={`${adult.card} ${adult.cardPink}`} aria-labelledby="error-title">
              <h2 id="error-title" className={adult.subheading}>Error más frecuente</h2>
              {topError ? (
                <p className={adult.lead}>
                  {describeError(topError.errorType as ErrorType)}: {topError.count} {topError.count === 1 ? 'vez' : 'veces'} en el último mes.
                  Los errores de lectura de la letra no cuentan.
                </p>
              ) : (
                <p className={adult.lead}>Todavía no hay errores que destacar en el último mes.</p>
              )}
              {current && (
                <div className={adult.actions}>
                  <Button variant="secondary" onClick={() => navigate(`/adult/child/${current.id}`)}>Ver el informe de {current.nickname}</Button>
                </div>
              )}
            </section>
          </div>

          <section className={`${adult.card} ${s.kids}`} aria-labelledby="children-title">
            <div className={adult.cardHead}>
              <h2 id="children-title" className={adult.subheading}>Perfiles</h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/kids/new')}>+ Añadir perfil</Button>
            </div>
            <ul className={adult.list} aria-label="Perfiles">
              {children.map((c) => {
                const selected = c.id === currentId
                return (
                  <li key={c.id} className={clsx(s.childRow, selected && s.childRowOn)}>
                    <button
                      type="button"
                      className={s.childPick}
                      aria-pressed={selected}
                      onClick={() => setPickedId(c.id)}
                    >
                      <CompanionArt species={c.companion.species} size={64} colorway={c.companion.colorway} equipped={c.companion.equipped} animated={false} />
                      <span className={s.childInfo}>
                        <span className={s.childName}>{c.nickname}</span>
                        <span className={adult.muted}>
                          {c.grade ? `${c.grade}.º de Primaria` : 'Curso sin elegir'} · Compañero: {c.companion.name}
                        </span>
                        {selected && summary && <span className={adult.muted}>Aciertos de la semana: {formatPercent(summary.accuracyLast7Days)}</span>}
                      </span>
                    </button>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/adult/child/${c.id}`)}>Ver informe</Button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      <section className={s.links} aria-label="Secciones">
        <Link to="/adult/settings" className={clsx(s.link, s.linkA)}>
          <span className={s.linkTitle}>Ajustes y cuenta</span>
          <span className={s.linkText}>Cuenta, cambiar el PIN y cerrar sesión.</span>
        </Link>
        <Link to={isSchool || !signedIn ? '/adult/school' : '/adult/join'} className={clsx(s.link, s.linkB)}>
          <span className={s.linkTitle}>Clases y colegio</span>
          <span className={s.linkText}>
            {isSchool
              ? 'Crea clases, comparte sus códigos y asigna práctica para la semana.'
              : signedIn
                ? 'Si el colegio de tu hijo usa Repasitos, une aquí a tu hijo con el código de su clase.'
                : 'Solo para colegios: códigos y práctica de la semana.'}
          </span>
        </Link>
        <Link to="/legal/privacidad" className={clsx(s.link, s.linkC)}>
          <span className={s.linkTitle}>Privacidad y datos</span>
          <span className={s.linkText}>Qué datos guardamos de los niños, para qué, y cómo exportarlos o borrarlos.</span>
        </Link>
      </section>
    </AdultPage>
  )
}
