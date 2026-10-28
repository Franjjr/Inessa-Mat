/* When the Caligrafía practice (letra ligada, pen only) is offered after the Lengua session. Pure: no React, no I/O.
   Offered only where the pen is in use (the device has seen a pen, or the child is writing with one now), when the
   child's handwriting setting is not switched off (a profile without the setting counts as on), and when Lengua is on. */
import type { ChildProfile, InputMode, SubjectId } from '@/types'
import { subjectOffered } from '@/engine/subjects'

export function caligrafiaOffered(child: ChildProfile, ink: { penSeen: boolean; mode: InputMode }): boolean {
  const lengua = (child.settings?.subjects ?? ['math']).includes('language') && subjectOffered('language', child.grade)
  const handwriting = child.settings?.handwriting !== false
  return lengua && handwriting && (ink.penSeen || ink.mode === 'pen')
}

/** The offer at the end of a session: only after a Lengua session with at least one answer (a run cut by the time with
    nothing answered, or a maths run, does not offer it). `offered` is caligrafiaOffered for this child and device. */
export function showCaligrafiaAtEnd({ offered, subject, answered }: { offered: boolean; subject: SubjectId; answered: number }): boolean {
  return offered && subject === 'language' && answered > 0
}
