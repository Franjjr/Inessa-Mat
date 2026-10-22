/* Route /play/review: the daily review as a page. Leaving (done or exit) returns to the child's home. */
import { useNavigate } from 'react-router-dom'
import DailyReview from './DailyReview'

export default function DailyReviewScreen() {
  const navigate = useNavigate()
  const leave = () => navigate('/play')
  return <DailyReview onDone={leave} onExit={leave} />
}
