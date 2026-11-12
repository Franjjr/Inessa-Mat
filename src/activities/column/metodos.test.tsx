/* The subtraction rounds use the school method the grown-up saved: a retired method of old data (saltos en la recta,
   por partes) is the column with «pedir prestado»; «me llevo una» is the column with its marks under the subtrahend.
   The same in the column activity, the exercises activity and the exercise view of the kind. */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig, ActivityHost, SubMethod } from '@/types'
import { ActivityHostProvider } from '@/activities/host'
import { makeColumnSub } from '@/engine'
import ColumnActivity from './index'
import ExercisesActivity from '../exercises/index'
import SubtractionView from '../views/SubtractionView'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}), stop: vi.fn() },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const host = (subMethod: string): ActivityHost => ({
  reportAttempt: vi.fn(),
  react: vi.fn(),
  rng: () => 0.5,
  mastery: {},
  t: (s: string) => s,
  prefs: { timedActivities: true, bigCells: false, voice: false, handedness: 'right', subMethod: subMethod as SubMethod, divMethod: 'galera', tableMethod: null },
}) as never

const config = (kind: 'column' | 'exercises'): ActivityConfig => ({
  kind, title: 'Restas', instructions: '', selector: { skills: ['sub:2d:b1'] }, count: 1,
})

const borrowMark = () => screen.findByRole('textbox', { name: 'marca de decenas (opcional)' })
const carryMark = () => screen.findByRole('textbox', { name: 'compensación de decenas (opcional)' })

describe('the school method of the subtraction, whatever old data says', () => {
  for (const kind of ['column', 'exercises'] as const) {
    const Activity = kind === 'column' ? ColumnActivity : ExercisesActivity

    for (const saved of ['line', 'parts', 'borrow', 'nope']) {
      it(`${kind}: with «${saved}» saved, the round is the column with pedir prestado`, async () => {
        render(<ActivityHostProvider value={host(saved)}><Activity config={config(kind)} onDone={() => {}} onExit={() => {}} /></ActivityHostProvider>)
        expect(await screen.findByRole('region', { name: 'Operación en columna' })).toBeTruthy()
        expect(await borrowMark()).toBeTruthy()
        expect(screen.queryByRole('textbox', { name: /compensación/ })).toBeNull()
      })
    }

    it(`${kind}: with «carry» saved, the round is the column with me llevo una`, async () => {
      render(<ActivityHostProvider value={host('carry')}><Activity config={config(kind)} onDone={() => {}} onExit={() => {}} /></ActivityHostProvider>)
      expect(await screen.findByRole('region', { name: 'Operación en columna' })).toBeTruthy()
      expect(await carryMark()).toBeTruthy()
    })
  }

  it('SubtractionView with «line» or «parts» (old data) shows the column', () => {
    for (const method of ['line', 'parts'] as SubMethod[]) {
      const { unmount } = render(<SubtractionView exercise={makeColumnSub(212, 40)} onAnswered={() => {}} method={method} />)
      expect(screen.getByRole('region', { name: 'Operación en columna' })).toBeTruthy()
      expect(screen.getByRole('textbox', { name: 'marca de decenas (opcional)' })).toBeTruthy()
      unmount()
    }
  })
})
