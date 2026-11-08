/* Google Identity Services: the script is loaded only when the sign-in or sign-up screen shows the button, never in the
   children's area. The nonce: Google gets its SHA-256 (hex) inside the token, Supabase gets the raw value and checks both. */

const GIS_SRC = 'https://accounts.google.com/gsi/client'

export interface GoogleCredentialResponse {
  credential?: string
}

interface GoogleId {
  initialize(config: {
    client_id: string
    callback: (r: GoogleCredentialResponse) => void
    nonce?: string
    context?: 'signin' | 'signup' | 'use'
    ux_mode?: 'popup' | 'redirect'
    itp_support?: boolean
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
  cancel(): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } }
  }
}

let loading: Promise<GoogleId> | null = null

/** Loads the Google script once; rejects when it cannot be loaded (blocked or offline). */
export function loadGoogleIdentity(): Promise<GoogleId> {
  const ready = window.google?.accounts?.id
  if (ready) return Promise.resolve(ready)
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('Google Identity Services did not load'))
    }
    script.onerror = () => reject(new Error('Google Identity Services could not be loaded'))
    document.head.appendChild(script)
  }).catch((e: unknown) => {
    loading = null
    throw e
  })
  return loading
}

/** A fresh nonce: `raw` for Supabase, `hashed` (SHA-256, hex) for Google. */
export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const raw = btoa(String.fromCharCode(...bytes))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hashed }
}
