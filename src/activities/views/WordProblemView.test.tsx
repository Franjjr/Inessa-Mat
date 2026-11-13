import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { WordProblemExercise } from '@/types'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
import WordProblemView, { calculationFor, planMistake } from './WordProblemView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn(), tap: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const small: WordProblemExercise = {
  id: 'wp-3-2', kind: 'word-problem', skill: 'word:add:3' as WordProblemExercise['skill'], difficulty: 2,
  text: 'Ana tiene 3 estrellas y le dan 2 más. ¿Cuántas tiene ahora?', op: 'add', operands: [3, 2], answer: 5, unit: 'estrellas',
}
const velas: WordProblemExercise = {
  id: 'wp-velas', kind: 'word-problem', skill: 'word:sub:2' as WordProblemExercise['skill'], difficulty: 2,
  text: 'La Reina Aurora quiere poner 45 velas. Ya ha puesto 17. ¿Cuántas le faltan?', op: 'sub', operands: [45, 17], answer: 28, unit: 'velas',
}

/** Writes the planteamiento: the two numbers and the operation. */
async function plan(user: ReturnType<typeof userEvent.setup>, a: number, op: RegExp, b: number) {
  await user.type(screen.getByRole('textbox', { name: 'Primer número' }), String(a))
  await user.click(screen.getByRole('button', { name: op }))
  await user.type(screen.getByRole('textbox', { name: 'Segundo número' }), String(b))
  await user.click(screen.getByRole('button', { name: /Comprobar/ }))
}

describe('planMistake: the planteamiento of the notebook', () => {
  it('right in any order for a sum; the bigger number first in a subtraction; what is shared first in a division', () => {
    expect(planMistake(small, 3, 'add', 2)).toBeNull()
    expect(planMistake(small, 2, 'add', 3)).toBeNull()
    expect(planMistake(velas, 45, 'sub', 17)).toBeNull()
    expect(planMistake(velas, 17, 'sub', 45)).toMatch(/primero va el número más grande/)
    expect(planMistake(velas, 45, 'add', 17)).toMatch(/no es la operación/)
    expect(planMistake(velas, 45, 'sub', 18)).toMatch(/Busca en la historia/)
    const div: WordProblemExercise = { ...small, op: 'div', operands: [84, 4], answer: 21 }
    expect(planMistake(div, 84, 'div', 4)).toBeNull()
    expect(planMistake(div, 4, 'div', 84)).toMatch(/lo que se reparte/)
  })

  it('the boxes only when the numbers ask for them', () => {
    expect(calculationFor(small)).toBeNull()
    expect(calculationFor(velas)?.kind).toBe('column-sub')
    expect(calculationFor({ ...small, op: 'mul', operands: [6, 7], answer: 42 })).toBeNull()
    expect(calculationFor({ ...small, op: 'mul', operands: [4, 23], answer: 92 })?.kind).toBe('column-mul')
    expect(calculationFor({ ...small, op: 'div', operands: [84, 4], answer: 21 })?.kind).toBe('division')
    expect(calculationFor({ ...small, op: 'div', operands: [42, 6], answer: 7 })).toBeNull()
  })
})

describe('WordProblemView: planteamiento, operación, solución', () => {
  it('the story of the candles: planteamiento, the subtraction in boxes, and the solution with its unit', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={velas} onAnswered={onAnswered} showFeedback={false} />)
    // Only the planteamiento at first: no result box yet.
    expect(screen.queryByRole('textbox', { name: 'Respuesta' })).toBeNull()
    await plan(user, 45, /Quitar/, 17)
    expect(screen.getByText('¡Bien planteado!')).toBeInTheDocument()
    // The subtraction in boxes, with 45 on top and 17 under it.
    const region = await screen.findByRole('region', { name: 'Operación en columna' })
    expect(region).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /unidades de 45/ })).toBeInTheDocument()
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('the subtraction done in the boxes is the answer of the story: 45 − 17 = 28 velas, right', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={velas} onAnswered={onAnswered} showFeedback={false} />)
    await plan(user, 45, /Quitar/, 17)
    await screen.findByRole('region', { name: 'Operación en columna' })
    // The child writes 28 in the result row (units first, as in the notebook), then checks the calculation.
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^unidades del resultado/ }), { key: '8' })
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^decenas del resultado/ }), { key: '2' })
    const checks = screen.getAllByRole('button', { name: /Comprobar/ }).filter((b) => !/_key_/.test(b.className))
    expect(checks).toHaveLength(1)
    await user.click(checks[0])
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].exercise ?? velas).toBeTruthy()
    expect(screen.getByText('Solución: 28 velas.')).toBeInTheDocument()
  })

  it('a wrong subtraction in the boxes is a wrong answer of the story, with what she wrote', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={velas} onAnswered={onAnswered} showFeedback={false} />)
    await plan(user, 45, /Quitar/, 17)
    await screen.findByRole('region', { name: 'Operación en columna' })
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^unidades del resultado/ }), { key: '2' })
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^decenas del resultado/ }), { key: '3' })
    await user.click(screen.getAllByRole('button', { name: /Comprobar/ }).filter((b) => !/_key_/.test(b.className))[0])
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false, given: '32' })
  })

  it('a wrong planteamiento is a clue (one hint); the second miss shows how it is set out and goes on', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={velas} onAnswered={onAnswered} showFeedback={false} />)
    await plan(user, 17, /Quitar/, 45)
    expect(screen.getByText(/primero va el número más grande/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    expect(screen.getByText(/Mira cómo se plantea: 45 − 17/)).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Operación en columna' })).toBeInTheDocument()
  })

  it('«Lo sé de cabeza»: the result alone, graded by the story, with the clue counted', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={velas} onAnswered={onAnswered} showFeedback={false} />)
    await plan(user, 45, /Juntar/, 17)
    await user.click(screen.getByRole('button', { name: /Quitar/ }))
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(await screen.findByRole('button', { name: 'Lo sé de cabeza' }))
    await user.type(screen.getByRole('textbox', { name: 'Respuesta' }), '28{Enter}')
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(1)
  })

  it('small numbers: after the planteamiento the result is done in the head; right first time uses no hint', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={small} onAnswered={onAnswered} showFeedback={false} />)
    await plan(user, 3, /Juntar/, 2)
    expect(screen.queryByRole('region', { name: 'Operación en columna' })).toBeNull()
    await user.type(screen.getByRole('textbox', { name: 'Respuesta' }), '5{Enter}')
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(0)
  })
})

describe('WordProblemView with a remainder (H19)', () => {
  const withRest: WordProblemExercise = {
    id: 'wp-17-5', kind: 'word-problem', skill: 'word:div' as WordProblemExercise['skill'], difficulty: 3,
    text: 'Hay 17 cromos para 5 amigos. ¿Cuántos le tocan a cada uno?', op: 'div', operands: [17, 5], answer: 3, remainder: 2, unit: 'cromos',
  }

  it('the quotient and the remainder share one «Comprobar»: no ✓ of their own', async () => {
    const user = userEvent.setup()
    // With a pen (no on-screen keypad) each box would show its own ✓ beside it.
    render(<InkProvider recognizer={scriptedRecognizer([])} penSeen><WordProblemView exercise={withRest} onAnswered={vi.fn()} showFeedback={false} /></InkProvider>)
    await user.click(screen.getByRole('button', { name: /Repartir/ }))
    // The planteamiento shows one «Comprobar» (the bar's).
    const checks = () => screen.getAllByRole('button', { name: /Comprobar/ }).filter((b) => !/_key_/.test(b.className))
    expect(checks()).toHaveLength(1)
  })
})
