/* Route /play/sesion («Mi sesión de hoy») and /play/lengua («Mi sesión de Lengua»). Leaving (done, pause → salir) returns to
   the child's home. */
import { useNavigate } from 'react-router-dom'
import type { LessonSubject } from '@/engine'
import DailySession from './DailySession'

export default function DailySessionScreen({ subject = 'math' }: { subject?: LessonSubject }) {
  const navigate = useNavigate()
  const leave = () => navigate('/play')
  return <DailySession subject={subject} onDone={leave} onExit={leave} />
}
