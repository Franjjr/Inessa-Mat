/* <DoubtPrompt/> — the gentle questions the ink layer asks before an answer is graded. Rendered once by <InkProvider>.
   - "¿Has escrito un 7?": a digit was read with low confidence. The child confirms it ("Sí, es así") or rewrites it
     ("La escribo otra vez" erases those digits and puts the pen in the first one).
   - A question of the answer flows (LearningStore.ask): a misread digit ("He leído 47. ¿Es lo que has escrito?"),
     a number typed in reading order in a column ("¿Querías escribir 625?") or ink that could not be read.
   A misread is never counted as a maths error (see LearningStore.requestConfirm). The question is also said aloud. */
import { useEffect, useSyncExternalStore } from 'react'
import { speech } from '@/audio'
import { useInk } from './context'
import { digitWord } from './speakDigits'
import s from './DoubtPrompt.module.css'

/** Spanish list of digits: "un 7", "3 y 7", "3, 7 y 1". */
export function digitsList(digits: number[]): string {
  if (digits.length <= 1) return `un ${digits[0] ?? ''}`.trim()
  return `${digits.slice(0, -1).join(', ')} y ${digits[digits.length - 1]}`
}

/** The doubt question as the voice says it: "¿Has escrito un siete?". */
export function spokenDoubt(digits: number[]): string {
  if (digits.length <= 1) return `¿Has escrito un ${digitWord(digits[0] ?? 0)}?`
  const words = digits.map(digitWord)
  return `¿Has escrito ${words.slice(0, -1).join(', ')} y ${words[words.length - 1]}?`
}

function sayQuietly(text: string): void {
  try {
    void speech.say(text, { interrupt: true })
  } catch {
    /* speech is optional (and absent in some tests) */
  }
}

export function DoubtPrompt() {
  const { learning } = useInk()
  useSyncExternalStore(learning.subscribe, () => learning.version)
  useEffect(() => learning.mountPrompt(), [learning])

  const question = learning.currentQuestion()
  const open = learning.isPromptOpen()
  const digits = open ? learning.uncertainDigits() : []
  const spoken = question ? question.speak ?? question.text : open && digits.length ? spokenDoubt(digits) : null
  useEffect(() => {
    if (spoken) sayQuietly(spoken)
  }, [spoken])

  // The doubtful digits glow while the question is open.
  const keys = open ? learning.uncertainKeys().join('|') : ''
  useEffect(() => {
    if (!keys) return
    const els = keys.split('|').flatMap((k) => [...document.querySelectorAll<HTMLElement>(`[data-ink-key="${CSS.escape(k)}"]`)])
    for (const el of els) el.dataset.doubt = 'true'
    return () => { for (const el of els) delete el.dataset.doubt }
  }, [keys])

  if (question) {
    return (
      <div className={s.prompt} role="status" aria-live="polite" data-testid="ink-doubt-prompt" data-kind={question.kind}>
        <p className={s.text}>{question.text}</p>
        {question.shown && <p className={s.shown} aria-hidden>{question.shown}</p>}
        <div className={s.actions}>
          {question.actions.map((a) => (
            <button key={a.label} type="button" className={a.primary ? s.yes : s.no} onClick={a.run}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!open || digits.length === 0) return null
  const plural = digits.length > 1
  const text = plural
    ? `¿Has escrito ${digitsList(digits)}? Si no, bórralos y escríbelos otra vez`
    : `¿Has escrito ${digitsList(digits)}? Si no, bórralo y escríbelo otra vez`
  const rewrite = () => {
    const list = learning.uncertainKeys()
    learning.dismissPrompt()
    // Erase every doubtful digit; the first one written gets the pen.
    for (const k of [...list].reverse()) learning.rewrite(k)
  }
  return (
    <div className={s.prompt} role="status" aria-live="polite" data-testid="ink-doubt-prompt">
      <p className={s.text}>{text}</p>
      <div className={s.actions}>
        <button type="button" className={s.yes} onClick={() => learning.confirmDoubts()}>
          Sí, es así
        </button>
        <button type="button" className={s.no} onClick={rewrite}>
          La escribo otra vez
        </button>
      </div>
    </div>
  )
}
