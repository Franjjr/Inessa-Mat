import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { errorReport } from '@/engine'
import type { AttemptRecord } from '@/types'
import { MistakesCard, SpeedCard, TestDueNote, WeeklyTrendCard } from './LearningCards'
import { weeklyTrend } from './trend'

const now = new Date(2026, 9, 22, 12)
const DAY = 24 * 60 * 60 * 1000

function wrong(skill: string, given: string, expected: string, daysAgo: number, errorType: AttemptRecord['errorType'] = 'fact'): AttemptRecord {
  return {
    id: `${skill}-${daysAgo}-${given}`, childId: 'c', sessionId: null, skill, kind: 'fact-mul', correct: false, given, expected,
    ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType, context: {}, createdAt: new Date(now.getTime() - daysAgo * DAY).toISOString(),
  }
}

describe('MistakesCard: examples and advice for every kind', () => {
  it('shows what was asked, what was written and the right answer, and advice for each kind', () => {
    const attempts = [
      wrong('mul:7x8', '54', '56', 1),
      wrong('mul:6x9', '', '54', 2),
      wrong('mul:2x2', '5', '4', 3, 'carry-forgot'),
    ]
    render(<MistakesCard report={errorReport(attempts, now)} childName="Lía" />)

    const examples = screen.getByRole('list', { name: /Ejemplos de tablas/ })
    expect(within(examples).getByText('7 × 8: escribió «54» (la respuesta es 56)')).toBeInTheDocument()
    expect(within(examples).getByText('6 × 9: no escribió nada (la respuesta es 54)')).toBeInTheDocument()
    // Every kind gets its advice, not only the first two.
    expect(screen.getAllByText(/Qué ayuda:/)).toHaveLength(2)
    expect(screen.getByText(/Para empezar, con «7 × 8» y «6 × 9»\./)).toBeInTheDocument()
  })

  it('names Lengua skills briefly, without their explanation in brackets, in the examples and the advice', () => {
    const attempts = [
      wrong('lng:orto:signos:punto', 'coma', 'punto', 1, 'punctuation'),
      wrong('lng:orto:signos:coma', '', 'coma', 2, 'punctuation'),
    ]
    render(<MistakesCard report={errorReport(attempts, now, 30, 'language')} childName="Lía" subject="language" />)
    const examples = screen.getByRole('list', { name: /Ejemplos de/ })
    expect(within(examples).getByText('Usar el punto: escribió «coma» (la respuesta es punto)')).toBeInTheDocument()
    expect(screen.getByText(/Para empezar, con «Usar el punto» y «Usar la coma»\./)).toBeInTheDocument()
  })

  it('keeps the whole name of a Lengua skill that has no brackets', () => {
    const attempts = [wrong('lng:orto:mayusculas', '', 'mayúscula', 1, 'capital')]
    render(<MistakesCard report={errorReport(attempts, now, 30, 'language')} childName="Lía" subject="language" />)
    expect(screen.getByText(/Para empezar, con «Mayúsculas: al empezar y en los nombres propios»\./)).toBeInTheDocument()
  })

  it('never shows «No lo sé» as a mistake', () => {
    const attempts = [wrong('mul:7x8', '', '56', 1, 'dont-know')]
    render(<MistakesCard report={errorReport(attempts, now)} childName="Lía" />)
    expect(screen.getByText(/ningún error que destacar/)).toBeInTheDocument()
  })
})

describe('TestDueNote: the reminder of the prueba inicial', () => {
  it('reminds the grown-up after three weeks without the test', () => {
    const ago = new Date(now.getTime() - 25 * DAY).toISOString()
    render(<TestDueNote lastStartedAt={ago} now={now} />)
    expect(screen.getByRole('status')).toHaveTextContent('Hace 3 semanas que no se hace')
  })

  it('says when the next test is due before that', () => {
    const ago = new Date(now.getTime() - 5 * DAY).toISOString()
    render(<TestDueNote lastStartedAt={ago} now={now} />)
    expect(screen.getByText(/Próxima prueba sugerida:/)).toBeInTheDocument()
  })
})

describe('SpeedCard and WeeklyTrendCard', () => {
  it('reads the speed as a sentence, with no push', () => {
    render(<SpeedCard speed={{ quick: [2, 5], slow: [7] }} childName="Lía" />)
    expect(screen.getByText(/responde de memoria las tablas del 2 y 5/)).toBeInTheDocument()
    expect(screen.getByText(/Con la tabla del 7 todavía va pensando/)).toBeInTheDocument()
  })

  it('shows the weeks with answers, newest week labelled', () => {
    const attempts = [wrong('mul:7x8', '56', '56', 1), wrong('mul:7x8', '54', '56', 15), wrong('mul:7x8', '56', '56', 16)]
    const weeks = weeklyTrend(attempts.map((a) => ({ ...a, correct: a.given === a.expected })), now, 3)
    render(<WeeklyTrendCard weeks={weeks} childName="Lía" />)
    expect(screen.getByText('Esta semana')).toBeInTheDocument()
    expect(screen.getByText('Hace 2 semanas')).toBeInTheDocument()
  })
})
