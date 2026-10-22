/* Behaviour tests for the times-table minigames. Each mock host uses the same seeded RNG as the component, so the
   test can recompute the exact items (and maze) the activity generates and answer them correctly. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { buildMaze } from '../../maze/grid'
import { generate } from '@/engine'
import type { ActivityConfig, ActivityHost, Exercise } from '@/types'
import { ActivityHostProvider } from '../../host'
import BubblesActivity from '../../bubbles'
import ChainActivity from '../../chain'
import FamilyActivity from '../../family'
import MazeActivity from '../../maze'
import MemoryActivity from '../../memory'
import MissingActivity from '../../missing'
import NecklaceActivity from '../../necklace'
import PixelActivity from '../../pixel'
import RaceActivity from '../../race'
import WheelActivity from '../../wheel'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const SEED = 7

/** Same generator as the mock host below (Park-Miller), so a fresh copy replays the activity's random choices. */
function seededRng(seed = SEED): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function mockHost(overrides: { timed?: boolean; voice?: boolean } = {}): ActivityHost & {
  reportAttempt: ReturnType<typeof vi.fn>
  react: ReturnType<typeof vi.fn>
} {
  return {
    reportAttempt: vi.fn(),
    react: vi.fn(),
    rng: seededRng(),
    mastery: {},
    t: (s: string) => s.replace(/\{child\}/g, 'Inessa'),
    prefs: { timedActivities: overrides.timed ?? true, bigCells: false, voice: overrides.voice ?? false, handedness: 'right' },
  } as never
}

/** The items an activity generates as its first random step (same seed, same selector, same count). */
function itemsOf(config: ActivityConfig, count: number, kinds?: Exercise['kind'][]): Exercise[] {
  return generate({ ...config.selector, ...(kinds ? { kinds } : {}), adaptive: config.selector.adaptive ?? true }, count, {
    rng: seededRng(),
    mastery: {},
  })
}

function renderIn(host: ActivityHost, node: React.ReactNode) {
  return render(<ActivityHostProvider value={host}>{node}</ActivityHostProvider>)
}

/** Advances the fake clock past the feedback delay of a finished item. */
async function pass(ms = 1500) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('missing-factor', () => {
  const config: ActivityConfig = {
    kind: 'missing',
    title: '¿Qué número falta?',
    instructions: 'Piensa.',
    selector: { kinds: ['missing-factor'], tables: [6], factorRange: [2, 9] },
    count: 2,
  }

  it('reports each item, lights a lock per right answer and finishes with stars', async () => {
    const items = itemsOf(config, 2) as Array<Exercise & { answer: number }>
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <MissingActivity config={config} onDone={onDone} />)
    for (const ex of items) {
      await user.keyboard(`${ex.answer}{Enter}`)
      await pass()
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    expect(host.reportAttempt.mock.calls.every((c) => c[0].check.correct)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 2, total: 2, stars: 3 })
  })
})

describe('wheel', () => {
  it('asks each number of the ring in order and finishes', async () => {
    const config: ActivityConfig = {
      kind: 'wheel',
      title: 'La rueda del 6',
      instructions: 'Multiplica.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      params: { center: 6, numbers: [2, 3] },
      count: 2,
    }
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <WheelActivity config={config} onDone={onDone} />)
    expect(screen.getByText(/Número 1 de 2: 2/)).toBeTruthy()
    await user.keyboard('12{Enter}')
    await pass(1000)
    expect(screen.getByText(/Número 2 de 2: 3/)).toBeTruthy()
    await user.keyboard('18{Enter}')
    await pass(1000)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 2, total: 2 })
    expect(host.reportAttempt.mock.calls[0][0].exercise).toMatchObject({ kind: 'fact-mul', a: 6, b: 2 })
  })
})

describe('necklace and chain', () => {
  it('necklace: wrong beads are revealed after two tries and the necklace is logged as wrong', async () => {
    const config: ActivityConfig = {
      kind: 'necklace',
      title: 'Collar de perlas',
      instructions: 'Cuenta.',
      selector: { kinds: ['skip-count'], tables: [6] },
      params: { beads: 8 },
      count: 1,
    }
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <NecklaceActivity config={config} onDone={onDone} />)
    expect(screen.getByRole('group', { name: /Collar de/ })).toBeTruthy()
    // Every hidden bead gets two wrong tries (the second reveals it); the necklace then ends.
    for (let i = 0; i < 20 && !screen.queryByRole('button', { name: 'Seguir' }); i++) {
      await user.keyboard('0{Enter}')
      await pass(1300)
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(1)
    expect(host.reportAttempt.mock.calls[0][0].check.correct).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 0, total: 1, stars: 0 })
  })

  it('chain: writes each doubling and finishes correctly', async () => {
    const config: ActivityConfig = {
      kind: 'chain',
      title: 'Cadena de dobles',
      instructions: 'Dobla.',
      selector: { kinds: ['double-chain'] },
      count: 1,
    }
    const [ex] = itemsOf(config, 1) as Array<Exercise & { kind: 'double-chain'; answer: number[] }>
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <ChainActivity config={config} onDone={onDone} />)
    for (const v of ex.answer) {
      await user.keyboard(`${v}{Enter}`)
    }
    await pass(1500)
    expect(host.reportAttempt.mock.calls[0][0].check.correct).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0].correct).toBe(1)
  })
})

describe('family', () => {
  it('writes the four related facts of the triangle', async () => {
    const config: ActivityConfig = {
      kind: 'family',
      title: 'Familias de números',
      instructions: 'Escribe las cuatro.',
      selector: { kinds: ['fact-family'], tables: [6, 7] },
      count: 1,
    }
    const [ex] = itemsOf(config, 1) as Array<Exercise & { kind: 'fact-family'; a: number; b: number; product: number }>
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <FamilyActivity config={config} onDone={onDone} />)
    const { a, b, product: p } = ex
    for (const v of [p, p, b, a]) await user.keyboard(`${v}{Enter}`)
    await pass(1500)
    expect(host.reportAttempt.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('maze', () => {
  const config: ActivityConfig = {
    kind: 'maze',
    title: 'El laberinto',
    instructions: 'Pisa la tabla del 6.',
    selector: { kinds: ['fact-mul'], tables: [6] },
    params: { table: 6, rows: 4, cols: 4 },
    count: 1,
  }

  it('a tap that is not a multiple of the table gives a gentle clue and logs a wrong attempt', async () => {
    const host = mockHost()
    renderIn(host, <MazeActivity config={config} onDone={vi.fn()} />)
    const cells = screen.getAllByRole('button', { name: /Casilla|Unicornio|Cristal/ })
    const wrong = cells.find((b) => /^Casilla (\d+)$/.test(b.getAttribute('aria-label') ?? '') && Number(b.textContent) % 6 !== 0)!
    fireEvent.click(wrong)
    expect(screen.getByRole('status').textContent).toContain('no es de la tabla del 6')
    expect(host.reportAttempt.mock.calls[0][0].check.correct).toBe(false)
  })

  it('walking the generated path to the gem finishes the maze', async () => {
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <MazeActivity config={config} onDone={onDone} />)
    // Same seed: the first random draw of the activity is the maze itself.
    const maze = buildMaze(6, 4, 4, seededRng())
    const cells = screen.getAllByRole('button', { name: /Casilla|Unicornio|Cristal/ })
    for (const cell of maze.path.slice(1, -1)) {
      await user.click(cells[cell])
    }
    await pass(1500)
    expect(host.reportAttempt).toHaveBeenCalledTimes(maze.path.length - 2)
    expect(host.reportAttempt.mock.calls.every((c) => c[0].check.correct)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0].total).toBe(maze.path.length - 2)
  })
})

describe('race', () => {
  it('without timers the run is untimed and still reports and finishes', async () => {
    const config: ActivityConfig = {
      kind: 'race',
      title: 'Carrera contra tu récord',
      instructions: 'Solo contra ti.',
      selector: { kinds: ['fact-mul'], tables: [7] },
      params: { records: [42000] },
      count: 2,
    }
    const items = itemsOf(config, 2) as Array<Exercise & { a: number; b: number; answer: number }>
    const host = mockHost({ timed: false })
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <RaceActivity config={config} onDone={onDone} />)
    expect(screen.getByText('Sin prisa')).toBeTruthy()
    for (const ex of items) {
      await user.keyboard(`${ex.answer}{Enter}`)
      await pass(1000)
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ total: 2, correct: 2 })
  })
})

describe('pixel', () => {
  it('reveals a picture one fact at a time and finishes', async () => {
    const config: ActivityConfig = {
      kind: 'pixel',
      title: 'El cristal escondido',
      instructions: 'Descúbrelo.',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8] },
      params: {
        picture: ['AB', 'BA'],
        legend: {
          A: { product: 42, color: 'var(--c-gold)', name: 'dorado' },
          B: { product: 48, color: 'var(--c-magic)', name: 'morado' },
        },
      },
      count: 2,
    }
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <PixelActivity config={config} onDone={onDone} />)
    for (let i = 0; i < 2; i++) {
      const label = screen.getByLabelText(/Producto de (\d+) por (\d+)/).getAttribute('aria-label')!
      const [, a, b] = /(\d+) por (\d+)/.exec(label)!
      await user.keyboard(`${Number(a) * Number(b)}{Enter}`)
      await pass(1500)
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    expect(host.reportAttempt.mock.calls.every((c) => c[0].check.correct)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0].total).toBe(2)
  })
})

describe('memory', () => {
  it('matches each multiplication card with its product and finishes', async () => {
    const config: ActivityConfig = {
      kind: 'memory',
      title: 'Parejas del arcoíris',
      instructions: 'Empareja.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      count: 2,
    }
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <MemoryActivity config={config} onDone={onDone} />)
    const facts = screen.getAllByRole('button', { name: /Multiplicación/ })
    for (const f of facts) {
      const [, a, b] = /(\d+) × (\d+)/.exec(f.getAttribute('aria-label')!)!
      const product = String(Number(a) * Number(b))
      await user.click(f)
      await user.click(screen.getByRole('button', { name: `Resultado ${product}` }))
      await pass(500)
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ total: 2, correct: 2 })
  })
})

describe('bubbles', () => {
  const config: ActivityConfig = {
    kind: 'bubbles',
    title: 'Burbujas del bosque',
    instructions: 'Revienta la correcta.',
    selector: { kinds: ['fact-mul'], tables: [6, 7] },
    params: { choices: 4 },
    count: 2,
  }

  it('a wrong bubble is a clue; the right one pops and the run finishes', async () => {
    const [first, second] = itemsOf(config, 2, ['fact-mul']) as Array<Exercise & { answer: number }>
    const host = mockHost({ timed: false })
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <BubblesActivity config={config} onDone={onDone} />)
    const wrong = screen.getAllByRole('button', { name: /Burbuja/ }).find((b) => b.getAttribute('aria-label') !== `Burbuja ${first.answer}`)!
    await user.click(wrong)
    expect(screen.getByRole('status').textContent).not.toBe('')
    await user.click(screen.getByRole('button', { name: `Burbuja ${first.answer}` }))
    await pass(1000)
    await user.click(screen.getByRole('button', { name: `Burbuja ${second.answer}` }))
    await pass(1000)
    // The missed question comes back once more in the same run; the re-ask is practice only.
    await user.click(screen.getByRole('button', { name: `Burbuja ${first.answer}` }))
    await pass(1000)
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    expect(host.reportAttempt.mock.calls[0][0].check.correct).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ total: 2, correct: 1 })
  })

  it('when the timer runs out the fact is logged as wrong and the run moves on (no freeze)', async () => {
    const [first] = itemsOf(config, 2, ['fact-mul']) as Array<Exercise & { answer: number }>
    const host = mockHost({ timed: true })
    renderIn(host, <BubblesActivity config={config} onDone={vi.fn()} />)
    await pass(13000)
    expect(host.reportAttempt).toHaveBeenCalledTimes(1)
    expect(host.reportAttempt.mock.calls[0][0].exercise.answer).toBe(first.answer)
    expect(screen.getByRole('status').textContent).toContain(`${first.answer}`)
    await pass(1500)
    // The timed-out question comes back later in the run: the run has three questions, two planned.
    expect(screen.getByText('2 / 3')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Burbuja/ }).length).toBeGreaterThan(0)
  })
})

describe('memory: a repeated wrong card shakes again', () => {
  it('changes the shake key on every wrong try, even when it is the same card', async () => {
    const config: ActivityConfig = {
      kind: 'memory',
      title: 'Parejas del arcoíris',
      instructions: 'Empareja.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      count: 2,
    }
    const host = mockHost()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderIn(host, <MemoryActivity config={config} onDone={vi.fn()} />)
    const fact = screen.getAllByRole('button', { name: /Multiplicación/ })[0]
    const [, a, b] = /(\d+) × (\d+)/.exec(fact.getAttribute('aria-label')!)!
    const product = Number(a) * Number(b)
    const wrongLabel = screen.getAllByRole('button', { name: /Resultado/ })
      .map((x) => x.getAttribute('aria-label')!)
      .find((l) => l !== `Resultado ${product}`)!
    const keys: string[] = []
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: `Multiplicación ${a} × ${b}` }))
      await user.click(screen.getByRole('button', { name: wrongLabel }))
      keys.push(screen.getByRole('button', { name: wrongLabel }).getAttribute('data-shake') ?? '')
      await pass(500)
    }
    expect(keys[0]).not.toBe('')
    expect(keys[1]).not.toBe('')
    expect(keys[1]).not.toBe(keys[0])
  })
})

describe('pixel: a picture without facts finishes instead of freezing', () => {
  it('shows the result card at once and continues', async () => {
    const config: ActivityConfig = {
      kind: 'pixel',
      title: 'El cristal escondido',
      instructions: 'Descúbrelo.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      params: { picture: ['A'], legend: { A: { product: 97, color: 'var(--c-gold)', name: 'dorado' } } },
      count: 3,
    }
    const onDone = vi.fn()
    renderIn(mockHost(), <PixelActivity config={config} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone.mock.calls[0][0]).toMatchObject({ total: 0, correct: 0 })
  })
})
