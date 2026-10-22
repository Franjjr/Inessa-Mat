import { describe, expect, it, vi } from 'vitest'
import { LearningStore } from './context'

vi.mock('@/data', () => ({ addInkSample: vi.fn(async () => {}) }))

describe('LearningStore · doubts (low-confidence digits)', () => {
  it('a low-confidence digit is in doubt until the child confirms or rewrites it', () => {
    const store = new LearningStore()
    expect(store.uncertain()).toBe(0)
    store.doubt('cell-1', 7)
    expect(store.uncertain()).toBe(1)
    expect(store.uncertainDigits()).toEqual([7])
    store.settle('cell-1')
    expect(store.uncertain()).toBe(0)
  })

  it('requestConfirm holds the answer and opens the prompt only while a digit is in doubt', () => {
    const store = new LearningStore()
    expect(store.requestConfirm()).toBe(false)
    expect(store.isPromptOpen()).toBe(false)
    store.doubt('cell-1', 7)
    expect(store.requestConfirm()).toBe(true)
    expect(store.isPromptOpen()).toBe(true)
    store.confirmDoubts()
    expect(store.uncertain()).toBe(0)
    expect(store.isPromptOpen()).toBe(false)
    expect(store.requestConfirm()).toBe(false)
  })

  it('forgetting a cell or a whole pad removes its doubts', () => {
    const store = new LearningStore()
    store.doubt('pad:a', 3)
    store.doubt('pad:b', 5)
    store.doubt('other', 9)
    store.forget('other')
    expect(store.uncertain()).toBe(2)
    store.forgetPrefix('pad:')
    expect(store.uncertain()).toBe(0)
  })

  it('dismissing the prompt keeps the doubt (the child still has to rewrite or confirm it)', () => {
    const store = new LearningStore()
    store.doubt('cell-1', 7)
    store.requestConfirm()
    store.dismissPrompt()
    expect(store.isPromptOpen()).toBe(false)
    expect(store.uncertain()).toBe(1)
    expect(store.requestConfirm()).toBe(true)
  })

  it('notifies subscribers on every change', () => {
    const store = new LearningStore()
    const listener = vi.fn()
    const off = store.subscribe(listener)
    const v0 = store.version
    store.doubt('cell-1', 7)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.version).toBeGreaterThan(v0)
    off()
    store.settle('cell-1')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
