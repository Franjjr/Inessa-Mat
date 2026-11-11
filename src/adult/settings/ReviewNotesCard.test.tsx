import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WrongAnswerNote } from '@/data'

const data = vi.hoisted(() => ({ listWrongAnswerNotes: vi.fn(), clearWrongAnswerNotes: vi.fn(async () => undefined) }))
vi.mock('@/data', () => data)
vi.mock('@/ui', async (orig) => ({ ...(await orig<typeof import('@/ui')>()), toast: vi.fn() }))

import { ReviewNotesCard } from './ReviewNotesCard'

const note = (over: Partial<WrongAnswerNote> = {}, seq = 1): WrongAnswerNote => ({
  seq,
  at: new Date(2026, 10, 11, 9, 0).toISOString(),
  appVersion: '1.0.0',
  skill: 'mul:7x8',
  kind: 'fact-mul',
  errorType: 'fact',
  given: '54',
  expected: '56',
  inputMode: 'pen',
  ...over,
})

beforeEach(() => {
  data.listWrongAnswerNotes.mockReset()
  data.clearWrongAnswerNotes.mockClear()
})

describe('«Respuestas marcadas como mal» in the settings', () => {
  it('says what the list is for, without promising a contact channel the app does not have', async () => {
    data.listWrongAnswerNotes.mockResolvedValue([])
    render(<ReviewNotesCard />)
    expect(screen.getByText(/Si ves una respuesta que estaba bien y la app la marcó mal, descarga el archivo/)).toBeInTheDocument()
    expect(screen.queryByText(/avísanos/)).not.toBeInTheDocument()
    await screen.findByText('Todavía no hay respuestas marcadas como mal en este dispositivo.')
  })

  it('lists the notes as a parent reads them, newest first, and says how many', async () => {
    data.listWrongAnswerNotes.mockResolvedValue([note({}, 2), note({ skill: 'sub:4d:z', given: '1', expected: '2' }, 1)])
    render(<ReviewNotesCard />)
    expect(await screen.findByText('Tabla 7 × 8 · escribió 54 · se esperaba 56 · a mano · 11 nov')).toBeInTheDocument()
    expect(screen.getByText('Restas de 4 cifras con ceros · escribió 1 · se esperaba 2 · a mano · 11 nov')).toBeInTheDocument()
    expect(screen.getByText('2 respuestas, las más recientes primero.')).toBeInTheDocument()
  })

  it('disables export and delete when there is nothing to export', async () => {
    data.listWrongAnswerNotes.mockResolvedValue([])
    render(<ReviewNotesCard />)
    await screen.findByText('Todavía no hay respuestas marcadas como mal en este dispositivo.')
    expect(screen.getByRole('button', { name: 'Descargar como archivo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Borrar el registro' })).toBeDisabled()
  })

  it('asks for the right singular and plural before deleting', async () => {
    data.listWrongAnswerNotes.mockResolvedValueOnce([note()]).mockResolvedValue([])
    render(<ReviewNotesCard />)
    await screen.findByText(/Tabla 7 × 8/)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar el registro' }))
    expect(await screen.findByText(/Se borrará 1 respuesta de este dispositivo/)).toBeInTheDocument()
    expect(data.clearWrongAnswerNotes).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  })

  it('uses the plural in the confirmation when there are several notes', async () => {
    data.listWrongAnswerNotes.mockResolvedValue([note({}, 2), note({}, 1)])
    render(<ReviewNotesCard />)
    await screen.findAllByText(/Tabla 7 × 8/)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar el registro' }))
    expect(await screen.findByText(/Se borrarán 2 respuestas de este dispositivo/)).toBeInTheDocument()
  })

  it('deletes only after the adult confirms', async () => {
    data.listWrongAnswerNotes.mockResolvedValueOnce([note()]).mockResolvedValue([])
    render(<ReviewNotesCard />)
    await screen.findByText(/Tabla 7 × 8/)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar el registro' }))
    expect(data.clearWrongAnswerNotes).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, borrar' }))
    await waitFor(() => expect(data.clearWrongAnswerNotes).toHaveBeenCalledTimes(1))
    await screen.findByText('Todavía no hay respuestas marcadas como mal en este dispositivo.')
  })
})
