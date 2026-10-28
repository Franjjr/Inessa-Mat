import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities'
import type { AttemptInput, Exercise, ExerciseOutcome } from '@/types'
import { ExerciseStep } from './ExerciseStep'

// The exercise view is covered by the activities module. Here a stub answers on click with the next scripted outcome
// (a correct one when the script is empty), so only the step is tested.
const script = vi.hoisted(() => ({ outcomes: [] as unknown[], mounts: 0 }))

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  function ExerciseView({ onAnswered }: { onAnswered: (o: unknown) => void }) {
    React.useEffect(() => { script.mounts += 1 }, [])
    return React.createElement('div', null,
      React.createElement('input', { 'aria-label': 'Respuesta' }),
      React.createElement('button', {
        type: 'button',
        onClick: () => onAnswered(script.outcomes.shift() ?? { check: { correct: true, given: '42', expected: '42' }, ms: 900, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0 }),
      }, 'Responder'))
  }
  return { ...actual, ExerciseView }
})

const wrong = (extra: Partial<ExerciseOutcome> = {}): ExerciseOutcome => ({
  check: { correct: false, given: '48', expected: '42', errorType: 'fact' }, ms: 1500, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0, ...extra,
})
const right: ExerciseOutcome = { check: { correct: true, given: '42', expected: '42' }, ms: 900, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0 }

const exercise = { id: 'fact-mul:6x7', kind: 'fact-mul', a: 6, b: 7, answer: 42, skill: 'mul:6x7', difficulty: 1, topic: 'mul' } as unknown as Exercise

beforeEach(() => {
  script.outcomes = []
  script.mounts = 0
})

function renderStep(props: Partial<React.ComponentProps<typeof ExerciseStep>> = {}, reportAttempt = vi.fn()) {
  const onContinue = (props.onContinue ?? vi.fn()) as Mock
  const view = render(
    <ActivityHostProvider value={{ ...defaultActivityHost, reportAttempt: reportAttempt as (a: AttemptInput) => void }}>
      <ExerciseStep exercise={exercise} allowHints okLabel="Siguiente" onContinue={onContinue} {...props} />
    </ActivityHostProvider>,
  )
  return { ...view, onContinue, reportAttempt }
}

describe('ExerciseStep «Ahora no»', () => {
  it('offers «Ahora no» before the child answers, and calls onSkip when tapped', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    renderStep({ onSkip })
    await user.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('does not offer «Ahora no» after the child answers', async () => {
    const user = userEvent.setup()
    renderStep({ onSkip: () => {} })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ahora no' })).toBeNull()
  })

  it('is not offered when the step has no onSkip (the daily review)', () => {
    renderStep()
    expect(screen.queryByRole('button', { name: 'Ahora no' })).toBeNull()
  })
})

describe('ExerciseStep «No lo sé»', () => {
  it('is offered only when allowed, and only before the child answers', async () => {
    const user = userEvent.setup()
    const first = renderStep()
    expect(screen.queryByRole('button', { name: 'No lo sé' })).toBeNull()
    first.unmount()
    renderStep({ allowDontKnow: true })
    expect(screen.getByRole('button', { name: 'No lo sé' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Siguiente' })
    expect(screen.queryByRole('button', { name: 'No lo sé' })).toBeNull()
  })

  it('records one wrong attempt with errorType dont-know, shows every hint («Así se hace») and then «Siguiente»', async () => {
    const user = userEvent.setup()
    const { reportAttempt, onContinue } = renderStep({ allowDontKnow: true })
    await user.click(screen.getByRole('button', { name: 'No lo sé' }))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({
      exercise: expect.objectContaining({ id: 'fact-mul:6x7' }),
      check: { correct: false, given: 'No lo sé', expected: '?', errorType: 'dont-know' },
    })
    expect(screen.getByRole('heading', { name: 'Así se hace' })).toBeInTheDocument()
    expect(screen.getByText('Pista 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('Pista 3 de 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onContinue.mock.calls[0][0].check).toMatchObject({ correct: false, errorType: 'dont-know' })
    expect(reportAttempt).toHaveBeenCalledTimes(1)
  })
})

describe('ExerciseStep «Inténtalo otra vez»', () => {
  it('after a wrong first answer: offers a retry and «Siguiente», and reports nothing yet', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Inténtalo otra vez' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(reportAttempt).not.toHaveBeenCalled()
  })

  it('a retry shows the same exercise again with the input cleared, and records the first answer with retries', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong(), right]
    const { reportAttempt, onContinue } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    const mountsBefore = script.mounts
    await user.click(await screen.findByRole('button', { name: 'Inténtalo otra vez' }))
    expect(script.mounts).toBe(mountsBefore + 1) // ExerciseView is mounted again: a fresh input
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ check: { correct: false }, retries: 1, solvedOnRetry: true })
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onContinue.mock.calls[0][0].check.correct).toBe(false) // the first answer decides the run (requeue), as before
  })

  it('a wrong retry shows the feedback and «Siguiente», with retries but not solved on retry', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong(), wrong({ check: { correct: false, given: '47', expected: '42' } })]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(await screen.findByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ retries: 1 })
    expect(reportAttempt.mock.calls[0][0].solvedOnRetry).toBeUndefined()
  })

  it('is not offered after a correct answer, nor when the step does not allow it', async () => {
    const user = userEvent.setup()
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(reportAttempt).toHaveBeenCalledTimes(1)
  })

  it('without allowRetry a wrong answer is reported at once, as before', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    const { reportAttempt } = renderStep()
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(reportAttempt).toHaveBeenCalledTimes(1)
  })

  it('is not offered when the view already gave the child a second try (facts), and the view retries count', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong({ retries: 1 })]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ retries: 1 })
  })

  it('reports the first answer once even when the step is left in the middle of a retry', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    const { reportAttempt, unmount } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Inténtalo otra vez' })
    expect(reportAttempt).not.toHaveBeenCalled()
    unmount()
    await waitFor(() => expect(reportAttempt).toHaveBeenCalledTimes(1))
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ check: { correct: false } })
    expect(reportAttempt.mock.calls[0][0].retries).toBeUndefined() // no retry was taken
  })
})

describe('ExerciseStep: nothing is lost when the app is left', () => {
  it('reports the pending first answer when the page is hidden or closed', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Inténtalo otra vez' })
    expect(reportAttempt).not.toHaveBeenCalled()
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ check: { correct: false } })
    window.dispatchEvent(new Event('pagehide'))
    expect(reportAttempt).toHaveBeenCalledTimes(1) // reported once, never twice
  })

  it('a pagehide during the offer reports the first answer', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Inténtalo otra vez' })
    window.dispatchEvent(new Event('pagehide'))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
  })
})

describe('ExerciseStep: a hide during the offer does not grade the first answer twice', () => {
  it('after a hide, the retry adds only its own ungraded row: one graded attempt in all', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong(), wrong({ check: { correct: false, given: '47', expected: '42' } })]
    const { reportAttempt } = renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Inténtalo otra vez' })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByRole('button', { name: 'Siguiente' })
    expect(reportAttempt).toHaveBeenCalledTimes(2)
    const graded = reportAttempt.mock.calls.filter((c) => c[0].graded !== false)
    const ungraded = reportAttempt.mock.calls.filter((c) => c[0].graded === false)
    expect(graded).toHaveLength(1)
    expect(graded[0][0]).toMatchObject({ check: { given: '48' } })
    expect(graded[0][0].retries).toBeUndefined()
    expect(ungraded).toHaveLength(1)
    expect(ungraded[0][0]).toMatchObject({ check: { given: '47' }, retries: 1 })
  })
})

describe('ExerciseStep: focus after «Inténtalo otra vez»', () => {
  it('moves the focus to the new exercise input, not to the page body', async () => {
    const user = userEvent.setup()
    script.outcomes = [wrong()]
    renderStep({ allowRetry: true })
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(await screen.findByRole('button', { name: 'Inténtalo otra vez' }))
    expect(screen.getByRole('textbox', { name: 'Respuesta' })).toHaveFocus()
  })
})

describe('ExerciseStep: the escritura guiada is never graded (lng-guided, graded: false)', () => {
  const guided = { id: 'lng-guided:Completa la nota', kind: 'lng-guided', skill: 'lng:escr:guiada', difficulty: 3, task: 'Completa la nota para tu familia', parts: ['a', 'b'], prompts: ['¿Qué?'] } as unknown as Exercise

  it('its finished text is reported once, with graded: false (outside accuracy and the session)', async () => {
    const user = userEvent.setup()
    const reportAttempt = vi.fn()
    renderStep({ exercise: guided, allowDontKnow: false }, reportAttempt)
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0].graded).toBe(false)
  })

  it('a copy is graded as usual (no graded flag on the attempt)', async () => {
    const user = userEvent.setup()
    const reportAttempt = vi.fn()
    const copy = { ...guided, id: 'lng-copy:El sol brilla.', kind: 'lng-copy', skill: 'lng:escr:copia' } as unknown as Exercise
    renderStep({ exercise: copy }, reportAttempt)
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(reportAttempt.mock.calls[0][0].graded).toBeUndefined()
  })
})
