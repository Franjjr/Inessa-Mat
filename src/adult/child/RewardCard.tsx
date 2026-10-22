/* The real-world prize behind the Gran Cofre. The adult writes it; the child only sees a chest. */
import { useEffect, useState } from 'react'
import { getRewards, markRewardClaimed, setChestReward } from '@/data'
import type { Reward } from '@/types'
import { Button, toast } from '@/ui'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { formatDate } from '../shared/format'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function RewardCard({ childId, childName }: { childId: string; childName: string }) {
  const [reward, setReward] = useState<Reward | null | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const rewards = await getRewards(childId)
    const chest = rewards.find((r) => r.kind === 'chest') ?? null
    setReward(chest)
    setTitle(chest?.title ?? '')
    setDescription(chest?.description ?? '')
  }

  useEffect(() => {
    let alive = true
    getRewards(childId)
      .then((rewards) => {
        if (!alive) return
        const chest = rewards.find((r) => r.kind === 'chest') ?? null
        setReward(chest)
        setTitle(chest?.title ?? '')
        setDescription(chest?.description ?? '')
      })
      .catch((e: unknown) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [childId])

  const save = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Escribe cuál será el premio, por ejemplo «Una tarde de cine contigo».')
      return
    }
    setBusy(true)
    try {
      await setChestReward(childId, title, description || undefined)
      await load()
      setEditing(false)
      toast('Premio guardado')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const delivered = async () => {
    if (!reward) return
    setBusy(true)
    try {
      await markRewardClaimed(reward.id)
      await load()
      toast('Premio marcado como entregado')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const showForm = editing || !reward

  return (
    <section className={adult.card} aria-labelledby="reward-title">
      <div className={s.heatWrap}>
        <div className={adult.cardHead}>
          <h2 id="reward-title" className={adult.subheading}>Premio del Gran Cofre</h2>
          {reward && !showForm && <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Cambiar</Button>}
        </div>
        <p className={adult.muted}>
          Al final de su aventura, {childName} abre el Gran Cofre y encuentra este premio real. Lo prepara la persona adulta.
        </p>
      </div>

      {reward === undefined && <p className={adult.muted} role="status">Cargando…</p>}

      {reward && !showForm && (
        <div className={adult.stack}>
          <p className={adult.lead}><span className={adult.strong}>{reward.title}</span></p>
          {reward.description && <p className={adult.muted}>{reward.description}</p>}
          <p className={adult.muted}>
            {reward.claimedAt
              ? `Entregado el ${formatDate(reward.claimedAt)}.`
              : reward.unlockedAt
                ? `Desbloqueado el ${formatDate(reward.unlockedAt)}. Cuando se lo des, márcalo como entregado.`
                : 'Se desbloquea cuando consigue los ocho cristales mágicos.'}
          </p>
          {reward.unlockedAt && !reward.claimedAt && (
            <div className={adult.actions}>
              <Button variant="gold" onClick={() => void delivered()} disabled={busy}>Marcar como entregado</Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form
          className={adult.stack}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <TextField
            id="reward-title-input"
            label="¿Qué premio será?"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            hint="Algo que podáis hacer juntos o un regalo. Ej.: «Una tarde de cine contigo»."
          />
          <div className={adult.field}>
            <label htmlFor="reward-desc" className={adult.label}>Detalles (opcional)</label>
            <textarea
              id="reward-desc"
              className={`${adult.input} ${s.textarea}`}
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={adult.actions}>
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar premio'}</Button>
            {reward && <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancelar</Button>}
          </div>
        </form>
      )}
      {error && <p className={adult.error} role="alert">{error}</p>}
    </section>
  )
}
