/* Supabase client. Created only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time; otherwise
   the app runs fully local-only. The SDK is loaded lazily so it stays out of the first-paint bundle. */
import type { SupabaseClient } from '@supabase/supabase-js'

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

/** Storage key of the persisted auth session (localStorage). */
export const AUTH_STORAGE_KEY = 'numeria.auth'

let clientPromise: Promise<SupabaseClient> | null = null
let override: SupabaseClient | null | undefined

/** True when the build has Supabase keys (or a test injected a client). */
export function isBackendAvailable(): boolean {
  if (override !== undefined) return override !== null
  return Boolean(URL_ && KEY)
}

export function getSupabase(): Promise<SupabaseClient | null> {
  if (override !== undefined) return Promise.resolve(override)
  if (!URL_ || !KEY) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
      },
      global: { headers: { 'x-client-info': 'numeria-web' } },
    }),
  )
  return clientPromise
}

/** Tests: inject a (fake) client, `null` to simulate a build without backend, `undefined` to restore. */
export function __setSupabaseForTests(client: SupabaseClient | null | undefined): void {
  override = client
}
