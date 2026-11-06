/* Inglés visuals. eng-word: one word (its picture, the English word, its Spanish meaning). eng-words: every word of a
   vocabulary theme as a grid. eng-number: one number in figures with its English word. eng-number-list: a range of
   numbers as a grid. Tapping an English word says it in the English voice. */
import { motion } from 'motion/react'
import { speech } from '@/audio/speech'
import { numberToEnglish } from '@/engine/ingles/numbers'
import { ENGLISH_WORDS } from '@/engine/ingles/words'
import type { VisualProps } from './types'
import { motionT, numParam, strParam } from './types'
import s from './visuals.module.css'
import e from './english.module.css'

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
        className={`${e.button} ${e.single}`}
      >
        {emoji && <span aria-hidden="true" className={e.singleEmoji}>{emoji}</span>}
        <span className={e.singleEn}>{en}</span>
        {es && <span className={e.singleEs}>{es}</span>}
      </motion.button>
    </div>
  )
}

/** Every word of a vocabulary theme (`theme`: animales, colores…) as a grid of compact cells; each tap says the word. */
export function EngWordsVisual({ params }: VisualProps) {
  const theme = strParam(params, 'theme', '')
  const words = ENGLISH_WORDS.filter((w) => w.theme === theme)
  return (
    <div className={s.stage} data-testid="eng-words">
      <ul className={e.grid} aria-label="Palabras de hoy">
        {words.map((w) => (
          <li key={w.en}>
            <button type="button" className={`${e.button} ${e.cell}`} onClick={() => sayEnglish(w.en)} aria-label={`Escuchar «${w.en}»`}>
              {w.emoji && <span aria-hidden="true" className={e.cellEmoji}>{w.emoji}</span>}
              <span className={e.cellEn}>{w.en}</span>
              <span className={e.cellEs}>{w.es}</span>
            </button>
          </li>
        ))}
      </ul>
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
        className={`${e.button} ${e.single}`}
      >
        <span className={e.singleNumber}>{n}</span>
        <span className={e.singleEnNumber}>{en}</span>
      </motion.button>
    </div>
  )
}

/** The numbers from `from` to `to` (every `step`, 1 by default; 0 to 100 only) as a grid: figures and English words. */
export function EngNumberListVisual({ params }: VisualProps) {
  const from = numParam(params, 'from', 0)
  const to = Math.min(100, numParam(params, 'to', 20))
  const step = Math.max(1, numParam(params, 'step', 1))
  const values: number[] = []
  for (let v = Math.max(0, from); v <= to; v += step) values.push(v)
  return (
    <div className={s.stage} data-testid="eng-number-list">
      <ul className={e.grid} aria-label="Números de hoy">
        {values.map((v) => {
          const en = numberToEnglish(v)
          return (
            <li key={v}>
              <button type="button" className={`${e.button} ${e.cell}`} onClick={() => sayEnglish(en)} aria-label={`Escuchar «${en}»`}>
                <span className={e.cellNumber}>{v}</span>
                <span className={e.cellEn}>{en}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
