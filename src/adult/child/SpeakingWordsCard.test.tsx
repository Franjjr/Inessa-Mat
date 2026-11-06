/* The report's «Palabras que le cuesta decir»: the words whose last result was one star, only while speaking is on, and never
   a number or a score. The results come from the device (listSpeaking) and hold the word, the stars and the time. */
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listSpeaking = vi.hoisted(() => vi.fn(async () => [
  { word: 'three', stars: 1, at: '2026-11-01T10:00:00.000Z' },
  { word: 'apple', stars: 1, at: '2026-11-02T10:00:00.000Z' },
  { word: 'apple', stars: 3, at: '2026-11-03T10:00:00.000Z' },
  { word: 'thirteen', stars: 1, at: '2026-11-04T10:00:00.000Z' },
  { word: 'green', stars: 2, at: '2026-11-05T10:00:00.000Z' },
]))
vi.mock('@/data', () => ({ listSpeaking }))

import { SpeakingWordsCard } from './SpeakingWordsCard'

beforeEach(() => listSpeaking.mockClear())

describe('SpeakingWordsCard', () => {
  it('lists the words whose last result was one star, without numbers', async () => {
    const { container } = render(<SpeakingWordsCard childId="c1" speakingOn />)
    await waitFor(() => expect(screen.getByRole('list', { name: 'Palabras que le cuesta decir' })).toBeTruthy())
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['thirteen', 'three'])
    expect(container.textContent).not.toMatch(/\d|%/)
  })

  it('is hidden, and reads nothing, while speaking is off', () => {
    const { container } = render(<SpeakingWordsCard childId="c1" speakingOn={false} />)
    expect(container.textContent).toBe('')
    expect(listSpeaking).not.toHaveBeenCalled()
  })
})
