/* Lengua visuals: lng-sentence (a sentence on a card, with one part marked) and lng-word (a word, cut into its parts).
   The mark is one of noun, adj, verb, art (a class: the colour and its name in a legend) or, for lng-word, the text of a
   part (that part is highlighted). Without a mark a highlight is drawn in the neutral colour. Sizes scale with the stage. */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { motionT, strParam } from './types'
import s from './lengua.module.css'

export type LngMark = 'noun' | 'adj' | 'verb' | 'art'

const MARK_NAME: Record<LngMark, string> = { noun: 'sustantivo', adj: 'adjetivo', verb: 'verbo', art: 'artículo' }
const MARK_BG: Record<LngMark, string> = {
  noun: 'var(--c-primary-soft)', adj: 'var(--c-gold-soft)', verb: 'var(--c-success-soft)', art: 'var(--c-magic-soft)',
}
const NEUTRAL_BG = 'var(--c-yellow-soft)'

function classOf(mark: string): LngMark | undefined {
  return mark === 'noun' || mark === 'adj' || mark === 'verb' || mark === 'art' ? mark : undefined
}

/** A sentence on a card; `highlight` (a piece of the text) is drawn in the mark's colour, with its name below. */
export function LngSentenceVisual({ params, reduced }: VisualProps) {
  const text = strParam(params, 'text', '')
  const highlight = strParam(params, 'highlight', '')
  const mark = classOf(strParam(params, 'mark', ''))
  const at = highlight ? text.indexOf(highlight) : -1
  const before = at >= 0 ? text.slice(0, at) : text
  const marked = at >= 0 ? highlight : ''
  const after = at >= 0 ? text.slice(at + highlight.length) : ''
  return (
    <div className={s.stage} data-testid="lng-sentence">
      <div className={s.frame}>
      <p className={s.card}>
        <span>{before}</span>
        {marked && (
          <motion.span
            key={marked + (mark ?? '')}
            initial={reduced ? false : { opacity: 0.2 }}
            animate={{ opacity: 1 }}
            transition={motionT(reduced, { duration: 0.4 })}
            className={s.hl}
            style={{ background: mark ? MARK_BG[mark] : NEUTRAL_BG }}
          >
            {marked}
          </motion.span>
        )}
        <span>{after}</span>
      </p>
      {marked && mark && <span className={s.tab}>{MARK_NAME[mark]}</span>}
      </div>
    </div>
  )
}

/** A word, optionally cut into parts: «-» joins syllables or letter groups, «+» joins the two words of a compound. */
export function LngWordVisual({ params, reduced }: VisualProps) {
  const word = strParam(params, 'word', '')
  const partsText = strParam(params, 'parts', '')
  const mark = strParam(params, 'mark', '')
  const cls = classOf(mark)
  const pieces = partsText ? partsText.match(/[^-+]+/g) ?? [word] : [word]
  const joins = partsText ? partsText.match(/[-+]/g) ?? [] : []
  const wholeBg = cls ? MARK_BG[cls] : undefined
  return (
    <div className={s.stage} data-testid="lng-word">
      <motion.div
        key={word + partsText + mark}
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={motionT(reduced, { duration: 0.35 })}
        className={s.wordBox}
      >
        {pieces.length === 1 ? (
          <span className={s.piece} style={wholeBg ? { background: wholeBg } : undefined}>{pieces[0]}</span>
        ) : (
          pieces.map((p, i) => {
            const hit = !cls && mark !== '' && p === mark
            const bg = hit ? NEUTRAL_BG : wholeBg
            return (
              <span key={`${p}-${i}`} className={s.pieceRow}>
                <span className={s.piece} style={bg ? { background: bg } : undefined}>{p}</span>
                {joins[i] === '+' && <span className={s.plus} aria-hidden="true">+</span>}
              </span>
            )
          })
        )}
      </motion.div>
      {cls && <span className={s.legend}>{MARK_NAME[cls]}</span>}
    </div>
  )
}
