/* Child-facing sound switch: sound and voice together, shown inside the notices «Activa el sonido» so the child can
   turn the sound on right there, without the adult settings. It is never a floating button over the screens: a fixed
   pill in a corner covered the buttons under it (seen in the e2e: «Ahora no» could not be tapped). The change is
   saved on the active child's profile and applied by the app (App.tsx) as for any other setting. */
import clsx from 'clsx'
import { updateChild, useActiveChild } from '@/data'
import { unlockAudio } from './index'
import s from './SoundSwitch.module.css'

export function SoundSwitch({ className }: { className?: string }) {
  const { child } = useActiveChild()
  if (!child) return null
  const on = child.settings.sound
  const toggle = () => {
    // a tap is a user gesture: it also unlocks audio on iOS
    unlockAudio()
    const next = !on
    updateChild(child.id, { settings: { ...child.settings, sound: next, voice: next } }).catch((err: unknown) =>
      console.warn('[audio] could not save the sound setting', err),
    )
  }
  return (
    <button
      type="button"
      className={clsx(s.switch, !on && s.off, className)}
      onClick={toggle}
      aria-label={on ? 'Apagar el sonido y la voz' : 'Activar el sonido y la voz'}
    >
      <span aria-hidden className={s.icon}>{on ? '🔊' : '🔇'}</span>
      <span className={s.label}>{on ? 'Sonido' : 'Sin sonido'}</span>
    </button>
  )
}
