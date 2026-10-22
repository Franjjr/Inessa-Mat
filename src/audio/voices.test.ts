import { VOICES } from './testing/mockSpeech'
import { isSpanish, pickBestVoice, scoreVoice } from './voices'

describe('voice ranking', () => {
  it('never picks a non-Spanish voice', () => {
    expect(pickBestVoice([VOICES.samantha])).toBeNull()
    expect(scoreVoice(VOICES.samantha)).toBe(-Infinity)
  })

  it('recognises Spanish locales in every spelling', () => {
    expect(isSpanish({ name: 'x', lang: 'es_ES', localService: true, default: false })).toBe(true)
    expect(isSpanish({ name: 'x', lang: 'ES-es', localService: true, default: false })).toBe(true)
    expect(isSpanish({ name: 'x', lang: 'es', localService: true, default: false })).toBe(true)
    expect(isSpanish({ name: 'x', lang: 'en-ES', localService: true, default: false })).toBe(false)
  })

  it('iPad: Mónica beats Paulina (es-MX) and the novelty voices', () => {
    expect(pickBestVoice([VOICES.eddy, VOICES.paulina, VOICES.monica, VOICES.samantha])?.name).toBe('Mónica')
    expect(pickBestVoice([VOICES.eddy, VOICES.paulina])?.name).toBe('Paulina')
  })

  it('prefers the enhanced Mónica download', () => {
    const enhanced = { ...VOICES.monica, name: 'Mónica (mejorada)', voiceURI: 'monica-enh' }
    expect(pickBestVoice([VOICES.monica, enhanced])?.voiceURI).toBe('monica-enh')
  })

  it('Edge: neural Elvira online, Helena offline', () => {
    expect(pickBestVoice([VOICES.helena, VOICES.elvira], true)?.name).toMatch(/Elvira/)
    expect(pickBestVoice([VOICES.helena, VOICES.elvira], false)?.name).toMatch(/Helena/)
  })

  it('skips voices that failed', () => {
    expect(pickBestVoice([VOICES.helena, VOICES.elvira], true, new Set(['elvira']))?.name).toMatch(/Helena/)
  })
})
