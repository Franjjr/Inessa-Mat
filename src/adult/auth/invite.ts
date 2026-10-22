/* Accepts an invitation token once the adult is signed in (the invited e-mail must match the account). */
import { useEffect, useRef, useState } from 'react'
import { acceptInvite } from '@/data'
import { errorMessage } from '../shared/messages'

export type InviteState = { status: 'none' | 'working' | 'done' | 'error'; error: string | null }

export function useInviteAcceptance(token: string | null, signedIn: boolean): InviteState {
  const [state, setState] = useState<InviteState>({ status: token ? 'working' : 'none', error: null })
  const started = useRef(false)

  useEffect(() => {
    if (!token || !signedIn || started.current) return
    started.current = true
    setState({ status: 'working', error: null })
    acceptInvite(token)
      .then(() => setState({ status: 'done', error: null }))
      .catch((e: unknown) => setState({ status: 'error', error: errorMessage(e, 'No hemos podido aceptar la invitación. Pide a quien te la envió que la vuelva a crear.') }))
  }, [token, signedIn])

  if (!token) return { status: 'none', error: null }
  return state
}
