/* The adult switch «Hablar en voz alta (micrófono)». Only shown when English is on. Off by default. Turning it on asks the adult
   to confirm (consent, with the privacy facts); turning it off just clears `on` and keeps the date of the last consent. */
import { useState } from 'react'
import { updateChild } from '@/data'
import type { ChildProfile } from '@/types'
import { toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { ConfirmModal } from '../shared/ConfirmModal'
import { SwitchRow } from './SwitchRow'
import adult from '../shared/adult.module.css'

export function SpeakingCard({ child }: { child: ChildProfile }) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const speaking = child.settings.speaking
  const on = speaking?.on === true

  const save = async (next: NonNullable<ChildProfile['settings']['speaking']>) => {
    setError(null)
    setBusy(true)
    try {
      await updateChild(child.id, { settings: { ...child.settings, speaking: next } })
      toast('Cambio guardado')
      setAsking(false)
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar el cambio. Inténtalo otra vez.'))
    } finally {
      setBusy(false)
    }
  }

  if (!child.settings.subjects?.includes('english')) return null

  return (
    <section className={adult.card} aria-labelledby="speaking-title">
      <h2 id="speaking-title" className={adult.subheading}>Pronunciación en inglés</h2>
      <p className={adult.muted}>
        Con el micrófono, {child.nickname} puede decir palabras en inglés en voz alta y recibir estrellas por su pronunciación.
      </p>
      <SwitchRow
        label="Hablar en voz alta (micrófono)"
        hint={on
          ? 'Encendido. Puedes apagarlo cuando quieras.'
          : 'Apagado de serie. Solo un adulto lo puede activar, con su consentimiento.'}
        checked={on}
        onChange={(v) => {
          if (v) {
            setError(null)
            setAsking(true)
          } else {
            void save({ on: false, consentAt: speaking?.consentAt })
          }
        }}
      />
      {error && !asking && <p className={adult.error} role="alert">{error}</p>}

      <ConfirmModal
        open={asking}
        title="Activar el micrófono"
        confirmLabel="Activar"
        busy={busy}
        error={error}
        onCancel={() => setAsking(false)}
        onConfirm={() => void save({ on: true, consentAt: new Date().toISOString() })}
      >
        <p className={adult.muted} style={{ fontSize: 'var(--fs-md)' }}>
          <strong>Para qué:</strong> el micrófono sirve para puntuar cómo {child.nickname} pronuncia las palabras y frases en inglés.
          Es opcional: sin él, el inglés funciona igual.
        </p>
        <p className={adult.muted} style={{ fontSize: 'var(--fs-md)' }}>
          <strong>Dónde va el audio:</strong> se envía a Microsoft Azure, en Irlanda (Unión Europea), solo para puntuarlo.
          El audio no se guarda: Repasitos no lo guarda y Microsoft no lo usa para entrenar sus sistemas.
        </p>
        <p className={adult.muted} style={{ fontSize: 'var(--fs-md)' }}>
          <strong>Quién decide:</strong> solo un adulto puede activarlo, y puede apagarlo en cualquier momento desde esta misma ficha.
        </p>
        <p className={adult.muted} style={{ fontSize: 'var(--fs-md)' }}>
          <strong>Si falla:</strong> nunca bloquea el avance. Si no se puede usar, {child.nickname} sigue con sus ejercicios sin penalización.
          Son como máximo 10 intentos de hablar al día.
        </p>
      </ConfirmModal>
    </section>
  )
}
