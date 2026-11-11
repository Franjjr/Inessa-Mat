/* Auditoría P2-05: una respuesta escrita a mano y marcada como mal guarda lo que la app leyó (cifra a cifra, con el
   trazo), y la tarjeta «Respuestas marcadas como mal» de Ajustes lo enseña junto a «la app leyó 47». */
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AttemptRecord } from '@/types'
import { db } from '@/data/db'
import { listWrongAnswerNotes, noteWrongAnswer, type WrongAnswerNote } from '@/data/review'
import { ReviewNotesCard } from '@/adult/settings/ReviewNotesCard'
import { encodeImage28, leaveInkReading, type InkReading } from '../readLog'

const data = vi.hoisted(() => ({ notes: [] as WrongAnswerNote[] }))
vi.mock('@/data', () => ({
  listWrongAnswerNotes: vi.fn(async () => data.notes),
  clearWrongAnswerNotes: vi.fn(async () => undefined),
}))

const attempt = (over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  id: crypto.randomUUID(), childId: 'c1', sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: false, given: '47',
  expected: '42', ms: 3200, inputMode: 'pen', hintsUsed: 0, errorType: 'fact', context: {}, createdAt: new Date().toISOString(), ...over,
})

function inkOf(): InkReading {
  const img = new Float32Array(784)
  for (let i = 300; i < 320; i++) img[i] = 1
  return {
    kind: 'fact-mul', given: '47', recognitionFixes: 0, oneDigitFix: true,
    digits: [
      { digit: 4, confidence: 0.98, alternatives: [9], doubtful: false, confirmed: false, image28: encodeImage28(img) },
      { digit: 7, confidence: 0.93, alternatives: [2, 1], doubtful: false, confirmed: false, image28: encodeImage28(img) },
    ],
  }
}

beforeEach(async () => {
  await db.reviewNotes.clear()
})

describe('review.ts · la nota de una respuesta escrita a mano', () => {
  it('incluye lo leído cifra a cifra: seguridad, alternativas, dudosa, confirmada, imagen y si una cifra la arreglaba', async () => {
    leaveInkReading(inkOf())
    await noteWrongAnswer(attempt())
    const [n] = await listWrongAnswerNotes()
    expect(n.ink).toMatchObject({ oneDigitFix: true, recognitionFixes: 0 })
    expect(n.ink?.digits).toHaveLength(2)
    expect(n.ink?.digits[1]).toMatchObject({ digit: 7, confidence: 0.93, alternatives: [2, 1], doubtful: false, confirmed: false })
    expect(typeof n.ink?.digits[0].image28).toBe('string')
  })

  it('una respuesta tecleada (sin lectura) se guarda como antes, sin campo ink', async () => {
    await noteWrongAnswer(attempt({ given: '48', inputMode: 'keypad' }))
    const [n] = await listWrongAnswerNotes()
    expect(n.ink).toBeUndefined()
    expect(n).toMatchObject({ given: '48', expected: '42' })
  })
})

describe('ReviewNotesCard · el trazo junto a «la app leyó 47»', () => {
  it('enseña cada cifra escrita y lo que la app leyó', async () => {
    data.notes = [{
      seq: 1, at: new Date(2026, 10, 11, 9, 0).toISOString(), appVersion: '1', skill: 'mul:6x7', kind: 'fact-mul', errorType: 'fact',
      given: '47', expected: '42', inputMode: 'pen', ink: inkOf(),
    }]
    render(<ReviewNotesCard />)
    await waitFor(() => expect(screen.getByText(/la app leyó 47/)).toBeInTheDocument())
    expect(screen.getByText(/cambiando una cifra estaría bien/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Trazo de la cifra 1, leída como 4' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Trazo de la cifra 2, leída como 7' })).toBeInTheDocument()
  })
})
