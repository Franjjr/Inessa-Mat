/* Inglés visuals: eng-word (a picture, the word in English and its Spanish meaning) and eng-number (a number in figures
   and in English). Tapping the English word says it in the English voice; the picture is optional. */
import { motion } from 'motion/react'
import { speech } from '@/audio/speech'
import type { VisualProps } from './types'
import { motionT, numParam, strParam } from './types'
import s from './visuals.module.css'

function sayEnglish(word: string) {
  void speech.say(word, { voice: 'english', interrupt: true })
}

/** A word on the board: its picture (when it has one), the word in English and its Spanish meaning under it. */
export function EngWordVisual({ params, reduced }: VisualProps) {
  const emoji = strParam(params, 'emoji', '')
  const en = strParam(params, 'en', '')
  const es = strParam(params, 'es', '')
  return (
    <div className={s.stage} data-testid="eng-word">
      <motion.button
        key={en}
        type="button"
        onClick={() => sayEnglish(en)}
        aria-label={`Escuchar «${en}»`}
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={motionT(reduced, { duration: 0.35 })}
        style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}
      >
        {emoji && <span aria-hidden="true" style={{ fontSize: 'clamp(3rem, 22cqmin, 7rem)', lineHeight: 1 }}>{emoji}</span>}
        <span style={{ fontSize: 'clamp(2rem, 12cqmin, 4.5rem)', fontWeight: 700, lineHeight: 1.1 }}>{en}</span>
        {es && <span className={s.muted} style={{ fontSize: 'var(--fs-md)' }}>{es}</span>}
      </motion.button>
    </div>
  )
}

/** A number in figures with its English word under it. */
export function EngNumberVisual({ params, reduced }: VisualProps) {
  const n = numParam(params, 'n', 0)
  const en = strParam(params, 'en', '')
  return (
    <div className={s.stage} data-testid="eng-number">
      <motion.button
        key={`${n}-${en}`}
        type="button"
        onClick={() => sayEnglish(en)}
        aria-label={`Escuchar «${en}»`}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionT(reduced, { duration: 0.35 })}
        style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}
      >
        <span style={{ fontSize: 'clamp(3.5rem, 30cqmin, 8rem)', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
        <span style={{ fontSize: 'clamp(1.6rem, 9cqmin, 3rem)', fontWeight: 600 }}>{en}</span>
      </motion.button>
    </div>
  )
}
