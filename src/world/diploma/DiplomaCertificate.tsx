/* The printable diploma (A4 landscape). Presentational: child, companion and the date it was earned.
   The screen prints only this sheet (see diploma.module.css). */
import { Character, CompanionArt, StarIcon } from '@/art'
import { DIPLOMA_TEXT, renderTemplate, templateContext } from '@/content'
import type { ChildProfile } from '@/types'
import s from './diploma.module.css'

export interface DiplomaCertificateProps {
  child: ChildProfile
  /** Date the diploma was earned (ISO string or Date). */
  date: string | Date
  className?: string
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export function diplomaDateLabel(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return Number.isNaN(d.getTime()) ? '' : DATE_FORMAT.format(d)
}

export function DiplomaCertificate({ child, date, className }: DiplomaCertificateProps) {
  const ctx = templateContext(child)
  const t = (text: string) => renderTemplate(text, ctx)
  const companion = child.companion
  return (
    <article className={[s.sheet, className].filter(Boolean).join(' ')} aria-label={`Diploma de ${ctx.childName}`}>
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
        <p className={s.body}>{t(DIPLOMA_TEXT.body)}</p>

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
            <span className={s.dateLabel}>Conseguido el</span>
            <span className={s.dateValue}>{diplomaDateLabel(date)}</span>
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
