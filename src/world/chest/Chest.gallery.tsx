import type { GalleryEntry } from '@/dev/Gallery'
import { progressWithCrystals } from '@/world/rewards/testing'
import { chestState } from './logic'
import { ChestView } from './ChestView'

const locked = chestState(progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5']))
const open = chestState(progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8']))

const gallery: GalleryEntry[] = [
  {
    title: 'ChestView · cerrado (5 de 8)',
    width: 1180,
    height: 820,
    render: () => (
      <ChestView
        state={locked}
        reward={null}
        lockedText="El Gran Cofre necesita las 8 letras de la palabra secreta."
        openText=""
        childName="Inessa"
        diplomaReady={false}
      />
    ),
  },
  {
    title: 'ChestView · abierto (iPad)',
    width: 1180,
    height: 820,
    render: () => (
      <ChestView
        state={open}
        reward={{ title: 'Una tarde de cine contigo', description: 'Elegimos la peli juntas.', claimed: false }}
        lockedText=""
        openText="¡El Gran Cofre se ha abierto! Dentro hay una sorpresa solo para ti."
        childName="Inessa"
        diplomaReady
        onDiploma={() => {}}
      />
    ),
  },
]

export default gallery
