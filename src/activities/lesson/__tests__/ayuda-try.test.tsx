/* The help ladder of a lesson try, with the real lesson «Dibujar la historia» (w4-bars) and the real corrector:
   the same exercise after a miss with the corrector's own message, and after the second miss the exercise stays on
   screen solved step by step, the lesson goes on with «Seguir», and «Mira el truco» never appears. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getLesson } from '@/content'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { check } from '@/engine'
import type { ActivityHost, Answer, Exercise, ExerciseViewProps, LessonDef } from '@/types'
import LessonPlayer from '../LessonPlayer'
import TrySlot from '../TrySlot'

/** A wrong answer of the right shape for the exercise (so the real corrector writes its real message). */
function wrongAnswer(ex: Exercise): Answer {
  switch (ex.kind) {
    case 'bar-problem':
      return { type: 'bar', placed: ex.bar.map((b) => b.value), ops: ex.steps.map((s) => s.op), results: ex.steps.map((s, i) => (i === ex.steps.length - 1 ? s.result + 1 : s.result)) }
    case 'division':
      return { type: 'division', quotient: ex.quotient + 1, remainder: 0 }
    default:
      return { type: 'number', value: -1 }
  }
}

/** A source file as text (the CSS module is not processed in the tests). Node is imported at run time, as in ink/ml/testUtils. */
async function source(path: string): Promise<string> {
  const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as { readFileSync(p: string, enc: 'utf8'): string }
  const cwd = (globalThis as { process?: { cwd(): string } }).process!.cwd()
  return fs.readFileSync(`${cwd}/${path}`, 'utf8')
}

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  const engine = await import('@/engine')
  // The view shows the statement (the numbers of the exercise) and answers wrongly through the real corrector.
  const ExerciseView = (props: ExerciseViewProps) => {
    const ex = props.exercise
    const statement = 'text' in ex && typeof ex.text === 'string' ? ex.text : ex.id
    return createElement('div', { 'data-testid': 'fake-exercise' },
      createElement('p', { 'data-testid': 'statement' }, statement),
      createElement('button', {
        type: 'button',
        onClick: () => props.onAnswered({ check: engine.check(ex, wrongAnswer(ex)), ms: 1, inputMode: 'keyboard', hintsUsed: 0, recognitionFixes: 0 }),
      }, 'Responder mal'))
  }
  return { ExerciseView, useActivityHost: host.useActivityHost }
})

const said: string[] = []
vi.mock('@/audio', () => ({
  // The voice never finishes in these tests: the player shows «Parar» while it talks.
  speech: { say: vi.fn((text: string) => { said.push(text); return new Promise<void>(() => undefined) }), stop: vi.fn(), speaking: () => true },
  sfx: { play: vi.fn() },
}))

const nextButton = () => screen.getByRole('button', { name: /Siguiente|Lo he entendido|Seguir/ })

describe('lesson try w4-bars: one help ladder on the same exercise', () => {
  it('first miss: same numbers and the corrector\'s message; second miss: the exercise stays, solved, and «Seguir»', () => {
    const lesson = getLesson('w4-bars')!
    expect(lesson).toBeTruthy()
    render(<LessonPlayer lesson={lesson} onDone={() => undefined} />)
    for (let i = 0; i < lesson.steps.length - 1; i++) fireEvent.click(nextButton())
    const statement = screen.getByTestId('statement').textContent

    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const footer = screen.getByText(/Casi\. Fíjate en lo que te digo y corrígelo\./).parentElement!
    // Under the line, the corrector's own message (see the next test) and the first hint, each in its own paragraph.
    const lines = within(footer).getAllByText((_, el) => el?.tagName === 'P').map((p) => p.textContent)
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/Mira el truco/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    expect(screen.getByTestId('statement').textContent).toBe(statement)

    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    // The exercise is still on screen with the same numbers, and solved below it.
    expect(screen.getByTestId('statement').textContent).toBe(statement)
    const panel = screen.getByTestId('solution-panel')
    const numbers = (statement ?? '').match(/\d+/g)!.map(Number)
    const [a, b] = numbers
    expect(panel.textContent).toContain(`${a} + ${b} = ${a + b}`)
    expect(panel.textContent).toContain('Para la barra entera se juntan los trozos')
    expect(nextButton()).toHaveTextContent('Seguir')
    expect(nextButton()).toBeEnabled()
    expect(screen.queryByText(/Mira el truco/)).toBeNull()
    expect(screen.queryByText(/No pasa nada/)).toBeNull()
  })

  it('the footer shows the real message of the corrector after the first miss', () => {
    const lesson = getLesson('w4-bars')!
    const step = lesson.steps[lesson.steps.length - 1]
    let seen: Exercise | null = null
    const host: ActivityHost = { ...defaultActivityHost, reportAttempt: (a) => { seen = a.exercise } }
    render(
      <ActivityHostProvider value={host}>
        <TrySlot selector={step.trySelector!} seedKey="w4-bars:3" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const expected = check(seen!, wrongAnswer(seen!)).feedback!
    expect(expected.length).toBeGreaterThan(5)
    expect(screen.getByRole('status').textContent).toContain(expected)
  })
})

describe('TrySlot footer: the lines never run together', () => {
  it('two separate paragraphs, stacked in a column', async () => {
    const lesson = getLesson('w4-bars')!
    const step = lesson.steps[lesson.steps.length - 1]
    render(<TrySlot selector={step.trySelector!} seedKey="w4-bars:3" onSettled={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const status = screen.getByRole('status')
    const lines = [...status.children].filter((c) => c.tagName === 'P').map((p) => p.textContent ?? '')
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(status.textContent).not.toMatch(/\d\.No/)
    const css = await source('src/activities/lesson/TrySlot.module.css')
        const footer = /\.(?:_footer_\w+|footer)\s*\{([^}]*)\}/.exec(css)![1]
    expect(footer).toMatch(/flex-direction:\s*column/)
    expect(footer).toMatch(/gap:\s*var\(--sp-2\)/)
    expect(footer).toMatch(/flex-wrap:\s*wrap/)
    expect(footer).toMatch(/text-align:\s*center/)
  })
})

describe('TrySlot: giving up a division shows the result and what is left over', () => {
  it('a division with a remainder: the solution names both', () => {
    render(<TrySlot selector={{ skills: ['div:2x1:rem'] }} seedKey="div-rem" onSettled={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const panel = screen.getByTestId('solution-panel')
    expect(panel.textContent).toMatch(/Respuesta: \d+, y sobran? \d+/)
  })
})

describe('TrySlot: writing the answer after the solution', () => {
  it('says to press «Escribirla otra vez», and a wrong copy is told, never wiped in silence', () => {
    const onSettled = vi.fn()
    render(<TrySlot selector={{ skills: ['div:2x1:rem'] }} seedKey="div-copy" onSettled={onSettled} />)
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Si quieres escribirla tú, pulsa «Escribirla otra vez».')
    expect(screen.queryByText(/escribe tú la respuesta arriba/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Escribirla otra vez' }))
    expect(screen.getByRole('status')).toHaveTextContent('Escribe la respuesta arriba, mirando la solución.')
    expect(screen.queryByRole('button', { name: 'Escribirla otra vez' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(screen.getByRole('status')).toHaveTextContent('No es igual. Mira la solución y escríbela otra vez.')
    expect(screen.getByTestId('solution-panel')).toBeInTheDocument()
    // Practice only: the step was settled once, at the give-up.
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})

describe('LessonPlayer: the voice', () => {
  const voiced: ActivityHost = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, voice: true } }
  const lesson: LessonDef = {
    id: 'test-say',
    title: 'Voz',
    steps: [
      { visual: 'groups', params: { groups: 2, perGroup: 3, emoji: '🍄' }, text: '1 000 − 1 = 999', say: 'mil menos uno son novecientos noventa y nueve', interaction: 'tap' },
      { visual: 'groups', params: { groups: 2, perGroup: 3, emoji: '🍄' }, text: 'Sin voz propia.', interaction: 'tap' },
    ],
  }

  it('a step with `say` says it (the bubble keeps `text`), and one button stops the voice while it talks', () => {
    said.length = 0
    render(
      <ActivityHostProvider value={voiced}>
        <LessonPlayer lesson={lesson} onDone={() => undefined} />
      </ActivityHostProvider>,
    )
    expect(said[0]).toBe('mil menos uno son novecientos noventa y nueve')
    expect(screen.getByTestId('lesson-text').textContent).toContain('999')
    const stop = screen.getByRole('button', { name: 'Parar la voz' })
    expect(stop).toHaveTextContent('Parar')
    fireEvent.click(stop)
    expect(screen.getByRole('button', { name: 'Escuchar otra vez' })).toHaveTextContent('Escuchar')
    expect(screen.queryByRole('button', { name: 'Parar la voz' })).toBeNull()
    fireEvent.click(nextButton())
    expect(said.at(-1)).toBe('Sin voz propia.')
  })

  it('picking a subtraction or division method in a choose step does not save it', () => {
    const setPreference = vi.fn()
    for (const preference of ['subMethod', 'divMethod'] as const) {
      const choose: LessonDef = {
        id: `test-${preference}`, title: 'Elige',
        steps: [{ visual: 'sub-check', params: { a: 352, b: 127 }, text: '¿Cuál?', interaction: 'choose', preference, choices: [{ label: 'Uno', value: 'parts' }, { label: 'Otro', value: 'line' }] }],
      }
      const { unmount } = render(
        <ActivityHostProvider value={{ ...defaultActivityHost, setPreference }}>
          <LessonPlayer lesson={choose} onDone={() => undefined} />
        </ActivityHostProvider>,
      )
      fireEvent.click(screen.getByRole('radio', { name: 'Otro' }))
      unmount()
    }
    expect(setPreference).not.toHaveBeenCalled()
  })
})

describe('TrySlot «Escuchar» and the statement size (P5, P3PE-01)', () => {
  it('the try can be heard with the child\'s names, and its box carries --fit-scale for the statement', () => {
    const lesson = getLesson('w4-bars')!
    const step = lesson.steps[lesson.steps.length - 1]
    const host: ActivityHost = { ...defaultActivityHost, t: (x: string) => x.replace(/\{child\}/g, 'Inés').replace(/\{pet\}/g, 'Nube') }
    said.length = 0
    render(
      <ActivityHostProvider value={host}>
        <TrySlot selector={step.trySelector!} seedKey="w4-bars:3" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Escuchar/ }))
    expect(said).toHaveLength(1)
    expect(said[0]).not.toMatch(/\{/)
    expect(said[0].length).toBeGreaterThan(10)
    const box = screen.getByTestId('fake-exercise').closest('[data-fit-inner]') as HTMLElement
    expect(box).toBeTruthy()
    expect(box.style.getPropertyValue('--fit-scale')).toBe('1')
  })
})

describe('the lesson bubble keeps a calculation on one line', () => {
  it('no-break spaces around a sign between numbers', async () => {
    const { noBreakSigns } = await import('../LessonPlayer')
    expect(noBreakSigns('Mira: 6 + 3 = 9 y 4 × 2 = 8.')).toBe('Mira: 6 + 3 = 9 y 4 × 2 = 8.')
    expect(noBreakSigns('Son 3 y 4.')).toBe('Son 3 y 4.')
  })
})
