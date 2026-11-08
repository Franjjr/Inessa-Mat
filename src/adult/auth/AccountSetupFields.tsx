/* The part every new account fills in: family or school, its name, and the privacy policy. Shared by the sign-up form and
   by «Completa tu cuenta» (the first time with Google). */
import { Link } from 'react-router-dom'
import type { OrgKind } from '@/types'
import { TextField } from '../shared/Field'
import type { AccountSetupErrors, AccountSetupInput } from './validation'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

const ORG_OPTIONS: { kind: OrgKind; title: string; text: string }[] = [
  { kind: 'family', title: 'Familia', text: 'Para tus hijos. Cada niño tiene su perfil y su aventura.' },
  { kind: 'school', title: 'Colegio', text: 'Para profesores. Clases con código, asignaciones y progreso de la clase.' },
]

export function AccountSetupFields({ idPrefix, value, errors, set }: {
  idPrefix: string
  value: AccountSetupInput
  errors: AccountSetupErrors
  set: <K extends keyof AccountSetupInput>(key: K, v: AccountSetupInput[K]) => void
}) {
  const orgLabel = value.orgKind === 'school' ? 'Nombre del colegio' : 'Nombre de tu familia'
  return (
    <>
      <fieldset className={s.form} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} aria-describedby={errors.orgKind ? `${idPrefix}-org-error` : undefined}>
        <legend className={adult.label} style={{ marginBottom: 8 }}>¿Cómo usarás Repasitos?</legend>
        <div className={s.orgChoices} role="radiogroup" aria-label="Tipo de cuenta">
          {ORG_OPTIONS.map((o) => (
            <button
              key={o.kind}
              type="button"
              role="radio"
              aria-checked={value.orgKind === o.kind}
              className={adult.choiceCard}
              onClick={() => set('orgKind', o.kind)}
            >
              <span className={adult.choiceTitle}>{o.title}</span>
              <span className={adult.muted}>{o.text}</span>
            </button>
          ))}
        </div>
        {errors.orgKind && <p id={`${idPrefix}-org-error`} className={adult.error}>{errors.orgKind}</p>}
      </fieldset>

      {value.orgKind && (
        <TextField
          id={`${idPrefix}-org`} label={orgLabel} value={value.orgName} onChange={(e) => set('orgName', e.target.value)}
          error={errors.orgName} hint={value.orgKind === 'school' ? 'Así lo verán las familias al unirse a una clase.' : 'Solo lo veis los adultos de la familia.'}
        />
      )}

      <label className={s.checkRow}>
        <input
          type="checkbox"
          checked={value.acceptedPrivacy}
          onChange={(e) => set('acceptedPrivacy', e.target.checked)}
          aria-invalid={errors.acceptedPrivacy ? true : undefined}
        />
        <span>
          He leído y acepto la <Link to="/legal/privacidad" target="_blank" rel="noreferrer">política de privacidad</Link>.
          Entiendo que los datos de los menores los gestiono yo como adulto responsable.
        </span>
      </label>
      {errors.acceptedPrivacy && <p className={adult.error}>{errors.acceptedPrivacy}</p>}
    </>
  )
}
