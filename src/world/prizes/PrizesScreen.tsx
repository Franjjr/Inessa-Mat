/* Route /play/premios: «Mis premios», the child's prizes in one place. The album, the shop and the Gran Cofre (once all
   the crystals are won) are always here; the diploma only once it is earned. */
import { Navigate, useNavigate } from 'react-router-dom'
import { ChestArt } from '@/art'
import { crystalsOf, seasonOf } from '@/content'
import { useActiveChild, useProgress } from '@/data'
import { Screen, Spinner, TopBar } from '@/ui'
import { Tile } from '@/world/home/Tile'
import s from './PrizesScreen.module.css'

export default function PrizesScreen() {
  const navigate = useNavigate()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!progress) return <Spinner />

  const season = seasonOf(progress)
  const allCrystals = crystalsOf(progress).filter(Boolean).length === season.worlds.length

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <TopBar back="/play" title="Mis premios" />
      <div className={s.grid}>
        <Tile label="Álbum" hint="Tus pegatinas" tone="yellow" onClick={() => navigate('/play/album')} />
        <Tile label="Tienda" hint="Ropa para tu compañero" tone="green" onClick={() => navigate('/play/shop')} />
        {allCrystals && (
          <Tile label="Gran Cofre" hint="¡Ábrelo!" tone="yellow" onClick={() => navigate('/play/chest')}>
            <ChestArt open={!!progress.chestOpened} size={56} />
          </Tile>
        )}
        {progress.diplomaEarnedAt && (
          <Tile label="Diploma" hint="Tu gran premio" tone="violet" onClick={() => navigate('/play/diploma')} />
        )}
      </div>
    </Screen>
  )
}
