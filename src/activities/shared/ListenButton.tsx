/* «Escuchar» / «Parar»: reads an exercise statement aloud when the child presses it. It works even when the automatic
   reading is off (force), and a second press stops the voice. */
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { speech } from '@/audio'
import type { SpeechOptions } from '@/types'
import s from './ListenButton.module.css'

export interface ListenButtonProps {
  /** What to read. Symbols and digits are fine: the voice turns them into words. */
  text: string
  /** The voice that reads it (default Lumi). */
  voice?: SpeechOptions['voice']
  className?: string
}

export function ListenButton({ text, voice = 'lumi', className }: ListenButtonProps) {
  const [speaking, setSpeaking] = useState(false)
  // Each press gets a number so a finished old reading does not switch off a newer one.
  const turn = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      // Leaving the exercise cuts the voice only if this button was the one speaking.
      if (turn.current > 0) speech.stop()
    }
  }, [])

  // A new statement is a new exercise: the old reading stops.
  useEffect(() => {
    return () => {
      if (turn.current > 0) {
        turn.current += 1
        speech.stop()
        if (mounted.current) setSpeaking(false)
      }
    }
  }, [text])

  const press = useCallback(() => {
    if (speaking) {
      turn.current += 1
      speech.stop()
      setSpeaking(false)
      return
    }
    const mine = ++turn.current
    setSpeaking(true)
    void speech
      .say(text, { voice, force: true, interrupt: true })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current && turn.current === mine) setSpeaking(false)
      })
  }, [speaking, text, voice])

  return (
    <button type="button" className={clsx(s.listen, speaking && s.speaking, className)} onClick={press} aria-pressed={speaking}>
      <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span> {speaking ? 'Parar' : 'Escuchar'}
    </button>
  )
}
