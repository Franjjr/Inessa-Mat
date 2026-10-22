/* What happens once an adult is signed in: offer to save this device's profiles, then go on to `next`. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/data'
import { ClaimLocalPanel, localOnlyChildren } from '../shared/ClaimLocalPanel'
import s from './auth.module.css'

export function AfterSignIn({ next }: { next: string }) {
  const navigate = useNavigate()
  const { status } = useAuth()
  const locals = localOnlyChildren()
  const left = useRef(false)

  const go = () => {
    if (left.current) return
    left.current = true
    navigate(next, { replace: true })
  }

  useEffect(() => {
    // Wait until the local list has loaded; only skip the step when there is nothing to claim.
    if (status !== 'signed-in' || locals === undefined || locals.length > 0) return
    go()
  }, [status, locals])

  if (status !== 'signed-in' || !locals?.length) {
    return (
      <p className={s.muted} role="status">Un momento, te llevamos a tu zona de familia…</p>
    )
  }
  return (
    <div className={s.afterPanel}>
      <ClaimLocalPanel onDone={go} onSkip={go} />
    </div>
  )
}
