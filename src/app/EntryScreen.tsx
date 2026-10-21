/* Integrator-owned. Decides where a device lands on launch. */
import { Navigate } from 'react-router-dom'
import { useAuth, useChildren } from '@/data'
import { Spinner } from '@/ui'

export default function EntryScreen() {
  const auth = useAuth()
  const children = useChildren()
  if (auth.status === 'loading' || children === undefined) return <Spinner />
  // First launch on a device with a backend configured: offer sign-in / sign-up / try without account.
  if (auth.status === 'anonymous') return <Navigate to="/welcome" replace />
  if (children.length === 0) return <Navigate to="/kids/new" replace />
  return <Navigate to="/kids" replace />
}
