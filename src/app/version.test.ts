import { isSafeToReload, shouldTryUpdate } from './version'

describe('isSafeToReload', () => {
  it('never reloads in the middle of an exercise, a session, a lesson or onboarding', () => {
    for (const p of ['/play/w/w1/groups', '/play/w/w3/wheel', '/play/sesion', '/play/lengua', '/play/clase/mul-2',
      '/play/prueba', '/play/prueba-lengua', '/play/ingles', '/play/prueba-ingles', '/play/review', '/play/caligrafia', '/kids/new',
      '/play/free', '/play/cancion/6']) {
      expect(isSafeToReload(p), p).toBe(false)
    }
  })

  it('reloads on maps, menus and the adult area', () => {
    for (const p of ['/', '/kids', '/play', '/play/w/w1', '/play/album', '/play/shop', '/adult', '/adult/settings', '/welcome']) {
      expect(isSafeToReload(p), p).toBe(true)
    }
  })
})

describe('shouldTryUpdate', () => {
  beforeEach(() => sessionStorage.clear())

  it('tries each server version once per session, so a stale CDN cannot cause a reload loop', () => {
    expect(shouldTryUpdate('bbbbbbb')).toBe(true)
    expect(shouldTryUpdate('bbbbbbb')).toBe(false)
    expect(shouldTryUpdate('ccccccc')).toBe(true)
  })
})
