/* Route /play/album: the child's sticker album, built from the progress (no writes). */
import { useActiveChild, useProgress } from '@/data'
import { Spinner } from '@/ui'
import { AlbumView } from './AlbumView'
import { albumPages, albumTotals } from './logic'

export default function AlbumScreen() {
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  if (!child || !progress) return <Spinner label="Abriendo el álbum…" />
  const pages = albumPages(progress, child)
  const totals = albumTotals(pages)
  return <AlbumView pages={pages} owned={totals.owned} total={totals.total} />
}
