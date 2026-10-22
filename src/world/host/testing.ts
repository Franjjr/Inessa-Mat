/* Test-only helpers for world screens. The app mounts AuthProvider; tests have no provider, so the auth snapshot is
   set to the local-only state (no account) that a device without backend uses. */
import { setAuth } from '@/data/store'
import { flushTimers } from '@/data/__tests__/helpers'

export function useLocalOnlyAuth(): void {
  setAuth({ status: 'local-only' })
}

export { flushTimers }
