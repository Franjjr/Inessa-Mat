/* The class follows the school method the grown-up chose (methodFor): with «me llevo una abajo» the class of restar
   pidiendo prestado explains that method and its tries are solved with it; the galera without subtractions does not ask
   to write each subtraction (reviews p3-clases H4 and p3-metodos H3). */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { classForMethods, classForTopic } from '@/content/classes'
import { DEFAULT_CHILD_SETTINGS, type DivMethod, type LessonDef, type SubMethod } from '@/types'
import { makeChild } from '@/world/rewards/testing'
import ClassScreen from './ClassScreen'

const state = vi.hoisted(() => ({ subMethod: 'borrow' as string, divMethod: 'galera' as string, lesson: null as LessonDef | null }))

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  return {
    ...actual,
    LessonPlayer: ({ lesson }: { lesson: LessonDef }) => {
      state.lesson = lesson
      return React.createElement('p', null, 'LECCIÓN')
    },
  }
})

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({
      child: makeChild({ grade: 3, settings: { ...DEFAULT_CHILD_SETTINGS, subMethod: state.subMethod as SubMethod, divMethod: state.divMethod as DivMethod } }),
      loading: false, setActiveChild: () => {},
    }),
  }
})

beforeEach(() => {
  state.subMethod = 'borrow'
  state.divMethod = 'galera'
  state.lesson = null
})

async function openClass(topicId: string): Promise<LessonDef> {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[`/play/clase/${topicId}`]}>
      <Routes>
        <Route path="/play/clase/:topicId" element={<ClassScreen />} />
      </Routes>
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('button', { name: '¡Empezar la clase!' }))
  await screen.findByText('LECCIÓN')
  return state.lesson!
}

const tries = (l: LessonDef) => l.steps.filter((st) => st.interaction === 'try')
const shown = (l: LessonDef) => l.steps.filter((st) => st.interaction !== 'try').map((st) => st.text).join(' ')

describe('ClassScreen · the school method', () => {
  it('with «me llevo una», restar pidiendo prestado shows that method and every try is solved with it', async () => {
    state.subMethod = 'carry'
    const lesson = await openClass('resta-3d-prestando')
    expect(shown(lesson)).toMatch(/Le ponemos un 1 delante al 2: 12 menos 7 son 5/)
    expect(shown(lesson)).toMatch(/abajo me llevo una: el 2 de las decenas de abajo pasa a ser 3/)
    expect(shown(lesson)).not.toMatch(/vecina/)
    expect(tries(lesson).length).toBeGreaterThan(0)
    for (const st of tries(lesson)) {
      expect(st.method).toBe('carry')
      expect(st.visual).toBe('sub-carry')
    }
  })

  it('with «pedir prestado» the class is the one of the registry, its tries solved by borrowing', async () => {
    const lesson = await openClass('resta-3d-prestando')
    expect(shown(lesson)).toMatch(/vecina/)
    for (const st of tries(lesson)) expect(st.method).toBe('borrow')
  })

  it('a retired method stored by an older version falls back to the school default', async () => {
    state.subMethod = 'jumps'
    const lesson = await openClass('resta-3d-prestando')
    for (const st of tries(lesson)) expect(st.method).toBe('borrow')
  })

  it('the division tries take the division method; the galera without subtractions never asks to write each one', async () => {
    state.divMethod = 'galera-short'
    const lesson = await openClass('div-3x1')
    expect(tries(lesson).length).toBeGreaterThan(0)
    for (const st of tries(lesson)) {
      expect(st.divMethod).toBe('galera-short')
      expect(st.text).not.toMatch(/resta debajo del paso/i)
    }
  })
})

describe('classForMethods', () => {
  it('never changes the registry, and keeps the id, the topic and the map lesson of the class', () => {
    const cls = classForTopic('resta-3d-prestando', 3)!
    const before = JSON.stringify(cls)
    const carry = classForMethods(cls, { subMethod: 'carry', divMethod: 'galera' })
    expect(JSON.stringify(cls)).toBe(before)
    expect(carry.lesson.id).toBe(cls.lesson.id)
    expect(carry.topicId).toBe(cls.topicId)
    expect(carry.mapLessonId).toBe(cls.mapLessonId)
    expect(carry.lesson.steps).not.toEqual(cls.lesson.steps)
  })
})
