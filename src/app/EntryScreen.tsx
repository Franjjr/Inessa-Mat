/* Integrator-owned. Decides where a device lands on launch. */
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, useChildren, useSyncStatus } from '@/data'
import { Spinner } from '@/ui'

/** How long a new device waits for the account's children before offering to create one. */
export const FIRST_PULL_WAIT_MS = 15_000

export default function EntryScreen() {
  const auth = useAuth()
  const children = useChildren()
  const sync = useSyncStatus()
  // A device that has never synced: the account's children are still on their way from the cloud. Deciding now would
  // send the adult to create a child that already exists (and the progress made on the other device would be lost).
  const firstPull = auth.status === 'signed-in' && children?.length === 0 && sync.lastSyncedAt === null
    && (sync.state === 'syncing' || sync.state === 'idle')
  const [waitedOut, setWaitedOut] = useState(false)
  useEffect(() => {
    if (!firstPull) return
    const t = setTimeout(() => setWaitedOut(true), FIRST_PULL_WAIT_MS)
    return () => clearTimeout(t)
  }, [firstPull])

  if (auth.status === 'loading' || children === undefined) return <Spinner />
  // First launch on a device with a backend configured: offer sign-in / sign-up / try without account.
  if (auth.status === 'anonymous') return <Navigate to="/welcome" replace />
  if (firstPull && !waitedOut) return <Spinner label="Buscando los perfiles de tu cuenta…" />
  if (children.length === 0) return <Navigate to="/kids/new" replace />
  return <Navigate to="/kids" replace />
}
