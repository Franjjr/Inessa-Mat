/* The English report's «Palabras que le cuesta decir»: the words whose last «Ahora dilo tú» result was one star. Shown only
   while the adult's speaking switch is on; no scores, no percentages, no audio (the results are kept on this device). */
import { useEffect, useState } from 'react'
import { listSpeaking } from '@/data'
import { hardToSay } from '@/engine'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function SpeakingWordsCard({ childId, speakingOn }: { childId: string; speakingOn: boolean }) {
  const [words, setWords] = useState<string[] | null>(null)

  useEffect(() => {
    if (!speakingOn) return
    let alive = true
    listSpeaking(childId)
      .then((records) => { if (alive) setWords(hardToSay(records)) })
      .catch(() => { if (alive) setWords([]) })
    return () => { alive = false }
  }, [childId, speakingOn])

  if (!speakingOn) return null
  return (
    <section className={adult.card} aria-labelledby="habla-palabras-title">
      <h3 id="habla-palabras-title" className={s.mistakeTitle}>Palabras que le cuesta decir</h3>
      {words === null ? null : words.length === 0 ? (
        <p className={adult.muted}>Ninguna por ahora.</p>
      ) : (
        <ul className={adult.list} aria-label="Palabras que le cuesta decir">
          {words.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
    </section>
  )
}
