/* Inglés de 3.º: the components the English views share (the «🔊 Otra vez» control and the picture of a card). The hooks
   for the sound are in sound.ts. */
import { Button } from '@/ui'
import type { EnglishCard } from '@/types'
import s from './Ingles.module.css'

/** «🔊 Otra vez», or, with the sound off, the reason the child cannot hear it. The text is never written here. */
export function ListenControl({ soundOn, soundSetting, again }: { soundOn: boolean; soundSetting: boolean; again: () => void }) {
  if (!soundOn) {
    return (
      <p className={s.prompt}>
        {soundSetting ? 'Este aparato no tiene voz: pide a alguien que lea la palabra en voz alta' : 'Activa el sonido para escuchar'}
      </p>
    )
  }
  return <Button variant="secondary" size="lg" onClick={again}>🔊 Otra vez</Button>
}

/** A picture: its emoji, or the Spanish word when the theme has no picture. The family cards keep the Spanish gloss below. */
export function PictureFace({ card }: { card: EnglishCard }) {
  if (!card.emoji) return <span className={s.gloss}>{card.es}</span>
  return (
    <span className={s.face}>
      <span aria-hidden>{card.emoji}</span>
      {card.theme === 'familia' && <span className={s.gloss}>{card.es}</span>}
    </span>
  )
}


