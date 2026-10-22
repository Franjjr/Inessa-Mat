/* Offers to move the profiles created on this device (local-only mode) into the signed-in account. */
import { useState } from 'react'
import type { ChildProfile } from '@/types'
import { useAuth, useChildren } from '@/data'
import { Button, toast } from '@/ui'
import { errorMessage } from './messages'
import s from './adult.module.css'

/** Profiles that exist only on this device; undefined while the list is still loading. */
export function localOnlyChildren(): ChildProfile[] | undefined {
  const all = useChildren()
  return all?.filter((c) => c.orgId === null)
}

export function ClaimLocalPanel({ onDone, onSkip }: { onDone?: () => void; onSkip?: () => void }) {
  const { status, activeOrg, claimLocalData } = useAuth()
  const locals = localOnlyChildren() ?? []
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (status !== 'signed-in' || locals.length === 0) return null

  const names = locals.map((c) => c.nickname)
  const listed = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { children } = await claimLocalData()
      toast(children === 1 ? 'Perfil guardado en tu cuenta' : 'Perfiles guardados en tu cuenta')
      onDone?.()
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar los perfiles ahora. Inténtalo de nuevo cuando tengas conexión.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={s.card} aria-labelledby="claim-title">
      <h2 id="claim-title" className={s.subheading}>
        {locals.length === 1 ? 'Hay un perfil guardado solo en este dispositivo' : 'Hay perfiles guardados solo en este dispositivo'}
      </h2>
      <p className={s.lead}>
        {listed} {locals.length === 1 ? 'se usa' : 'se usan'} sin cuenta. Si lo guardas en tu cuenta{activeOrg ? ` (${activeOrg.name})` : ''},
        sus avances tendrán copia segura y podrás verlos desde cualquier dispositivo.
      </p>
      {error && <p className={s.error} role="alert">{error}</p>}
      <div className={s.actions}>
        <Button onClick={() => void save()} disabled={busy || !activeOrg}>
          {busy ? 'Guardando…' : 'Guardarlos en mi cuenta'}
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={busy}>
            Ahora no
          </Button>
        )}
      </div>
      {!activeOrg && <p className={s.hint}>Primero hay que crear la familia o el colegio en tu cuenta.</p>}
    </section>
  )
}
