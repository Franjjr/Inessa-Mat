/* Per-child learning settings. Sound, music and voice live in Settings (they are device-level habits). */
import { useState } from 'react'
import { updateChild } from '@/data'
import type { ChildProfile, ChildSettings } from '@/types'
import { toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { SwitchRow } from './SwitchRow'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function ChildSettingsCard({ child }: { child: ChildProfile }) {
  const [error, setError] = useState<string | null>(null)
  const settings = child.settings

  const change = async (patch: Partial<ChildSettings>) => {
    setError(null)
    try {
      await updateChild(child.id, { settings: { ...settings, ...patch } })
      toast('Cambio guardado')
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar el cambio. Inténtalo otra vez.'))
    }
  }

  return (
    <section className={adult.card} aria-labelledby="child-settings-title">
      <h2 id="child-settings-title" className={adult.subheading}>Ajustes de juego</h2>
      <p className={adult.muted}>Cambian cómo juega {child.nickname}. Se aplican en cuanto los guardas.</p>

      <SwitchRow
        label="Permitir actividades con tiempo"
        hint="Las carreras de velocidad. Si lo desactivas, no hay cronómetro."
        checked={settings.timedActivities}
        onChange={(v) => void change({ timedActivities: v })}
      />
      <SwitchRow
        label="Casillas grandes para escribir"
        hint="Útil con el dedo o para los más pequeños."
        checked={settings.bigCells}
        onChange={(v) => void change({ bigCells: v })}
      />

      <div className={adult.stack}>
        <span className={adult.label} id="handedness-label">Mano para escribir</span>
        <div className={s.segGroup} role="radiogroup" aria-labelledby="handedness-label">
          {(['right', 'left'] as const).map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={settings.handedness === h}
              className={adult.segment}
              onClick={() => void change({ handedness: h })}
            >
              {h === 'right' ? 'Derecha' : 'Izquierda'}
            </button>
          ))}
        </div>
      </div>

      <div className={adult.stack}>
        <span className={adult.label} id="session-label">Duración de cada sesión</span>
        <div className={s.segGroup} role="radiogroup" aria-labelledby="session-label">
          {[10, 15, 20, 30].map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={settings.sessionMinutes === m}
              className={adult.segment}
              onClick={() => void change({ sessionMinutes: m })}
            >
              {m} min
            </button>
          ))}
        </div>
        <p className={adult.hint}>Es el tiempo de juego que se propone cada día. Puede terminarse antes.</p>
      </div>

      <div className={adult.stack}>
        <span className={adult.label} id="input-label">Cómo escribe las respuestas</span>
        <div className={s.segGroup} role="radiogroup" aria-labelledby="input-label">
          {([
            ['auto', 'Automático'],
            ['pen', 'Lápiz'],
            ['keypad', 'Teclado en pantalla'],
            ['keyboard', 'Teclado físico'],
          ] as const).map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={settings.inputPreference === value}
              className={adult.segment}
              onClick={() => void change({ inputPreference: value })}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={adult.error} role="alert">{error}</p>}
    </section>
  )
}
