/* Child-facing sound switch: sound (and the voice as it was), shown inside the notices «Activa el sonido» so the child can
   turn the sound on right there, without the adult settings. It is never a floating button over the screens: a fixed
   pill in a corner covered the buttons under it (seen in the e2e: «Ahora no» could not be tapped). The change is
   saved on the active child's profile and applied by the app (App.tsx) as for any other setting. */
import clsx from 'clsx'
import { updateChild, useActiveChild } from '@/data'
import { unlockAudio } from './index'
import s from './SoundSwitch.module.css'

const memoryKey = (childId: string) => `repasitos:voice-before-mute:${childId}`

function writeVoiceMemory(childId: string, voice: boolean) {
  try { window.localStorage.setItem(memoryKey(childId), voice ? '1' : '0') } catch { /* no storage: both on next time */ }
}

function readVoiceMemory(childId: string): boolean | null {
  try {
    const v = window.localStorage.getItem(memoryKey(childId))
    return v === '1' ? true : v === '0' ? false : null
  } catch { return null }
}

export function SoundSwitch({ className }: { className?: string }) {
  const { child } = useActiveChild()
  if (!child) return null
  const on = child.settings.sound
  const toggle = () => {
    // a tap is a user gesture: it also unlocks audio on iOS
    unlockAudio()
    const next = !on
    // Turning off remembers how the voice was; turning on restores it (no memory: both on). A child whose voice was
    // already off alone keeps it off when the sound comes back.
    let voice = false
    if (!next) writeVoiceMemory(child.id, child.settings.voice)
    else voice = readVoiceMemory(child.id) ?? true
    updateChild(child.id, { settings: { ...child.settings, sound: next, voice } }).catch((err: unknown) =>
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
