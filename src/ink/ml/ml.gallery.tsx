import type { GalleryEntry } from '@/dev/Gallery'
import type { InkStroke } from '@/types'
import fixture from './__fixtures__/cases.json'
import writer from './__fixtures__/writer.json'
import { PersonalizationDemo, RecognizerCases, RecognizerLab } from './RecognizerLab'

type Case = { name: string; expected: number | null; zone: { width: number; height: number }; strokes: InkStroke[] }
const cases = (fixture as unknown as { cases: Case[] }).cases
const byName = (n: string) => cases.find((c) => c.name === n)!

const entries: GalleryEntry[] = [
  { title: 'Laboratorio del reconocedor (escribe con el lápiz)', render: () => <RecognizerLab />, width: 800 },
  { title: 'Laboratorio · un 7 de ejemplo', render: () => <RecognizerLab initialStrokes={byName('digit-7-1').strokes} initialZone={byName('digit-7-1').zone} />, width: 800 },
  { title: 'Laboratorio · garabato', render: () => <RecognizerLab initialStrokes={byName('scribble-0').strokes} initialZone={byName('scribble-0').zone} />, width: 800 },
  { title: 'Personalización: aprende la letra de cada niño', render: () => <PersonalizationDemo writer={writer as unknown as Parameters<typeof PersonalizationDemo>[0]['writer']} />, width: 800 },
  { title: 'Casos de prueba (fixtures)', render: () => <RecognizerCases cases={cases} />, width: 800 },
]

export default entries
