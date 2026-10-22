/* Shop, presentational: the companion on stage, the accessories as cards, and one clear action for the one
   picked. Buying asks first (a Modal, never window.confirm). Children never see prices they cannot reach
   without knowing why: a locked item says which crystal unlocks it. */
import { useState } from 'react'
import { CompanionArt, StarIcon } from '@/art'
import { Button, Modal, Screen, TopBar } from '@/ui'
import type { AccessoryDef, Companion } from '@/types'
import type { AccessoryStatus } from './logic'
import s from './shop.module.css'

export interface ShopItem {
  accessory: AccessoryDef
  status: AccessoryStatus
  /** Why it cannot be bought yet (child-facing). */
  reason?: string
}

export interface ShopViewProps {
  companion: Companion
  /** Stars the child can spend now. */
  stars: number
  items: ShopItem[]
  /** Accessory being previewed on the companion (not saved). */
  previewId: string | null
  /** Equipped list the companion wears in the preview. */
  wearing: string[]
  busy?: boolean
  onPick: (id: string | null) => void
  onBuy: (id: string) => void
  onEquip: (id: string) => void
  onUnequip: (id: string) => void
  companionName: string
}

const SLOT_LABEL: Record<AccessoryDef['slot'], string> = {
  head: 'Cabeza', neck: 'Cuello', face: 'Cara', back: 'Espalda', held: 'En la mano',
}

const STATUS_LABEL: Record<AccessoryStatus, string> = {
  equipped: 'Puesto',
  owned: 'Tuyo',
  buyable: 'A la venta',
  stars: 'Faltan estrellas',
  locked: 'Bloqueado',
  unknown: 'No disponible',
}

export function ShopView({
  companion, stars, items, previewId, wearing, busy = false, onPick, onBuy, onEquip, onUnequip, companionName,
}: ShopViewProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const picked = items.find((i) => i.accessory.id === previewId) ?? null
  const confirm = items.find((i) => i.accessory.id === confirmId) ?? null

  const action = (() => {
    if (!picked) return null
    const { status, accessory } = picked
    if (status === 'equipped') return <Button size="lg" variant="secondary" onClick={() => onUnequip(accessory.id)} disabled={busy}>Quitárselo</Button>
    if (status === 'owned') return <Button size="lg" variant="success" onClick={() => onEquip(accessory.id)} disabled={busy}>Ponérselo</Button>
    if (status === 'buyable') {
      return (
        <Button size="lg" variant="gold" onClick={() => setConfirmId(accessory.id)} disabled={busy}>
          Comprar por {accessory.price} estrellas
        </Button>
      )
    }
    return null
  })()

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <TopBar
        back="/play"
        title="La tienda de accesorios"
        right={
          <span className={s.starCount} aria-label={`Tienes ${stars} estrellas para gastar`}>
            <StarIcon size={34} filled />
            <span className={s.starNumber}>{stars}</span>
          </span>
        }
      />

      <div className={s.layout}>
        <section className={s.stage} aria-label="Así se ve tu compañero">
          <div className={s.stageArt}>
            <CompanionArt
              species={companion.species}
              colorway={companion.colorway}
              equipped={wearing}
              size={260}
              animated
            />
          </div>
          <p className={s.stageName}>{companionName}</p>
          <div className={s.preview} aria-live="polite">
            {picked ? (
              <>
                <p className={s.previewText}>
                  <strong>{picked.accessory.name}</strong>
                  <span className={s.previewStatus}> · {STATUS_LABEL[picked.status]}</span>
                </p>
                {picked.status === 'locked' || picked.status === 'stars' || picked.status === 'unknown' ? (
                  <p className={s.hint}>{picked.reason ?? 'Todavía no se puede comprar'}</p>
                ) : null}
                <div className={s.actions}>{action}</div>
              </>
            ) : (
              <p className={s.hint}>Toca un accesorio para probarlo en {companionName}.</p>
            )}
          </div>
        </section>

        <section className={s.grid} aria-label="Accesorios">
          {items.map((item) => {
            const { accessory, status } = item
            const selected = previewId === accessory.id
            return (
              <button
                key={accessory.id}
                type="button"
                className={`${s.card} ${selected ? s.cardSelected : ''}`}
                aria-pressed={selected}
                onClick={() => onPick(selected ? null : accessory.id)}
                data-status={status}
              >
                <span className={s.cardName}>{accessory.name}</span>
                <span className={s.cardSlot}>{SLOT_LABEL[accessory.slot]}</span>
                <span className={s.cardFoot}>
                  {status === 'owned' || status === 'equipped' ? (
                    <span className={s.badge}>{STATUS_LABEL[status]}</span>
                  ) : status === 'locked' ? (
                    <span className={s.badgeMute}>{STATUS_LABEL.locked}</span>
                  ) : (
                    <span className={s.price}>
                      <StarIcon size={22} filled />
                      {accessory.price}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </section>
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirmId(null)}
        title={confirm ? `¿Comprar ${confirm.accessory.name}?` : undefined}
      >
        {confirm && (
          <div className={s.confirm}>
            <p className={s.confirmText}>
              Te costará {confirm.accessory.price} estrellas. Te quedarán {stars - confirm.accessory.price}.
            </p>
            <div className={s.actions}>
              <Button variant="secondary" onClick={() => setConfirmId(null)}>Ahora no</Button>
              <Button
                variant="gold"
                disabled={busy}
                onClick={() => {
                  const id = confirm.accessory.id
                  setConfirmId(null)
                  onBuy(id)
                }}
              >
                Sí, comprar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
