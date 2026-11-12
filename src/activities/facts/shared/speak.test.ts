import { speakFact } from './speak'
import { speech } from '@/audio'

vi.mock('@/audio', () => ({ speech: { say: vi.fn(() => Promise.resolve()) } }))

describe('speakFact', () => {
  beforeEach(() => vi.mocked(speech.say).mockClear())

  it('asks a new exercise as a question and cuts in on what was still being said', () => {
    speakFact(6, 7, '×')
    expect(speech.say).toHaveBeenCalledWith('¿seis por siete?', { interrupt: true })
  })

  it('says the whole fact once it is solved', () => {
    speakFact(6, 7, '×', 42)
    expect(speech.say).toHaveBeenCalledWith('seis por siete, cuarenta y dos', { interrupt: true })
    speakFact(42, 6, '÷', 7)
    expect(speech.say).toHaveBeenLastCalledWith('cuarenta y dos entre seis, siete', { interrupt: true })
  })

  it('never throws when speech fails', () => {
    vi.mocked(speech.say).mockImplementationOnce(() => { throw new Error('no voice') })
    expect(() => speakFact(2, 3, '×')).not.toThrow()
  })
})
