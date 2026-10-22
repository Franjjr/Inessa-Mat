/* A "choose" step: the child picks one of a few options (the favourite subtraction method). The pick is shown until
   the child moves on; the lesson player saves it through the host. */
import type { SubMethod } from '@/types'
import { useActivityHost } from '@/activities/host'
import { Button } from '@/ui'
import s from './ChoiceSlot.module.css'

export interface ChoiceSlotProps {
  choices: { label: string; value: SubMethod }[]
  /** The option already picked on this step, if any. */
  picked?: SubMethod
  onPick: (value: SubMethod) => void
}

export default function ChoiceSlot({ choices, picked, onPick }: ChoiceSlotProps) {
  const host = useActivityHost()
  const chosen = choices.find((c) => c.value === picked)
  return (
    <div className={s.wrap}>
      <div className={s.options} role="radiogroup" aria-label={host.t('Tu método favorito')}>
        {choices.map((c) => (
          <Button
            key={c.value}
            role="radio"
            aria-checked={picked === c.value}
            variant={picked === c.value ? 'gold' : 'secondary'}
            onClick={() => onPick(c.value)}
            className={s.option}
          >
            {host.t(c.label)}
          </Button>
        ))}
      </div>
      {chosen && (
        <p className={s.saved} role="status">
          {host.t(`Anotado: tu método favorito es «${chosen.label}».`)}
        </p>
      )}
    </div>
  )
}
