/* Route /play/sesion: «Mi sesión de hoy». Leaving (done, pause → salir) returns to the child's home. */
import { useNavigate } from 'react-router-dom'
import DailySession from './DailySession'

export default function DailySessionScreen() {
  const navigate = useNavigate()
  const leave = () => navigate('/play')
  return <DailySession onDone={leave} onExit={leave} />
}
