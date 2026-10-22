/* A picture with a child's story so far, for the grown-up to share. It holds only the nickname, the companion's
   name and the progress through the worlds: no account, e-mail, school or other personal data. Nothing is sent
   anywhere by the app: the picture goes to the system share sheet, or is downloaded when sharing is not there. */
import { downloadBlob, slug } from '../shared/download'

export interface SummaryInput {
  nickname: string
  companionName: string
  crystals: number
  totalCrystals: number
  /** Name of the world where the adventure is now, or null when it is finished or not started. */
  currentWorld: string | null
}

/** The sentences printed on the picture (pure, so it can be tested). */
export function summaryLines(input: SummaryInput): { title: string; lines: string[]; finished: boolean } {
  const finished = input.totalCrystals > 0 && input.crystals >= input.totalCrystals
  const lines: string[] = []
  if (input.crystals > 0) lines.push(`Ha recuperado ${input.crystals} de ${input.totalCrystals} cristales mágicos.`)
  else lines.push('Su aventura acaba de empezar.')
  if (finished) lines.push('¡Ha completado la aventura!')
  else if (input.currentWorld) lines.push(`Ahora está en ${input.currentWorld}.`)
  return { title: `${input.nickname} y ${input.companionName}`, lines, finished }
}

const SIZE = 1080
const INK = '#2e1a47'
const FONT_DISPLAY = '"Baloo 2", system-ui, sans-serif'
const FONT_READ = 'Andika, system-ui, sans-serif'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const out: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > maxWidth && line) {
      out.push(line)
      line = w
    } else line = next
  }
  if (line) out.push(line)
  return out
}

/** Draws the picture on a square canvas and returns it as PNG. */
export async function renderSummaryPng(input: SummaryInput): Promise<Blob> {
  const text = summaryLines(input)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('El navegador no puede dibujar la imagen.')
  try {
    await document.fonts?.load(`800 120px ${FONT_DISPLAY}`)
  } catch {
    // Without the web font the system face is used.
  }

  ctx.fillStyle = '#faf5ff'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Sticker card: thick outline and a hard offset shadow.
  roundRect(ctx, 110, 140, SIZE - 200, SIZE - 260, 56)
  ctx.fillStyle = INK
  roundRect(ctx, 122, 152, SIZE - 200, SIZE - 260, 56)
  ctx.fill()
  roundRect(ctx, 110, 140, SIZE - 200, SIZE - 260, 56)
  ctx.fillStyle = '#fef9c3'
  ctx.fill()
  ctx.lineWidth = 12
  ctx.strokeStyle = INK
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#6d28d9'
  ctx.font = `800 44px ${FONT_DISPLAY}`
  ctx.fillText('REPASITOS', SIZE / 2, 230)

  ctx.fillStyle = INK
  ctx.font = `800 110px ${FONT_DISPLAY}`
  const titleLines = wrap(ctx, text.title, SIZE - 320)
  let y = 380
  for (const l of titleLines) {
    ctx.fillText(l, SIZE / 2, y)
    y += 120
  }

  ctx.font = `700 52px ${FONT_READ}`
  ctx.fillStyle = '#5b4a75'
  y += 40
  for (const line of text.lines) {
    for (const l of wrap(ctx, line, SIZE - 320)) {
      ctx.fillText(l, SIZE / 2, y)
      y += 70
    }
    y += 24
  }

  ctx.font = `400 34px ${FONT_READ}`
  ctx.fillStyle = '#6f5f8f'
  ctx.fillText('Tablas de multiplicar, jugando', SIZE / 2, SIZE - 170)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen.'))), 'image/png')
  })
}

/** Hands the picture to the system share sheet when it can share files; otherwise downloads it. */
export async function shareSummaryPng(blob: Blob, nickname: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const filename = `repasitos-${slug(nickname)}-resumen.png`
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (typeof navigator.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Repasitos', text: `Así va la aventura de ${nickname} en Repasitos.` })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Any other failure: fall through to the download.
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
