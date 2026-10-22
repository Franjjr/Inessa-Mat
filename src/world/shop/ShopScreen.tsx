/* Route /play/shop: spend stars on accessories for the companion. Purchases update the progress (stars spent,
   accessories owned) and equipping updates the child's companion; both persist through @/data. */
import { useState } from 'react'
import { accessories, buyAccessory, canBuyAccessory, spendableStars } from '@/content'
import { useActiveChild, updateChild, updateProgress, useProgress } from '@/data'
import { Spinner, toast } from '@/ui'
import { childText } from '@/world/rewards/childText'
import type { ProgressState } from '@/types'
import { ShopView, type ShopItem } from './ShopView'
import { accessoryStatus, equipAccessory, lockedReason, previewEquipped, unequipAccessory } from './logic'

export default function ShopScreen() {
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!child || !progress) return <Spinner label="Abriendo la tienda…" />

  const companion = child.companion
  const items: ShopItem[] = accessories.map((a) => {
    const status = accessoryStatus(progress, companion, a.id)
    return { accessory: a, status, reason: status === 'locked' ? lockedReason(a) : status === 'stars' ? 'Te faltan estrellas para este' : undefined }
  })

  const saveEquipped = async (next: string[]) => {
    setBusy(true)
    try {
      await updateChild(child.id, { companion: { ...companion, equipped: next } })
    } catch {
      toast('No hemos podido guardarlo. Prueba otra vez.')
    } finally {
      setBusy(false)
    }
  }

  const buy = async (id: string) => {
    const check = canBuyAccessory(progress, id)
    if (!check.ok) {
      toast(check.reason === 'stars' ? 'Te faltan estrellas para este accesorio.' : 'Todavía no se puede comprar.')
      return
    }
    setBusy(true)
    try {
      const next: ProgressState = await updateProgress(child.id, (p) => buyAccessory(p, id))
      if (next.accessoriesOwned.includes(id)) {
        toast(childText(child, '¡Es tuyo! Ya puedes ponérselo a {pet}.'))
        setPreviewId(id)
      } else {
        toast('No hemos podido comprarlo. Prueba otra vez.')
      }
    } catch {
      toast('No hemos podido comprarlo. Prueba otra vez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ShopView
      companion={companion}
      companionName={childText(child, '{pet}')}
      stars={spendableStars(progress)}
      items={items}
      previewId={previewId}
      wearing={previewEquipped(companion, previewId)}
      busy={busy}
      onPick={setPreviewId}
      onBuy={buy}
      onEquip={(id) => void saveEquipped(equipAccessory(companion.equipped, id))}
      onUnequip={(id) => void saveEquipped(unequipAccessory(companion.equipped, id))}
    />
  )
}
