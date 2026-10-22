import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeChild } from '@/world/rewards/testing'
import { DiplomaCertificate, diplomaDateLabel } from './DiplomaCertificate'

describe('diploma', () => {
  it('formats the date in Spanish', () => {
    expect(diplomaDateLabel('2026-10-22T10:00:00.000Z')).toMatch(/22 de octubre de 2026/)
    expect(diplomaDateLabel('no es una fecha')).toBe('')
  })

  it('names the child and gives the Spanish title', () => {
    render(<DiplomaCertificate child={makeChild()} date="2026-10-22T10:00:00.000Z" />)
    expect(screen.getByText('Inessa')).toBeInTheDocument()
    expect(screen.getByText('DIPLOMA')).toBeInTheDocument()
    expect(screen.getByText(/Se entrega a/)).toBeInTheDocument()
  })
})
