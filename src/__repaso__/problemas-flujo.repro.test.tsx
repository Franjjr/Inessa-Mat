/* Repaso de problemas, soluciones, voz y flujo de responder (noviembre de 2026): pruebas de regresión. Cada una reproduce un fallo que se encontró y se
   arregló; la expectativa es la de la niña y la de la maestra. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CheckCalcExercise, ErrorHuntExercise, WordProblemExercise } from '@/types'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import WordProblemView from '@/activities/views/WordProblemView'
import TrySlot from '@/activities/lesson/TrySlot'
import { solutionFor } from '@/engine/solution'
import { statementFor } from '@/engine/statement'
import { FOUR_WAYS_TRIES } from '@/content/lessons/w4'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn(), tap: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const banderines: WordProblemExercise = {
  id: 'word-problem:sub-banderines:452,187', kind: 'word-problem', skill: 'word:sub' as WordProblemExercise['skill'], difficulty: 3,
  text: 'La Reina Aurora quiere colgar 452 banderines en el castillo. Ya ha colgado 187. ¿Cuántos le faltan por colgar?',
  op: 'sub', operands: [452, 187], answer: 265, unit: 'banderines',
}
const setas: WordProblemExercise = {
  id: 'word-problem:mul-setas:4,5', kind: 'word-problem', skill: 'word:mul' as WordProblemExercise['skill'], difficulty: 2,
  text: '{pet} ha encontrado 4 cestas con 5 setas en cada una. ¿Cuántas setas hay en total?', op: 'mul', operands: [4, 5], answer: 20, unit: 'setas',
}
const checkBtn = () => screen.getAllByRole('button', { name: /Comprobar/ }).filter((b) => !/_key_/.test(b.className))[0]

/** Datos y planteamiento bien hechos: se llega a la resta en casillas. */
async function toCalc(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Quiere colgar' }), '452')
  await user.type(screen.getByRole('textbox', { name: 'Ya ha colgado' }), '187')
  await user.click(screen.getByRole('button', { name: /Comprobar/ }))
  await user.click(screen.getByRole('button', { name: /Quitar/ }))
  await user.click(screen.getByRole('button', { name: /Comprobar/ }))
  await screen.findByRole('region', { name: 'Operación en columna' })
}

describe('Problemas (WordProblemView)', () => {
  /* ERA UN FALLO (media): en un problema, una resta en casillas A MEDIAS (la niña aún no ha escrito la cifra de las centenas:
     «?65») llega a la historia como la respuesta «65» y se califica como una cuenta mal hecha (errorType 'fact',
     «La idea es buena: escribe la operación y revísala»). Cuenta como un intento fallado, el reintento vuelve con 65 en
     la casilla y el mensaje no le dice que le falta una cifra. Causa: answerFromCalc (WordProblemView.tsx:72-84) junta
     las cifras de check.given quitando los «?» y no respeta el errorType 'incomplete' de la cuenta. */
  it('una cuenta en casillas sin terminar no se califica como «65», sino como incompleta', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={banderines} onAnswered={onAnswered} showFeedback={false} />)
    await toCalc(user)
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^unidades del resultado/ }), { key: '5' })
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^decenas del resultado/ }), { key: '6' })
    await user.click(checkBtn())
    await waitFor(() => expect(onAnswered).toHaveBeenCalled())
    const check = onAnswered.mock.calls[0][0].check
    expect(check.given).not.toBe('65')
    expect(check.errorType).toBe('incomplete')
  })

  /* ERA UN FALLO (media, atasco): tras fallar la resta en casillas, «Inténtalo otra vez» (sesión diaria y lecciones) trae el
     problema SIN las casillas: solo la caja del resultado. Para corregir 452 − 187 con dos préstamos tiene que hacerlo de
     cabeza; no hay ningún enlace para volver a la cuenta. Causa: WordProblemView.tsx:140, la etapa inicial de un
     reintento es `calc && !before && !beforeDiv ? 'calc' : 'head'`, que en un reintento siempre da 'head'. */
  it('el reintento de un problema con cuenta en casillas vuelve a ofrecer las casillas', () => {
    render(<WordProblemView exercise={banderines} onAnswered={vi.fn()} showFeedback={false} initialAnswer={{ type: 'number', value: 375 }} />)
    expect(screen.queryByRole('region', { name: 'Operación en columna' })).not.toBeNull()
  })

  /* ERA UN FALLO (media): en la actividad «Problemas» (activities/word, showFeedback), tras una respuesta mala el botón
     «Revisar» queda desactivado aunque la niña escriba la respuesta buena (20). No puede corregir, y como no llega a un
     segundo intento fallado, la AnswerBar nunca enseña la solución («Así se resuelve» sale con 2 fallos): solo le queda
     «Siguiente». Causa: WordProblemView.tsx:238, canCheck = `readyToCheck && !flow.result`. */
  it('con la corrección en pantalla, tras fallar se puede «Revisar» con la respuesta nueva', async () => {
    const user = userEvent.setup()
    render(<WordProblemView exercise={setas} onAnswered={vi.fn()} showFeedback />)
    await user.type(screen.getByRole('textbox', { name: 'Cestas' }), '4')
    await user.type(screen.getByRole('textbox', { name: 'Setas en cada cesta' }), '5')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Repetir/ }))
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    const box = screen.getByRole('textbox', { name: 'Respuesta' })
    await user.type(box, '24{Enter}')
    await user.type(box, '{Backspace}{Backspace}20')
    const revisar = screen.getByRole('button', { name: /Revisar/ }) as HTMLButtonElement
    expect(revisar.disabled).toBe(false)
  })
})

describe('Soluciones con el método del colegio', () => {
  /* ERA UN FALLO (media): «Encuentra el error» de una resta: si el adulto eligió «Me llevo una abajo», la solución tras fallar
     explica la cuenta con «pido 1 decena a la vecina… el 5 se queda en 4» (pedir prestado), el método que NO usa su
     colegio. Causa: solution.ts:292-295 y 633, huntSolution llama siempre a columnSubSteps y solutionFor no le pasa opts. */
  it('la solución de «Encuentra el error» en una resta sigue «Me llevo una» si es el método elegido', () => {
    const ex: ErrorHuntExercise = {
      id: 'error-hunt:sub:352−127=235', kind: 'error-hunt', skill: 'hunt:sub' as ErrorHuntExercise['skill'], difficulty: 3,
      op: 'sub', top: 352, bottom: 127, shown: 235, answer: 225, wrongColumn: 1, errorType: 'borrow-forgot',
    }
    const text = solutionFor(ex, { subMethod: 'carry' }).steps.join(' ')
    expect(text).not.toMatch(/vecina/)
    expect(text).toMatch(/me llevo/i)
  })

  /* ERA UN FALLO (media): en las lecciones, la prueba de restar ignora el método que eligió el adulto. «Dos formas de restar del
     cole» dice que su prueba usa la forma del cole (ChildSettings.subMethod), pero con «Me llevo una» la solución que se
     enseña tras «No lo sé» (y la cuenta en casillas y las pistas) es «pedir prestado a la vecina». Causa: TrySlot.tsx:173
     y 350 usan solo el `method` del paso (undefined) y nunca host.prefs.subMethod / divMethod. */
  it('la solución de una prueba de lección sigue el método de resta del adulto', async () => {
    const user = userEvent.setup()
    const host = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, subMethod: 'carry' as const } }
    render(
      <ActivityHostProvider value={host}>
        <TrySlot selector={{ kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false, operands: FOUR_WAYS_TRIES }} seedKey="repaso-metodo" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'No lo sé' }))
    const panel = await screen.findByTestId('solution-panel')
    expect(panel.textContent).not.toMatch(/vecina/)
    expect(panel.textContent).toMatch(/me llevo/i)
  })
})

describe('Voz', () => {
  /* ERA UN FALLO (baja): «Comprobar» una división con resto 1: la voz lee «Dani dice que 25 ÷ 4 = 6 y sobran uno»; tiene que
     decir «y sobra 1». Causa: statement.ts:80, `y sobran ${ex.remainder}` sin singular. */
  it('el enunciado de «Comprobar» con resto 1 dice «sobra 1»', () => {
    const ex: CheckCalcExercise = {
      id: 'check-calc:div:25/4=6r1', kind: 'check-calc', skill: 'check:div' as CheckCalcExercise['skill'], difficulty: 3,
      op: 'div', left: 25, right: 4, claimed: 6, remainder: 1, answer: 25, ok: true, errorType: null,
    }
    expect(statementFor(ex)).toMatch(/y sobra 1\b/)
  })
})
