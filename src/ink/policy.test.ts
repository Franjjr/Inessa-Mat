import { PEN_SEEN_KEY } from './constants'
import { forgetPenSeen, isEraserPointer, isPalmPress, msSincePenContact, notePenContact, PALM_GUARD_MS, persistPenSeen, pointerRole, readPenSeen, resolveInputMode } from './policy'

describe('palm rejection (pointerRole)', () => {
  it('lets fingers write until a pen has been seen', () => {
    expect(pointerRole('touch', { penSeen: false, mode: 'touch' })).toBe('write')
    expect(pointerRole('touch', { penSeen: true, mode: 'pen' })).toBe('tap')
  })

  it('always lets the pen write; the mouse writes only when writing is the chosen mode', () => {
    for (const penSeen of [false, true]) {
      expect(pointerRole('pen', { penSeen, mode: 'pen' })).toBe('write')
      expect(pointerRole('pen', { penSeen, mode: 'keypad' })).toBe('write')
      expect(pointerRole('mouse', { penSeen, mode: 'pen' })).toBe('write')
      expect(pointerRole('mouse', { penSeen, mode: 'keypad' })).toBe('tap')
      expect(pointerRole('mouse', { penSeen, mode: 'keyboard' })).toBe('tap')
    }
  })

  it('ignores secondary fingers and uses taps in keypad mode', () => {
    expect(pointerRole('touch', { penSeen: false, mode: 'touch', isPrimary: false })).toBe('ignore')
    expect(pointerRole('touch', { penSeen: false, mode: 'keypad' })).toBe('tap')
  })
})

describe('pen eraser', () => {
  it('detects the eraser end and the barrel button', () => {
    expect(isEraserPointer({ pointerType: 'pen', buttons: 32 })).toBe(true)
    expect(isEraserPointer({ pointerType: 'pen', button: 5, buttons: 0 })).toBe(true)
    expect(isEraserPointer({ pointerType: 'pen', buttons: 3 })).toBe(true)
    expect(isEraserPointer({ pointerType: 'pen', buttons: 1 })).toBe(false)
    expect(isEraserPointer({ pointerType: 'mouse', buttons: 32 })).toBe(false)
  })
})

describe('penSeen persistence', () => {
  beforeEach(() => localStorage.clear())

  it('remembers and forgets the pen', () => {
    expect(readPenSeen()).toBe(false)
    persistPenSeen()
    expect(localStorage.getItem(PEN_SEEN_KEY)).not.toBeNull()
    expect(readPenSeen()).toBe(true)
    forgetPenSeen()
    expect(readPenSeen()).toBe(false)
  })

  it('survives blocked storage', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readPenSeen()).toBe(false)
    spy.mockRestore()
  })
})

describe('resolveInputMode', () => {
  it('auto: pen if seen, touch on tablets, keyboard on computers', () => {
    expect(resolveInputMode({ preference: 'auto', penSeen: true, isTouchDevice: true })).toBe('pen')
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: true })).toBe('touch')
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: false })).toBe('keypad')
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: false, keyboardUsed: true })).toBe('keypad')
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: true, keyboardUsed: true })).toBe('keyboard')
  })

  it('auto on a phone: the on-screen keypad, unless a pen or a keyboard is in use; a chosen mode stays', () => {
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: true, isPhone: true })).toBe('keypad')
    expect(resolveInputMode({ preference: 'auto', penSeen: true, isTouchDevice: true, isPhone: true })).toBe('pen')
    expect(resolveInputMode({ preference: 'auto', penSeen: false, isTouchDevice: true, isPhone: true, keyboardUsed: true })).toBe('keyboard')
    expect(resolveInputMode({ preference: 'pen', penSeen: false, isTouchDevice: true, isPhone: true })).toBe('touch')
  })

  it('respects explicit preferences', () => {
    expect(resolveInputMode({ preference: 'keypad', penSeen: true, isTouchDevice: true })).toBe('keypad')
    expect(resolveInputMode({ preference: 'keyboard', penSeen: true, isTouchDevice: true })).toBe('keyboard')
    expect(resolveInputMode({ preference: 'pen', penSeen: false, isTouchDevice: true })).toBe('touch')
    expect(resolveInputMode({ preference: 'pen', penSeen: true, isTouchDevice: true })).toBe('pen')
  })
})

describe('palm guard for buttons', () => {
  it('ignores finger presses while the pen touches the screen and just after', () => {
    notePenContact(true, 1000)
    expect(isPalmPress('touch', 1500)).toBe(true)
    expect(isPalmPress('pen', 1500)).toBe(false)
    expect(isPalmPress('mouse', 1500)).toBe(false)
    notePenContact(false, 2000)
    expect(isPalmPress('touch', 2000 + PALM_GUARD_MS - 50)).toBe(true)
    expect(isPalmPress('touch', 2000 + PALM_GUARD_MS + 1)).toBe(false)
  })

  it('a lost pen-up cannot block fingers forever', () => {
    notePenContact(true, 10_000)
    expect(isPalmPress('touch', 20_000)).toBe(false)
  })
})

describe('msSincePenContact', () => {
  it('is 0 while the pen touches and grows after it lifts', () => {
    notePenContact(true, 1000)
    expect(msSincePenContact(5000)).toBe(0)
    notePenContact(false, 1200)
    expect(msSincePenContact(4200)).toBe(3000)
  })
})
