/* A "choose" step: the child picks one of a few options. The pick is shown until the child moves on. Only a favourite
   trick of the tables is saved (the lesson player does it through the host): a subtraction or division method picked in a
   lesson is not, so the line says «Has elegido», never «Anotado», for those. */
import { useActivityHost } from '@/activities/host'
import { Button } from '@/ui'
import s from './ChoiceSlot.module.css'

export interface ChoiceSlotProps {
  choices: { label: string; value: string }[]
  /** The option already picked on this step, if any. */
  picked?: string
  onPick: (value: string) => void
  /** The pick is saved as the child's favourite (the tables trick): the line says so. */
  saved?: boolean
}

export default function ChoiceSlot({ choices, picked, onPick, saved = false }: ChoiceSlotProps) {
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
          {host.t(saved ? `Anotado: tu truco favorito es «${chosen.label}».` : `Has elegido «${chosen.label}».`)}
        </p>
      )}
    </div>
  )
}
