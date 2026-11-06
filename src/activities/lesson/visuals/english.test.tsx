import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { speech } from '@/audio/speech'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'

afterEach(() => vi.restoreAllMocks())

describe('eng-word visual', () => {
  it('shows the picture, the English word and its Spanish meaning', () => {
    const Word = LESSON_VISUALS['eng-word']
    render(<Word params={{ emoji: '🐱', en: 'cat', es: 'gato' }} phase={FINAL} runLength={1} reduced />)
    expect(screen.getByTestId('eng-word').textContent).toContain('🐱')
    expect(screen.getByTestId('eng-word').textContent).toContain('cat')
    expect(screen.getByTestId('eng-word').textContent).toContain('gato')
  })

  it('a word without a picture (empty emoji) shows only the words', () => {
    const Word = LESSON_VISUALS['eng-word']
    render(<Word params={{ emoji: '', en: 'hello', es: 'hola' }} phase={FINAL} runLength={1} reduced />)
    expect(screen.getByTestId('eng-word').textContent).toBe('hellohola')
  })

  it('tapping the word says it in English, with the english voice', () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    const Word = LESSON_VISUALS['eng-word']
    render(<Word params={{ emoji: '🐱', en: 'cat', es: 'gato' }} phase={FINAL} runLength={1} reduced />)
    fireEvent.click(screen.getByRole('button', { name: /cat/ }))
    expect(say).toHaveBeenCalledWith('cat', expect.objectContaining({ voice: 'english' }))
  })
})

describe('eng-number visual', () => {
  it('shows the figures and the English number', () => {
    const Num = LESSON_VISUALS['eng-number']
    render(<Num params={{ n: 13, en: 'thirteen' }} phase={FINAL} runLength={1} reduced />)
    expect(screen.getByTestId('eng-number').textContent).toContain('13')
    expect(screen.getByTestId('eng-number').textContent).toContain('thirteen')
  })

  it('tapping the number says the English word', () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    const Num = LESSON_VISUALS['eng-number']
    render(<Num params={{ n: 13, en: 'thirteen' }} phase={FINAL} runLength={1} reduced />)
    fireEvent.click(screen.getByRole('button', { name: /thirteen/ }))
    expect(say).toHaveBeenCalledWith('thirteen', expect.objectContaining({ voice: 'english' }))
  })
})
