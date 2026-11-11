import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getPersistenceState, requestPersistentStorage } from '../storage'
import { resetAll } from './helpers'

type StorageLike = Partial<{ persist: () => Promise<boolean>; persisted: () => Promise<boolean> }>

function setStorage(value: StorageLike | undefined): void {
  Object.defineProperty(navigator, 'storage', { value, configurable: true })
}

beforeEach(async () => {
  await resetAll()
})

afterEach(() => {
  setStorage(undefined)
})

describe('requestPersistentStorage', () => {
  it('asks the browser and remembers that it was granted', async () => {
    let asked = 0
    setStorage({ persisted: async () => false, persist: async () => { asked++; return true } })
    expect(await requestPersistentStorage()).toBe('granted')
    expect(asked).toBe(1)
    expect(await getPersistenceState()).toBe('granted')
  })

  it('does not ask again when the browser already keeps the data', async () => {
    let asked = 0
    setStorage({ persisted: async () => true, persist: async () => { asked++; return true } })
    expect(await requestPersistentStorage()).toBe('granted')
    expect(asked).toBe(0)
  })

  it('remembers a refusal, so the adult area can explain it', async () => {
    setStorage({ persisted: async () => false, persist: async () => false })
    expect(await requestPersistentStorage()).toBe('denied')
    expect(await getPersistenceState()).toBe('denied')
  })

  it('reports unsupported browsers without failing', async () => {
    setStorage(undefined)
    expect(await requestPersistentStorage()).toBe('unsupported')
    expect(await getPersistenceState()).toBe('unsupported')
  })

  it('never throws when the browser fails', async () => {
    setStorage({ persisted: async () => false, persist: async () => { throw new Error('blocked') } })
    await expect(requestPersistentStorage()).resolves.toBe('unknown')
  })

  it('reads unknown until it has been asked', async () => {
    expect(await getPersistenceState()).toBe('unknown')
  })
})
