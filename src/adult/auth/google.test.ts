/* The nonce: Google gets the SHA-256 (hex) of the raw value Supabase gets, and every nonce is new. */
import { describe, expect, it } from 'vitest'
import { makeNonce } from './google'

describe('makeNonce', () => {
  it('hashes the raw value with SHA-256 in hex, and never repeats', async () => {
    const a = await makeNonce()
    const b = await makeNonce()
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a.raw)))
    expect(a.hashed).toBe([...digest].map((x) => x.toString(16).padStart(2, '0')).join(''))
    expect(a.hashed).toMatch(/^[0-9a-f]{64}$/)
    expect(a.raw).not.toBe(b.raw)
    expect(a.raw.length).toBeGreaterThanOrEqual(40)
  })
})
