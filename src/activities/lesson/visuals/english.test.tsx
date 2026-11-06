import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { speech } from '@/audio/speech'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'
import { ENGLISH_WORDS } from '@/engine/ingles/words'

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

describe('eng-words visual (every word of a theme)', () => {
  it('shows every word of the theme, each with its Spanish meaning, and nothing of another theme', () => {
    const Words = LESSON_VISUALS['eng-words']
    render(<Words params={{ theme: 'tiempo' }} phase={FINAL} runLength={1} reduced />)
    const cells = screen.getAllByRole('button')
    expect(cells.length).toBe(ENGLISH_WORDS.filter((w) => w.theme === 'tiempo').length)
    expect(screen.getByRole('button', { name: 'Escuchar «winter»' }).textContent).toContain('invierno')
    expect(screen.queryByText('cat')).toBeNull()
  })

  it('a tap on any cell says its English word with the english voice', () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    const Words = LESSON_VISUALS['eng-words']
    render(<Words params={{ theme: 'dias' }} phase={FINAL} runLength={1} reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Escuchar «Friday»' }))
    expect(say).toHaveBeenCalledWith('Friday', expect.objectContaining({ voice: 'english' }))
  })
})

describe('eng-number-list visual (a range of numbers)', () => {
  it('0 to 20 shows all 21 numbers, the teens included', () => {
    const List = LESSON_VISUALS['eng-number-list']
    render(<List params={{ from: 0, to: 20 }} phase={FINAL} runLength={1} reduced />)
    expect(screen.getAllByRole('button').length).toBe(21)
    expect(screen.getByRole('button', { name: 'Escuchar «sixteen»' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Escuchar «twenty»' })).toBeDefined()
  })

  it('the decades from 30 to 90 step 10 show seven numbers', () => {
    const List = LESSON_VISUALS['eng-number-list']
    render(<List params={{ from: 30, to: 90, step: 10 }} phase={FINAL} runLength={1} reduced />)
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Escuchar «thirty»', 'Escuchar «forty»', 'Escuchar «fifty»', 'Escuchar «sixty»', 'Escuchar «seventy»', 'Escuchar «eighty»', 'Escuchar «ninety»',
    ])
  })
})
