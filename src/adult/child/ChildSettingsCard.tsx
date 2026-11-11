/* Per-child learning settings. Sound, music and voice live in Settings (they are device-level habits).
   The subtraction and division methods are the ones of the child's school: only the grown-up chooses them here, each
   option with its notebook drawing and its sentence always visible. Until they are answered, the question is shown on
   top (never blocking): the defaults are pedir prestado and the galera con restas. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DIV_METHODS, SUB_METHODS, TABLE_METHODS, normaliseDivMethod, normaliseSubMethod, normaliseTableMethod } from '@/engine'
import { updateChild } from '@/data'
import type { ChildProfile, ChildSettings } from '@/types'
import { toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { SwitchRow } from './SwitchRow'
import { MethodSketch, type SketchId } from './MethodSketch'
import { SchoolMethodQuestion, needsSchoolMethod } from './SchoolMethodQuestion'
import m from './MethodSketch.module.css'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function ChildSettingsCard({ child }: { child: ChildProfile }) {
  const [error, setError] = useState<string | null>(null)
  const settings = {
    ...child.settings,
    subMethod: normaliseSubMethod(child.settings.subMethod),
    divMethod: normaliseDivMethod(child.settings.divMethod),
    tableMethod: normaliseTableMethod(child.settings.tableMethod),
  }
  const trick = TABLE_METHODS.find((t) => t.id === settings.tableMethod) ?? null

  const change = async (patch: Partial<ChildSettings>) => {
    setError(null)
    try {
      await updateChild(child.id, { settings: { ...child.settings, ...patch } })
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
      <SwitchRow
        label="Caligrafía con lápiz"
        hint="Al terminar Lengua, se le propone practicar la letra con el lápiz, 5 minutos. Las minúsculas son de letra ligada; las mayúsculas son de imprenta (no se ligan). Solo aparece en un dispositivo donde se usa el lápiz."
        checked={settings.handwriting !== false}
        onChange={(v) => void change({ handwriting: v })}
      />
      <Link to="/adult/caligrafia-ensayo" className={s.trialLink}>Probar la nota de caligrafía</Link>

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

      {needsSchoolMethod(child) && (
        <div className={`${adult.notice} ${adult.noticeInfo}`} role="note" aria-label="Cómo se hace en su colegio">
          <SchoolMethodQuestion child={child} />
        </div>
      )}

      <div className={adult.stack}>
        <span className={adult.label} id="sub-method-label">Cómo resta en su colegio</span>
        <p className={adult.hint}>Todas las restas de la app se hacen así. Elige la forma que usa su colegio. Si la respuesta final está bien, siempre vale.</p>
        <div className={m.options} role="radiogroup" aria-labelledby="sub-method-label">
          {SUB_METHODS.map((meth) => (
            <div key={meth.id} className={m.option}>
              <button
                type="button"
                role="radio"
                aria-checked={settings.subMethod === meth.id}
                className={adult.segment}
                onClick={() => void change({ subMethod: meth.id, schoolMethodAsked: true })}
              >
                {meth.label}
              </button>
              <MethodSketch id={meth.id as SketchId} />
            </div>
          ))}
        </div>
      </div>

      <div className={adult.stack}>
        <span className={adult.label} id="div-method-label">Cómo divide en su colegio</span>
        <p className={adult.hint}>Todas las divisiones de la app usan la galera, así. Si el cociente y el resto están bien, siempre vale.</p>
        <div className={m.options} role="radiogroup" aria-labelledby="div-method-label">
          {DIV_METHODS.map((meth) => (
            <div key={meth.id} className={m.option}>
              <button
                type="button"
                role="radio"
                aria-checked={settings.divMethod === meth.id}
                className={adult.segment}
                onClick={() => void change({ divMethod: meth.id })}
              >
                {meth.label}
              </button>
              <MethodSketch id={meth.id as SketchId} />
            </div>
          ))}
        </div>
      </div>

      <div className={adult.stack}>
        <span className={adult.label} id="table-trick-label">Truco para las tablas</span>
        <p className={adult.hint}>Si el truco sirve para la multiplicación, es lo primero que se le recuerda en la pista. Con «La app decide», cada pista usa el truco que mejor va.</p>
        <div className={s.segGroup} role="radiogroup" aria-labelledby="table-trick-label">
          <button
            type="button"
            role="radio"
            aria-checked={settings.tableMethod === null}
            className={adult.segment}
            onClick={() => void change({ tableMethod: null })}
          >
            La app decide
          </button>
          {TABLE_METHODS.map((meth) => (
            <button
              key={meth.id}
              type="button"
              role="radio"
              aria-checked={settings.tableMethod === meth.id}
              className={adult.segment}
              onClick={() => void change({ tableMethod: meth.id })}
            >
              {meth.label}
            </button>
          ))}
        </div>
        <p className={adult.hint} aria-live="polite">{trick ? `${trick.label}: ${trick.summary}` : 'La app elige el truco de cada multiplicación.'}</p>
      </div>

      {error && <p className={adult.error} role="alert">{error}</p>}
    </section>
  )
}
