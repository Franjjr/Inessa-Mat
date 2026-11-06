/* The privacy policy has a section on the microphone for English, consistent with the speech section. */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PrivacyScreen from './PrivacyScreen'

/** The text of one section: from its heading up to the next heading of the policy. */
function sectionText(title: RegExp): string {
  const heading = screen.getByRole('heading', { name: title })
  let text = ''
  for (let el = heading.nextElementSibling; el && el.tagName !== 'H2'; el = el.nextElementSibling) text += el.textContent ?? ''
  return text
}

describe('PrivacyScreen: micrófono (Inglés)', () => {
  it('has a «Micrófono (Inglés)» section with the facts of the consent', () => {
    render(<MemoryRouter><PrivacyScreen /></MemoryRouter>)
    const text = sectionText(/Micrófono \(Inglés\)/)
    expect(text).toMatch(/apagado de serie/)
    expect(text).toMatch(/Solo un adulto puede activarlo/)
    expect(text).toMatch(/Microsoft Azure/)
    expect(text).toMatch(/Irlanda/)
    expect(text).toMatch(/El audio no se guarda/)
    expect(text).toMatch(/10 intentos/)
  })

  it('names Azure for speech in the processors section too', () => {
    render(<MemoryRouter><PrivacyScreen /></MemoryRouter>)
    expect(sectionText(/Dónde se guardan los datos/)).toMatch(/Azure/)
  })
})
