/* Repaso de tiempo, geometría y gráficos (noviembre de 2026): pruebas de regresión. Cada una reproduce un fallo que se encontró y se
   arregló; la expectativa es la de la niña y la de la maestra. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, makeClockRead, makeTimeConvert } from '@/engine'
import { hintsClock, makeTimeDuration, statementClock } from '@/engine/clock'
import { genAngleTap, genQuadName } from '@/engine/geometry'
import { makeChart } from '@/engine/data'
import { solutionFor } from '@/engine/solution'
import { InkContext, useInk } from '@/ink/context'
import { moveMinuteHand } from '@/activities/views/Clock'
import ClockReadView from '@/activities/views/ClockReadView'
import TimeConvertView from '@/activities/views/TimeConvertView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

function OnTablet({ children }: { children: ReactNode }) {
  const ink = useInk()
  return <InkContext.Provider value={{ ...ink, mode: 'touch', isTouchDevice: true }}>{children}</InkContext.Provider>
}
/** Abre el teclado de números, teclea las cifras tal como se leen y pulsa «Comprobar». */
const typeAndCheck = (keys: string) => {
  fireEvent.click(screen.getAllByRole('button', { name: 'Usar el teclado de números' })[0])
  const pad = screen.getByRole('group', { name: 'Teclado de números' })
  for (const d of keys) fireEvent.click(within(pad).getByRole('button', { name: new RegExp(`^${d}$`) }))
  fireEvent.click(screen.getByRole('button', { name: /Comprobar/ }))
}

/** Ángulo interior (grados) de la esquina i de un triángulo. */
function cornerDeg(p: [number, number][], i: number): number {
  const n = p.length
  const a = p[(i - 1 + n) % n]
  const b = p[(i + 1) % n]
  const c = p[i]
  const v1 = [a[0] - c[0], a[1] - c[1]]
  const v2 = [b[0] - c[0], b[1] - c[1]]
  return (Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))) * 180) / Math.PI
}

describe('tiempo', () => {
  // FALLO (alta): con el teclado, la niña lee el reloj «1:30» y teclea 1, 3, 0. En un reloj de agujas no existe la
  // hora 13 (maxHour = 12), pero la casilla de la hora acepta el 3 como segunda cifra y la app guarda 13:00. Después le
  // dice «La hora está bien. Cuenta los minutos», cuando lo que ha escrito es correcto.
  it('leer el reloj: «1», «3», «0» con el teclado es 1:30, no 13:00', () => {
    const onAnswered = vi.fn()
    render(<OnTablet><ClockReadView exercise={makeClockRead(1, 30, 'write', createRng(4), 30)} onAnswered={onAnswered} showFeedback={false} allowHints /></OnTablet>)
    typeAndCheck('130')
    expect(onAnswered.mock.calls[0][0].check.given).toBe('1:30')
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  // FALLO (alta): lo mismo en el reloj de 24 horas: «las tres menos cuarto de la madrugada» es 02:45. La niña teclea
  // 2, 4, 5 y la app guarda 24:05 (¡la hora 24 no cabe en un reloj de 0 a 23!) y lo da por malo.
  it('reloj de 24 h: «2», «4», «5» con el teclado es 2:45, no 24:05', () => {
    const onAnswered = vi.fn()
    render(<OnTablet><TimeConvertView exercise={makeTimeConvert(2, 45, 'to-digital', createRng(4))} onAnswered={onAnswered} showFeedback={false} allowHints /></OnTablet>)
    typeAndCheck('245')
    expect(onAnswered.mock.calls[0][0].check.given).toBe('2:45')
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  // FALLO (media): la solución tras fallar dice «Por la mañana la hora se escribe igual» para horas que no son de la
  // mañana: «la una menos cuarto de la noche» (00:45, donde la hora NO se escribe igual: 12 → 00) y «la una menos
  // cuarto del mediodía» (12:45). Es falso o confuso.
  it('la solución de 24 h no dice «por la mañana» a las 00:45 ni a las 12:45', () => {
    for (const hour of [0, 12]) {
      const steps = solutionFor(makeTimeConvert(hour, 45, 'to-digital', createRng(1))).steps.join(' ')
      expect(steps).not.toMatch(/Por la mañana/)
    }
  })

  // FALLO (baja): la pista 3 y el enunciado de «¿a qué hora acaba?» dicen «Empieza a las la una y cuarto»
  // (clockPhrase ya lleva el artículo y se le antepone otro «las»).
  it('la pista de la duración no dice «a las la una»', () => {
    const ex = makeTimeDuration('end', { hour: 1, minute: 15 }, 30)
    const texts = [...(hintsClock(ex) ?? []).map((h) => h.text), statementClock(ex) ?? '']
    for (const t of texts) expect(t).not.toMatch(/las la una/)
  })

  // FALLO (baja): «las tres y media»: la niña pone la aguja corta en el 3 (a 88°, a simple vista encima del 3) y luego
  // la larga en el 6. La app le mueve la aguja corta a entre el 2 y el 3 y guarda 2:30, y al comprobar le dice que la
  // hora está mal. Con «y media» la aguja sobre el número queda justo en la frontera y decide un grado.
  it('poner el reloj: aguja corta en el 3 y larga en el 6 se queda en las tres y media', () => {
    expect(moveMinuteHand({ hour: 3, minute: 0 }, 30, 88)).toEqual({ hour: 3, minute: 30 })
  })
})

describe('geometría', () => {
  // FALLO (alta): «Toca las esquinas que son ángulos rectos»: unos 6-7 de cada 100 triángulos tienen una esquina que
  // NO es recta pero mide entre 82° y 98° (p. ej. 88°). A la vista es una esquina de papel; si la niña la toca, la app
  // le dice «Esa esquina no encaja con la de un papel». genTriAngles ya evita esto (|cos| ≥ 0,2); genAngleTap no.
  it('ninguna esquina no recta de los triángulos parece recta (a menos de 10° de 90°)', () => {
    const bad: string[] = []
    for (let seed = 0; seed < 3000; seed++) {
      const ex = genAngleTap(createRng(seed))
      if (ex.figure.points.length !== 3) continue
      for (let i = 0; i < 3; i++) {
        if (ex.rightCorners.includes(i)) continue
        const deg = cornerDeg(ex.figure.points, i)
        if (Math.abs(deg - 90) < 10) bad.push(`${ex.id} esquina ${i + 1}: ${deg.toFixed(1)}°`)
      }
    }
    expect(bad).toEqual([])
  })

  // FALLO (baja): «¿Qué cuadrilátero es?»: con diagonales 5 y 6, el rombo tiene esquinas de 80° y 100° y parece un
  // cuadrado girado; la niña que contesta «cuadrado» lo ve tal cual está dibujado. Mismo umbral que los triángulos.
  it('el rombo no parece un cuadrado (esquinas a más de 11,5° de 90°)', () => {
    const bad: string[] = []
    for (let seed = 0; seed < 2000; seed++) {
      const ex = genQuadName(createRng(seed))
      if (!ex.id.includes(':rombo:')) continue
      const pts = (ex.figures[0] as { points: [number, number][] }).points
      const deg = cornerDeg(pts, 0)
      if (Math.abs(deg - 90) < 11.5) bad.push(`${ex.id}: ${deg.toFixed(1)}°`)
    }
    expect(bad).toEqual([])
  })
})

describe('gráficos', () => {
  // FALLO (media): «¿Cuántos votos más tiene la fresa que la uva?» (5 y 3). La solución resuelta escribe «7 − 5 = 2»:
  // busca la primera pareja de valores cuya resta da 2 y usa la manzana (7), que no tiene nada que ver con la pregunta.
  it('la solución de «cuántos más» resta las dos barras de la pregunta', () => {
    const ex = makeChart('chart:bars', 'bars', 'La fruta favorita de la clase', 'votos', [
      { label: 'la manzana', emoji: '🍎', value: 7 }, { label: 'la fresa', emoji: '🍓', value: 5 }, { label: 'la uva', emoji: '🍇', value: 3 },
    ], 1, 'difference', [1, 2])
    expect(ex.question).toBe('¿Cuántos votos más tiene la fresa que la uva?')
    expect(solutionFor(ex).steps).toContain('5 − 3 = 2.')
  })
})
