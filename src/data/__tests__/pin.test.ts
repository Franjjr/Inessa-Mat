import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasAdultPin, setAdultPin, verifyAdultPin, clearAdultPin, DataError } from '@/data'
import { toDataError } from '../errors'
import { META, getMeta } from '../meta'
import { sha256, sha256Sync, toHex } from '../sha256'
import { resetAll } from './helpers'

beforeEach(async () => {
  await resetAll()
})

const enc = (s: string) => new TextEncoder().encode(s)

describe('sha256', () => {
  it('pure-JS fallback matches the FIPS test vectors', () => {
    expect(toHex(sha256Sync(enc('')))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(toHex(sha256Sync(enc('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(toHex(sha256Sync(enc('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')))).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1')
    expect(toHex(sha256Sync(new Uint8Array(1_000).fill(0x61)))).toBe('41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3')
  })

  it('crypto.subtle and the fallback agree', async () => {
    for (const s of ['', 'abc', 'Numeria 6×7=42', 'x'.repeat(200)]) {
      expect(toHex(await sha256(enc(s)))).toBe(toHex(sha256Sync(enc(s))))
    }
  })
})

describe('adult PIN', () => {
  it('stores only a salted hash and verifies it', async () => {
    expect(await hasAdultPin()).toBe(false)
    expect(await verifyAdultPin('1234')).toBe(false) // no PIN yet
    await setAdultPin('2468')
    expect(await hasAdultPin()).toBe(true)
    const rec = await getMeta<{ salt: string; hash: string }>(META.adultPin)
    expect(JSON.stringify(rec)).not.toContain('2468')
    expect(rec?.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin(' 2468 ')).toBe(true)
    expect(await verifyAdultPin('2469')).toBe(false)
    expect(await verifyAdultPin('')).toBe(false)
  })

  it('uses a fresh salt each time', async () => {
    await setAdultPin('1111')
    const a = await getMeta<{ salt: string; hash: string }>(META.adultPin)
    await setAdultPin('1111')
    const b = await getMeta<{ salt: string; hash: string }>(META.adultPin)
    expect(a?.salt).not.toBe(b?.salt)
    expect(a?.hash).not.toBe(b?.hash)
  })

  it('works without crypto.subtle (plain-http LAN dev on an iPad)', async () => {
    vi.spyOn(globalThis.crypto, 'subtle', 'get').mockReturnValue(undefined as unknown as SubtleCrypto)
    await setAdultPin('9876')
    expect(await verifyAdultPin('9876')).toBe(true)
    vi.restoreAllMocks()
    expect(await verifyAdultPin('9876')).toBe(true) // same hash with subtle
  })

  it('validates the PIN format and can be cleared', async () => {
    await expect(setAdultPin('12')).rejects.toBeInstanceOf(DataError)
    await expect(setAdultPin('abcd')).rejects.toThrow('entre 4 y 8 números')
    await setAdultPin('12345678')
    await clearAdultPin()
    expect(await hasAdultPin()).toBe(false)
  })
})

describe('error mapping', () => {
  it('turns Supabase/Postgres errors into Spanish DataErrors', () => {
    expect(toDataError({ message: 'Invalid login credentials', status: 400 }).code).toBe('invalid-credentials')
    expect(toDataError({ code: 'email_not_confirmed', message: 'Email not confirmed' }).message).toContain('confirmado')
    expect(toDataError({ code: '42501', message: 'new row violates row-level security policy' }).code).toBe('permission')
    expect(toDataError({ message: 'TypeError: Failed to fetch', code: '' }).code).toBe('offline')
    expect(toDataError({ code: 'over_email_send_rate_limit', status: 429, message: 'x' }).code).toBe('rate-limited')
    expect(toDataError({ code: '23514', message: 'check' }).code).toBe('invalid')
    expect(toDataError(new Error('boom')).code).toBe('unknown')
  })
})
