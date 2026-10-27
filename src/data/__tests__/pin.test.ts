import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasAdultPin, setAdultPin, verifyAdultPin, clearAdultPin, readAdultGateLock, writeAdultGateLock, DataError } from '@/data'
import { signInWithPassword } from '../account'
import { wipeLocalDatabase } from '../db'
import { toDataError } from '../errors'
import { META, getMeta, setMeta } from '../meta'
import { sha256, sha256Sync, toBase64, toHex } from '../sha256'
import { resetAuthStore } from '../store'
import { FakeSupabase } from './fakeSupabase'
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

  it('uses PBKDF2-SHA256 with 600 000 iterations (format v2)', async () => {
    await setAdultPin('2468')
    const rec = await getMeta<{ v: number; kdf: string; iterations: number }>(META.adultPin)
    expect(rec).toMatchObject({ v: 2, kdf: 'pbkdf2-sha256', iterations: 600_000 })
  })

  it('without crypto.subtle (plain-http LAN dev) it refuses to store a new PIN', async () => {
    vi.spyOn(globalThis.crypto, 'subtle', 'get').mockReturnValue(undefined as unknown as SubtleCrypto)
    await expect(setAdultPin('9876')).rejects.toThrow('HTTPS')
    vi.restoreAllMocks()
    expect(await hasAdultPin()).toBe(false)
  })

  it('verifies a legacy v1 PIN and rewrites it as v2 on the first correct entry', async () => {
    const salt = new Uint8Array(16).fill(7)
    let block = new Uint8Array([...salt, ...enc('4321')])
    for (let i = 0; i < 1024; i++) {
      const d = sha256Sync(block)
      block = new Uint8Array(d.length + salt.length)
      block.set(d)
      block.set(salt, d.length)
    }
    await setMeta(META.adultPin, { v: 1, salt: toBase64(salt), hash: toHex(block.subarray(0, 32)), iterations: 1024, createdAt: '2026-01-01T00:00:00.000Z' })

    expect(await verifyAdultPin('4322')).toBe(false)
    expect(await getMeta<{ v: number }>(META.adultPin)).toMatchObject({ v: 1 }) // a wrong PIN does not rewrite it
    expect(await verifyAdultPin('4321')).toBe(true)
    expect(await getMeta<{ v: number }>(META.adultPin)).toMatchObject({ v: 2 })
    expect(await verifyAdultPin('4321')).toBe(true)
    expect(await verifyAdultPin('4322')).toBe(false)
  })

  it('keeps the gate lock in IndexedDB as well', async () => {
    expect(await readAdultGateLock()).toBeNull()
    await writeAdultGateLock({ failures: 3, lockedUntil: 0 })
    expect(await readAdultGateLock()).toEqual({ failures: 3, lockedUntil: 0 })
    await writeAdultGateLock({ failures: 0, lockedUntil: 0 })
    expect(await readAdultGateLock()).toBeNull()
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

describe('adult PIN on the account', () => {
  const EMAIL = 'ines@test.numeria'
  const PASSWORD = 'clave-larga-123'
  let fake: FakeSupabase

  /** Another browser/device of the same account: empty local database, signed in again. */
  async function freshDevice(): Promise<void> {
    await wipeLocalDatabase()
    resetAuthStore()
    await signInWithPassword(EMAIL, PASSWORD)
  }

  const accountRecord = () => fake.auth.users[0].user_metadata.adult_pin as { createdAt: string; hash: string; salt: string } | undefined

  beforeEach(async () => {
    fake = new FakeSupabase()
    fake.auth.addUser(EMAIL, PASSWORD, { display_name: 'Ines' })
    await resetAll(fake)
    await signInWithPassword(EMAIL, PASSWORD)
  })

  it('a PIN created on a signed-in device is found and verifies on a fresh device of the same account', async () => {
    await setAdultPin('2468')
    expect(JSON.stringify(accountRecord())).not.toContain('2468')
    expect(accountRecord()).toMatchObject({ v: 2, kdf: 'pbkdf2-sha256' })

    await freshDevice()
    expect(await hasAdultPin()).toBe(true)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin('1357')).toBe(false)
    expect(await getMeta(META.adultPin)).toMatchObject({ v: 2 }) // copied to this device
  })

  it('without an account the PIN stays on the device', async () => {
    resetAuthStore({ status: 'local-only' })
    await setAdultPin('2468')
    expect(accountRecord()).toBeUndefined()

    await wipeLocalDatabase()
    expect(await hasAdultPin()).toBe(false)
  })

  it('keeps the local PIN when the server is unreachable, and pushes it on the next sign-in', async () => {
    fake.auth.unreachable = true
    await expect(setAdultPin('2468')).resolves.toBeUndefined()
    expect(await hasAdultPin()).toBe(true)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(accountRecord()).toBeUndefined()

    fake.auth.unreachable = false
    await signInWithPassword(EMAIL, PASSWORD)
    expect(accountRecord()).toMatchObject({ v: 2 })
    await freshDevice()
    expect(await verifyAdultPin('2468')).toBe(true)
  })

  it('changing the PIN updates the account', async () => {
    await setAdultPin('2468')
    await setAdultPin('1357')
    await freshDevice()
    expect(await verifyAdultPin('2468')).toBe(false)
    expect(await verifyAdultPin('1357')).toBe(true)
  })

  it('clearing the PIN clears it on the account too', async () => {
    await setAdultPin('2468')
    await clearAdultPin()
    expect(accountRecord()).toBeFalsy()
    await freshDevice()
    expect(await hasAdultPin()).toBe(false)
  })

  it('when the device and the account disagree, the newer record wins', async () => {
    await setAdultPin('2468')
    fake.auth.users[0].user_metadata.adult_pin = { ...accountRecord()!, createdAt: '2026-02-01T00:00:00.000Z' }

    // This device has an older PIN (made while the server was unreachable): the account's record wins.
    await wipeLocalDatabase()
    resetAuthStore()
    fake.auth.unreachable = true
    await signInWithPassword(EMAIL, PASSWORD)
    await setAdultPin('1111')
    await setMeta(META.adultPin, { ...(await getMeta<object>(META.adultPin)), createdAt: '2026-01-01T00:00:00.000Z' })
    fake.auth.unreachable = false
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin('1111')).toBe(false)

    // This device has a newer PIN: it wins and goes to the account.
    await setAdultPin('3579')
    fake.auth.users[0].user_metadata.adult_pin = { ...accountRecord()!, createdAt: '2026-01-01T00:00:00.000Z' }
    expect(await verifyAdultPin('3579')).toBe(true)
    expect(accountRecord()).toMatchObject({ createdAt: expect.any(String) })
    await freshDevice()
    expect(await verifyAdultPin('3579')).toBe(true)
  })
})
