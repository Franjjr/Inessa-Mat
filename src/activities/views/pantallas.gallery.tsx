/* Dev harness for the e2e «pantallas» specs (tests/e2e/pantallas-*.spec.ts): every kind of exercise the daily session can
   ask (one per kind and skill family of the 2.º–4.º syllabus, plus the subtraction and division methods), mounted in a
   copy of the session's own frame (header, progress bar, card, «Ahora no» / «No lo sé»), full window, with the scroll
   assistant. Open /dev/gallery?only=pantallas; the spec reads window.__pantallas.cases and shows each one with
   window.__pantallas.show(id), so one page load measures them all.
   The frame is portalled to <body> and the gallery itself hidden, so FitToScreen and ScrollAssist see the same page as
   in the real session. */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GalleryEntry } from '@/dev/Gallery'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { season1 } from '@/content'
import { GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS } from '@/content/syllabus'
import PixelActivity from '@/activities/pixel'
import { createRng, generate } from '@/engine'
import { makeLineTick } from '@/engine/numeric'
import { inferKinds } from '@/engine/generate'
import { ScrollAssist } from '@/app/ScrollAssist'
import { BackButton, Screen } from '@/ui'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import s from '@/world/session/session.module.css'
import type { ActivityHost, Exercise } from '@/types'

export interface PantallaCase {
  id: string
  exercise: Exercise
  subMethod?: ActivityHost['prefs']['subMethod']
  divMethod?: ActivityHost['prefs']['divMethod']
}

/** One case per exercise kind and skill family: the times-table and division facts collapse into one family each. */
export function pantallaCases(): PantallaCase[] {
  const out: PantallaCase[] = []
  const seen = new Set<string>()
  for (const syl of [GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS]) {
    for (const block of syl.blocks) {
      for (const topic of block.topics) {
        if (topic.status !== 'disponible') continue
        for (const skill of topic.skills) {
          const family = skill.replace(/\d+x\d+/, 'NxM').replace(/^div:\d+\/\d+$/, 'div:N/M')
          for (const kind of inferKinds({ skills: [skill] })) {
            const id = `${kind}__${family}`
            if (seen.has(id)) continue
            const [exercise] = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(7) })
            if (!exercise || exercise.kind !== kind) continue
            seen.add(id)
            if (kind === 'column-sub') {
              out.push({ id: `${id}__borrow`, exercise, subMethod: 'borrow' })
              out.push({ id: `${id}__carry`, exercise, subMethod: 'carry' })
            } else if (kind === 'division') {
              out.push({ id: `${id}__galera`, exercise, divMethod: 'galera' })
              out.push({ id: `${id}__galera-short`, exercise, divMethod: 'galera-short' })
            } else {
              out.push({ id, exercise })
            }
          }
        }
      }
    }
  }
  // Fixed cases the e2e needs whatever the generator draws: a number line with an empty mark, a row of ten objects.
  out.push({ id: 'number-line__tick', exercise: makeLineTick(100, [3600, 3700, 3800, 3900, 4000], 2) })
  out.push({
    id: 'ordinal__row10',
    exercise: { id: 'ordinal:row:7:10', kind: 'ordinal', skill: 'num:ordinal:10', difficulty: 1, mode: 'row', n: 7, items: Array.from({ length: 10 }, () => '🐞'), options: [], answer: 6 },
  })
  return out
}

declare global {
  interface Window {
    __pantallas?: { cases: string[]; show: (id: string) => void; current: string | null }
  }
}

function SessionFrame({ c }: { c: PantallaCase }) {
  const host: ActivityHost = {
    ...defaultActivityHost,
    prefs: { ...defaultActivityHost.prefs, ...(c.subMethod ? { subMethod: c.subMethod } : {}), ...(c.divMethod ? { divMethod: c.divMethod } : {}) },
  }
  return (
    <ActivityHostProvider value={host}>
      <Screen background="var(--c-bg)" className={s.root}>
        <header className={s.header}>
          <BackButton variant="exit" onClick={() => {}} />
          <h1 className={s.headerTitle}>Mi sesión de hoy</h1>
          <span className={s.clock}>3:12 de 15:00</span>
        </header>
        <div className={s.progressTrack}><div className={s.progressFill} style={{ width: '30%' }} /></div>
        <div className={s.stage}>
          <div className={s.card}>
            <p className={s.blockChip}>Lo nuevo de hoy</p>
            <ExerciseStep
              key={c.id}
              exercise={c.exercise}
              allowHints
              okLabel="Siguiente"
              onContinue={() => {}}
              onSkip={() => {}}
              allowRetry
              allowDontKnow
            />
          </div>
        </div>
      </Screen>
      <ScrollAssist />
    </ActivityHostProvider>
  )
}

function Harness() {
  const [cases] = useState(pantallaCases)
  const [id, setId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('caso'))
  useEffect(() => {
    window.__pantallas = { cases: cases.map((c) => c.id), show: (next) => { window.__pantallas!.current = null; setId(next) }, current: null }
    document.body.dataset.pantallas = 'on'
    return () => { delete window.__pantallas; delete document.body.dataset.pantallas }
  }, [cases])
  useEffect(() => { if (window.__pantallas) window.__pantallas.current = id })
  const c = cases.find((x) => x.id === id) ?? null
  return createPortal(
    <div data-pantalla={c?.id ?? ''}>
      <style>{'body[data-pantallas] #root { display: none !important; }'}</style>
      {c ? <SessionFrame c={c} /> : <p>{cases.length} casos</p>}
    </div>,
    document.body,
  )
}

/** The hidden picture of world 6 (the pixel game), as the child plays it: its numbers must be readable (P3PE-17). */
function PixelGame() {
  const node = season1.worlds.flatMap((w) => w.nodes).find((n) => n.kind === 'activity' && n.activity?.kind === 'pixel')
  if (!node || node.kind !== 'activity' || !node.activity) return <p>Sin juego de píxeles</p>
  return <PixelActivity config={node.activity} onDone={() => {}} onExit={() => {}} />
}

const entries: GalleryEntry[] = [
  { title: 'Pantallas: un ejercicio de la sesión, a pantalla completa', render: () => <Harness /> },
  { title: 'Pixel: el cristal escondido', width: 1000, height: 490, render: () => <PixelGame /> },
]

export default entries
