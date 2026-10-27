import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { syllabusReport } from '@/engine'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import { TemarioCard } from './LearningCards'

/** The list row of a topic: its text starts with the topic name (the name can also appear in the lead text). */
const rowOf = (name: string) => screen.getAllByRole('listitem').find((li) => li.querySelector('span')?.textContent?.startsWith(name)) as HTMLElement

describe('TemarioCard: what the child needed per topic', () => {
  const report = syllabusReport(GRADE3_SYLLABUS, {})
  // Topic names repeat across the temario: pick one that is unique, so the row can be found by its name.
  const all = report.blocks.flatMap((b) => b.topics)
  const unique = (name: string) => all.filter((t) => t.name === name).length === 1
  const topic = all.find((t) => t.state === 'sin-empezar' && unique(t.name))!

  it('shows «No lo sabía» and «Necesitó otro intento» with their numbers, as text', () => {
    render(<TemarioCard report={report} needs={{ [topic.id]: { dontKnow: 2, retried: 1 } }} childName="Lía" />)
    const row = rowOf(topic.name)
    expect(within(row).getByText('No lo sabía: 2')).toBeInTheDocument()
    expect(within(row).getByText('Necesitó otro intento: 1')).toBeInTheDocument()
  })

  it('shows zeros for the other count when one of them is set, and nothing for topics with no need', () => {
    render(<TemarioCard report={report} needs={{ [topic.id]: { dontKnow: 0, retried: 3 } }} childName="Lía" />)
    const row = rowOf(topic.name)
    expect(within(row).getByText('No lo sabía: 0')).toBeInTheDocument()
    expect(within(row).getByText('Necesitó otro intento: 3')).toBeInTheDocument()
    const other = all.find((t) => t.id !== topic.id && unique(t.name))!
    const otherRow = rowOf(other.name)
    expect(within(otherRow).queryByText(/No lo sabía/)).toBeNull()
  })
})
