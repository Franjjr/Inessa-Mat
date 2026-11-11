/* Inglés de 3.º: the components the English views share (the «🔊 Otra vez» control and the picture of a card). The hooks
   for the sound are in sound.ts. */
import { SoundSwitch } from '@/audio/SoundSwitch'
import { Button } from '@/ui'
import type { EnglishCard } from '@/types'
import s from './Ingles.module.css'

/** «🔊 Otra vez», or, with the sound off, the reason the child cannot hear it. The text is never written here. */
export function ListenControl({ soundOn, soundSetting, again }: { soundOn: boolean; soundSetting: boolean; again: () => void }) {
  if (!soundOn) {
    // Only a switched-off sound has a switch to turn it on; a device without a voice has none to offer.
    return soundSetting ? (
      <p className={s.prompt}>Este aparato no tiene voz: pide a alguien que lea la palabra en voz alta</p>
    ) : (
      <>
        <p className={s.prompt}>Activa el sonido para escuchar</p>
        <SoundSwitch />
      </>
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


