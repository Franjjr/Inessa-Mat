import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasAdultPin, setAdultPin, verifyAdultPin, clearAdultPin, readAdultGateLock, writeAdultGateLock, DataError } from '@/data'
import { signInWithPassword } from '../account'
import { wipeLocalDatabase } from '../db'
import { toDataError } from '../errors'
import { META, getMeta, setMeta } from '../meta'
import { sha256, sha256Sync, toBase64, toHex } from '../sha256'
import { getAuth, resetAuthStore } from '../store'
import { __setAccountTimeoutForTests } from '../pin'
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
  const OTHER = 'jose@test.numeria'
  const OLD = '2026-01-01T00:00:00.000Z'
  let fake: FakeSupabase

  /** Another browser/device of the same account: empty local database, signed in again. */
  async function freshDevice(email = EMAIL): Promise<void> {
    await wipeLocalDatabase()
    resetAuthStore()
    await signInWithPassword(email, PASSWORD)
  }

  /** The account's copy for user `i` (0 = Inés): a PIN record, a tombstone, or undefined. */
  const accountValue = (i = 0) => fake.auth.users[i].user_metadata.adult_pin as Record<string, unknown> | undefined
  const accountHash = (i = 0) => (accountValue(i) as { hash?: string } | undefined)?.hash
  const localPin = () => getMeta<{ hash: string; createdAt: string; ownerId?: string }>(META.adultPin)
  const ownerId = () => fake.auth.users[0].id

  beforeEach(async () => {
    fake = new FakeSupabase()
    fake.auth.addUser(EMAIL, PASSWORD, { display_name: 'Ines' })
    await resetAll(fake)
    await signInWithPassword(EMAIL, PASSWORD)
  })

  afterEach(() => {
    __setAccountTimeoutForTests(null)
    fake.auth.getUserDelayMs = 0
  })

  it('a PIN created on a signed-in device is found and verifies on a fresh device of the same account', async () => {
    await setAdultPin('2468')
    expect(JSON.stringify(accountValue())).not.toContain('2468')
    expect(accountValue()).toMatchObject({ v: 2, kdf: 'pbkdf2-sha256' })
    expect(accountValue()).not.toHaveProperty('ownerId')

    await freshDevice()
    expect(await hasAdultPin()).toBe(true)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin('1357')).toBe(false)
    expect(await getMeta(META.adultPin)).toMatchObject({ v: 2, ownerId: ownerId() }) // copied to this device
  })

  it('without an account the PIN stays on the device', async () => {
    resetAuthStore({ status: 'local-only' })
    await setAdultPin('2468')
    expect(accountValue()).toBeUndefined()

    await wipeLocalDatabase()
    expect(await hasAdultPin()).toBe(false)
  })

  it('keeps the local PIN when the server is unreachable, and pushes it on the next sign-in', async () => {
    fake.auth.unreachable = true
    await expect(setAdultPin('2468')).resolves.toBeUndefined()
    expect(await hasAdultPin()).toBe(true)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(accountValue()).toBeUndefined()

    fake.auth.unreachable = false
    await signInWithPassword(EMAIL, PASSWORD)
    expect(accountValue()).toMatchObject({ v: 2 })
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

  it('clearing the PIN leaves a tombstone on the account', async () => {
    await setAdultPin('2468')
    await clearAdultPin()
    expect(accountValue()).toMatchObject({ cleared: true })
    await freshDevice()
    expect(await hasAdultPin()).toBe(false)
  })

  it('a newer local PIN with a different hash replaces the account record', async () => {
    await setAdultPin('2468')
    fake.auth.users[0].user_metadata.adult_pin = { ...accountValue(), createdAt: OLD }

    fake.auth.unreachable = true
    await setAdultPin('1357')
    fake.auth.unreachable = false
    expect(await verifyAdultPin('1357')).toBe(true)
    expect(accountHash()).toBe((await localPin())!.hash)
    expect(await verifyAdultPin('2468')).toBe(false)
  })

  it('when the dates tie, the account record wins', async () => {
    await setAdultPin('2468')
    const acct = accountValue()!
    fake.auth.unreachable = true
    await setAdultPin('1357')
    fake.auth.unreachable = false
    await setMeta(META.adultPin, { ...(await localPin()), createdAt: acct.createdAt })
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin('1357')).toBe(false)
  })

  it('when a date cannot be read, the account record wins', async () => {
    await setAdultPin('2468')
    fake.auth.users[0].user_metadata.adult_pin = { ...accountValue(), createdAt: 'no es una fecha' }
    fake.auth.unreachable = true
    await setAdultPin('1357')
    fake.auth.unreachable = false
    expect(await verifyAdultPin('2468')).toBe(true)
  })

  it('a PIN made under one account is never sent to another, and the second account is left as it was', async () => {
    fake.auth.addUser(OTHER, PASSWORD, { display_name: 'Jose' })
    await setAdultPin('2468') // Inés's device record, owned by Inés
    await signInWithPassword(OTHER, PASSWORD) // Jose's account is empty
    expect(accountValue(1)).toBeUndefined()
    expect(await verifyAdultPin('2468')).toBe(true) // device-only record stays
    expect(accountValue(1)).toBeUndefined()
    expect(accountHash(0)).toBe((await localPin())!.hash)
  })

  it('a PIN set while signed out is never sent to an account; signing in adopts that account PIN if it has one', async () => {
    fake.auth.addUser(OTHER, PASSWORD, { display_name: 'Jose' })
    resetAuthStore({ status: 'local-only' })
    await setAdultPin('9999') // made while signed out: no owner
    expect(await getMeta(META.adultPin)).not.toHaveProperty('ownerId')

    await signInWithPassword(OTHER, PASSWORD) // empty account: nothing is pushed
    expect(accountValue(1)).toBeUndefined()
    expect(await verifyAdultPin('9999')).toBe(true)

    await setAdultPin('2468') // Jose's own PIN, owned by Jose
    await signInWithPassword(EMAIL, PASSWORD) // Inés's account has a PIN: adopted
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(await verifyAdultPin('9999')).toBe(false)
  })

  it('an offline clear is sent on the next sign-in, and a stale device cannot bring the old PIN back', async () => {
    await setAdultPin('2468')
    const stale = { ...(await localPin()), createdAt: OLD }
    await setMeta(META.adultPin, stale)
    fake.auth.users[0].user_metadata.adult_pin = { ...accountValue(), createdAt: OLD }

    fake.auth.unreachable = true
    await clearAdultPin()
    expect(await hasAdultPin()).toBe(false)
    fake.auth.unreachable = false

    await signInWithPassword(EMAIL, PASSWORD)
    expect(accountValue()).toMatchObject({ cleared: true })

    await setMeta(META.adultPin, stale) // the old copy comes back on a stale device
    expect(await hasAdultPin()).toBe(false)
    expect(await getMeta(META.adultPin)).toBeUndefined()
  })

  it('an abandoned forgot-PIN setup does not restore the old PIN on another device', async () => {
    await setAdultPin('2468')
    const stale = { ...(await localPin()), createdAt: OLD }
    fake.auth.users[0].user_metadata.adult_pin = { ...accountValue(), createdAt: OLD }

    await clearAdultPin() // the adult forgot the PIN; the new one is never typed
    expect(accountValue()).toMatchObject({ cleared: true })

    await setMeta(META.adultPin, stale)
    expect(await hasAdultPin()).toBe(false)
    expect(accountValue()).toMatchObject({ cleared: true })
  })

  it('a failing account read does not blank the signed-in account', async () => {
    fake.auth.getUser = async () => {
      throw new Error('boom')
    }
    await signInWithPassword(EMAIL, PASSWORD)
    expect(getAuth()).toMatchObject({ status: 'signed-in', offline: false })
    expect(getAuth().profile).not.toBeNull()
  })

  it('a slow account read falls back to this device after the timeout', async () => {
    await setAdultPin('2468')
    __setAccountTimeoutForTests(30)
    fake.auth.getUserDelayMs = 400
    const started = Date.now()
    expect(await hasAdultPin()).toBe(true)
    expect(await verifyAdultPin('2468')).toBe(true)
    expect(Date.now() - started).toBeLessThan(300)
  })
})
