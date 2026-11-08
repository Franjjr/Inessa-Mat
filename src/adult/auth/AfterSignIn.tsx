/* What happens once an adult is signed in: complete the account if it has no family or school yet (the first time with
   Google), offer to save this device's profiles, then go on to `next`. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/data'
import { ClaimLocalPanel, localOnlyChildren } from '../shared/ClaimLocalPanel'
import { CompleteAccountPanel, useNeedsAccountSetup } from './CompleteAccountPanel'
import s from './auth.module.css'

export function AfterSignIn({ next }: { next: string }) {
  const navigate = useNavigate()
  const { status } = useAuth()
  const locals = localOnlyChildren()
  const left = useRef(false)
  const needsSetup = useNeedsAccountSetup()

  const go = () => {
    if (left.current) return
    left.current = true
    navigate(next, { replace: true })
  }

  useEffect(() => {
    // Wait until the local list has loaded; only skip the step when there is nothing to claim.
    if (status !== 'signed-in' || needsSetup || locals === undefined || locals.length > 0) return
    go()
  }, [status, needsSetup, locals])

  if (needsSetup) return <CompleteAccountPanel />
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
