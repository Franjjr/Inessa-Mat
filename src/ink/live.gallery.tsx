/* Live ink entries with the app's real recogniser: /dev/gallery?only=src/ink/live.gallery
   Kept apart from the scripted demos (which replay synthetic strokes and move focus), so that
   tests/e2e/ink.spec.ts can drive them without interference. Also handy to try the model by hand. */
import { useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { DigitCell } from './DigitCell'
import { NumberInput } from './NumberInput'
import { useInputMode, useRecognizer } from './hooks'

function LiveCell() {
  const [v, setV] = useState<number | null>(null)
  const [info, setInfo] = useState('')
  const { ready } = useRecognizer()
  const { mode, penSeen } = useInputMode()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} data-testid="ink-e2e-cell">
      <DigitCell value={v} onChange={(d, i) => { setV(d); setInfo(i ? `${i.via} · ${Math.round(i.confidence * 100)}%` : '') }} size="lg" ariaLabel="prueba casilla" />
      <div style={{ fontFamily: 'var(--font-read)', fontSize: 14, color: 'var(--c-ink-soft)', lineHeight: 1.6 }}>
        <div>Valor: <output data-testid="ink-e2e-cell-value" style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--c-ink)' }}>{v ?? '–'}</output></div>
        <div>{info || ' '}</div>
        <div>modelo: <b data-testid="ink-e2e-ready">{ready ? 'listo' : 'cargando'}</b> · modo: {mode}{penSeen ? ' (lápiz)' : ''}</div>
      </div>
    </div>
  )
}

function LiveNumber() {
  const [v, setV] = useState<number | null>(null)
  const [sent, setSent] = useState<string>('–')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} data-testid="ink-e2e-number">
      <NumberInput value={v} onChange={setV} onSubmit={(x) => setSent(x == null ? '∅' : String(x))} maxDigits={3} ariaLabel="prueba número" />
      <div style={{ fontFamily: 'var(--font-read)', fontSize: 14, color: 'var(--c-ink-soft)', lineHeight: 1.7 }}>
        <div>Valor: <output data-testid="ink-e2e-number-value" style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--c-ink)' }}>{v ?? '–'}</output></div>
        <div>Enviado: <output data-testid="ink-e2e-number-sent">{sent}</output></div>
      </div>
    </div>
  )
}

const entries: GalleryEntry[] = [
  { title: 'Prueba con el modelo real · casilla', width: 560, render: () => <LiveCell /> },
  { title: 'Prueba con el modelo real · número', width: 640, render: () => <LiveNumber /> },
]

export default entries
