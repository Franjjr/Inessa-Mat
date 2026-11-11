/* Child-facing sound switch: sound and voice together, always visible on the child's screens, so a child who cannot
   hear, or cannot read the notice «Activa el sonido», can find the control without the adult settings. The change is
   saved on the active child's profile and applied by the app (App.tsx) as for any other setting. */
import clsx from 'clsx'
import { updateChild, useActiveChild } from '@/data'
import { unlockAudio } from './index'
import s from './SoundSwitch.module.css'

export function SoundSwitch({ floating = false, className }: { floating?: boolean; className?: string }) {
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
      className={clsx(s.switch, floating && s.floating, !on && s.off, className)}
      onClick={toggle}
      aria-label={on ? 'Apagar el sonido y la voz' : 'Activar el sonido y la voz'}
    >
      <span aria-hidden className={s.icon}>{on ? '🔊' : '🔇'}</span>
      <span className={s.label}>{on ? 'Sonido' : 'Sin sonido'}</span>
    </button>
  )
}
