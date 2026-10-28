/* Route /play/lengua/leer/:id: one reading of Lengua on its own screen (the text, then its questions). A reading that does not
   exist goes back to the child's home. Leaving after the last question returns to the home too. */
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { readingById } from '@/content/lengua/stories'
import { useActiveChild } from '@/data'
import { Spinner } from '@/ui'
import ReadingScreen from './ReadingScreen'

export default function ReadingRoute() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { child, loading } = useActiveChild()
  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  const reading = readingById(id)
  if (!reading) return <Navigate to="/play" replace />
  return <ReadingScreen reading={reading} onDone={() => navigate('/play')} />
}
