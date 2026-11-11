/* A session exercise (ExerciseStep) when the child fails: the corrector's own message, the solution step by step after
   «No lo sé» or a wrong final answer, and the subtraction in column even when an old lesson pick saved «saltos». */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { check, createRng, generate, hintsFor, makeColumnSub, toDigits } from '@/engine'
import { ERROR_PHRASES } from '@/content/phrases'
import type { ActivityHost, ExerciseViewProps } from '@/types'
import { ExerciseStep } from '@/world/review/ExerciseStep'

const seen: { method?: string; divMethod?: string }[] = []
const answer = vi.hoisted(() => ({ digits: [] as number[] }))

/** A source file as text (the CSS module is not processed in the tests). Node is imported at run time, as in ink/ml/testUtils. */
async function source(path: string): Promise<string> {
  const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as { readFileSync(p: string, enc: 'utf8'): string }
  const cwd = (globalThis as { process?: { cwd(): string } }).process!.cwd()
  return fs.readFileSync(`${cwd}/${path}`, 'utf8')
}

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const { createElement } = await import('react')
  const engine = await import('@/engine')
  // The view answers with the scripted digits through the real corrector.
  const ExerciseView = (props: ExerciseViewProps) => {
    seen.push({ method: props.method, divMethod: props.divMethod })
    return createElement('button', {
      type: 'button',
      onClick: () => props.onAnswered({ check: engine.check(props.exercise, { type: 'digits', digits: answer.digits }, { method: props.method }), ms: 1, inputMode: 'keyboard', hintsUsed: 0, recognitionFixes: 0 }),
    }, 'Responder')
  }
  return { ...actual, ExerciseView }
})

const host = (prefs: Partial<ActivityHost['prefs']> = {}): ActivityHost => ({ ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, ...prefs } })

describe('ExerciseStep: a wrong subtraction', () => {
  it('shows the corrector\'s message for that exercise, then the solution', () => {
    const ex = makeColumnSub(841, 390)
    answer.digits = toDigits(551) // the borrow not paid back: 841 − 390 written as 551
    const expected = check(ex, { type: 'digits', digits: answer.digits }).feedback!
    render(
      <ActivityHostProvider value={host()}>
        <ExerciseStep exercise={ex} allowHints okLabel="Siguiente" onContinue={vi.fn()} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
    expect(expected.length).toBeGreaterThan(5)
    expect(screen.getByRole('status').textContent).toContain(expected)
    expect(screen.getByTestId('solution-panel')).toHaveTextContent('451')
  })

  it('no wrong subtraction speaks of the tables or the mirror', () => {
    const exercises = [1, 2, 3, 4, 5, 6].flatMap((seed) => generate({ kinds: ['column-sub'] }, 3, { rng: createRng(seed) }))
    for (const ex of exercises) {
      if (ex.kind !== 'column-sub') continue
      for (const delta of [1, 10, 9, -1]) {
        const value = ex.answer + delta
        if (value < 0) continue
        answer.digits = toDigits(value)
        render(
          <ActivityHostProvider value={host()}>
            <ExerciseStep exercise={ex} allowHints okLabel="Siguiente" onContinue={vi.fn()} />
          </ActivityHostProvider>,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
        const text = screen.getByRole('status').textContent ?? ''
        expect(text, `${ex.id} → ${value}: ${text}`).not.toMatch(/tabla|espejo/i)
        cleanup()
      }
    }
    // The phrase of a 'fact' slip fits any operation.
    for (const p of ERROR_PHRASES.fact ?? []) expect(p).not.toMatch(/tabla|espejo|truco/i)
  })
})

describe('ExerciseStep: «No lo sé»', () => {
  it('in 841 − 390 shows the solution with 451', () => {
    render(
      <ActivityHostProvider value={host()}>
        <ExerciseStep exercise={makeColumnSub(841, 390)} allowHints allowDontKnow okLabel="Siguiente" onContinue={vi.fn()} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'No lo sé' }))
    const panel = screen.getByTestId('solution-panel')
    expect(panel).toHaveTextContent('451')
    expect(panel).toHaveTextContent('pido 1 centena a la vecina')
  })

  it('with «saltos en la recta» saved from an old lesson, the subtraction is asked and solved in column', () => {
    seen.length = 0
    render(
      <ActivityHostProvider value={host({ subMethod: 'line', divMethod: 'climb' })}>
        <ExerciseStep exercise={makeColumnSub(841, 390)} allowHints allowDontKnow okLabel="Siguiente" onContinue={vi.fn()} />
      </ActivityHostProvider>,
    )
    expect(seen.at(-1)).toEqual({ method: 'borrow', divMethod: 'galera' })
    fireEvent.click(screen.getByRole('button', { name: 'No lo sé' }))
    expect(screen.getByTestId('solution-panel')).toHaveTextContent('Unidades: 1 − 0 = 1.')
  })

  it('in Lengua and English shows the hints, as before, and no maths solution', () => {
    for (const skill of ['lng:gram:articulo', 'eng:voc:animales'] as const) {
      const ex = generate({ skills: [skill] }, 1, { rng: createRng(3) })[0]
      expect(ex, skill).toBeDefined()
      const hints = hintsFor(ex)
      render(
        <ActivityHostProvider value={host()}>
          <ExerciseStep exercise={ex} allowHints allowDontKnow okLabel="Siguiente" onContinue={vi.fn()} />
        </ActivityHostProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'No lo sé' }))
      expect(screen.queryByTestId('solution-panel'), ex.id).toBeNull()
      expect(screen.getByRole('status'), ex.id).toHaveTextContent('Así se hace')
      if (hints.length) expect(screen.getByRole('status'), ex.id).toHaveTextContent(`Pista 1 de ${hints.length}`)
      cleanup()
    }
  })
})

describe('ExerciseStep: the buttons under the exercise', () => {
  it('«Ahora no» and «No lo sé» are far apart, big and kept at the bottom', async () => {
    const css = await source('src/world/review/ExerciseStep.module.css')
    const skip = /\.(?:_skip_\w+|skip)\s*\{([^}]*)\}/.exec(css)![1]
    expect(skip).toMatch(/gap:\s*var\(--sp-4\)/)
    expect(skip).toMatch(/position:\s*sticky/)
    expect(skip).toMatch(/bottom:\s*0/)
    expect(/\.(?:_skip_\w+|skip)\s*>\s*\*\s*\{([^}]*)\}/.exec(css)![1]).toMatch(/min-height:\s*48px/)
  })
})
