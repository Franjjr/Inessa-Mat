/* The printable diploma (A4 landscape). Presentational: child, companion and the date it was earned.
   The screen prints only this sheet (see diploma.module.css). */
import { Character, CompanionArt, Crystal, StarIcon } from '@/art'
import { DIPLOMA_BODY_C2, DIPLOMA_TEXT, renderTemplate, season1, templateContext } from '@/content'
import type { ChildProfile } from '@/types'
import { worldHex } from '@/world/rewards/worldColors'
import s from './diploma.module.css'

export interface DiplomaCertificateProps {
  child: ChildProfile
  /** Date the diploma was earned (ISO string or Date). Omitted while the diploma is still to be won. */
  date?: string | Date
  /** While the diploma is not earned: the eight crystals (true = won). The sheet shows in grey with its empty slots. */
  crystals?: boolean[]
  /** The season won: the 2.º adventure ('c2') says what was learnt in 2.º. */
  seasonId?: string
  className?: string
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export function diplomaDateLabel(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return Number.isNaN(d.getTime()) ? '' : DATE_FORMAT.format(d)
}

export function DiplomaCertificate({ child, date, crystals, seasonId, className }: DiplomaCertificateProps) {
  const ctx = templateContext(child)
  const pending = crystals !== undefined && date === undefined
  const t = (text: string) => renderTemplate(text, ctx)
  const companion = child.companion
  return (
    <article
      className={[s.sheet, pending ? s.pending : '', className].filter(Boolean).join(' ')}
      aria-label={pending ? `Diploma de ${ctx.childName}, por conseguir` : `Diploma de ${ctx.childName}`}
    >
      <div className={s.frame}>
        <div className={s.corner} data-corner="tl"><StarIcon size={38} filled /></div>
        <div className={s.corner} data-corner="tr"><StarIcon size={38} filled /></div>
        <div className={s.corner} data-corner="bl"><StarIcon size={38} filled /></div>
        <div className={s.corner} data-corner="br"><StarIcon size={38} filled /></div>

        <div className={s.head}>
          <p className={s.kicker}>{t(DIPLOMA_TEXT.kicker)}</p>
          <h1 className={s.title}>{t(DIPLOMA_TEXT.title)}</h1>
          <p className={s.subtitle}>{t(DIPLOMA_TEXT.subtitle)}</p>
        </div>

        <p className={s.givenTo}>{t(DIPLOMA_TEXT.givenTo)}</p>
        <p className={s.name}>{ctx.childName}</p>
        <p className={s.body}>{t(seasonId === 'c2' ? DIPLOMA_BODY_C2 : DIPLOMA_TEXT.body)}</p>

        {pending && crystals && (
          <div className={s.slots} aria-label={`${crystals.filter(Boolean).length} de ${crystals.length} cristales`}>
            {season1.worlds.map((w, i) => (
              <span key={w.id} className={s.slot}>
                <Crystal color={worldHex(w.id)} state={crystals[i] ? 'collected' : 'empty'} size={44} label={`Cristal ${w.crystalName}`} />
              </span>
            ))}
          </div>
        )}

        <div className={s.foot}>
          <div className={s.companion}>
            <CompanionArt
              species={companion.species}
              colorway={companion.colorway}
              equipped={companion.equipped}
              size={118}
              animated={false}
            />
            <span className={s.companionName}>{companion.name || ctx.petName}</span>
          </div>
          <div className={s.date}>
            <span className={s.dateLabel}>{pending ? 'Por conseguir' : 'Conseguido el'}</span>
            <span className={s.dateValue}>{pending ? '—' : diplomaDateLabel(date ?? '')}</span>
          </div>
          <div className={s.signature}>
            <Character id="lumi" pose="happy" size={118} animated={false} />
            <span className={s.signLine}>{t(DIPLOMA_TEXT.signature)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
