/* Dev gallery of the fraction and geometry views (block E). Open /dev/gallery?only=fractions (entries listed by title).
   Each entry uses a fixed seed, so the same figures come back on every reload. */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import {
  createRng, genAngleTap, genAngleType, genCircle, genFractionCompare, genFractionEqual, genFractionName, genFractionOf,
  genFractionRead, genFractionShade, genLineRelation, genLineType, genPerimeter, genPolygonName, genPolygonSides, genSolidFaces,
  genSolidName, genSolidRoll,
} from '@/engine'
import AngleTapView from './AngleTapView'
import FigureNumberView from './FigureNumberView'
import FractionEqualView from './FractionEqualView'
import FractionOfView from './FractionOfView'
import FractionReadView from './FractionReadView'
import FractionShadeView from './FractionShadeView'
import ShapeChoiceView from './ShapeChoiceView'

const noop = () => {}
const ipad = { width: 1180, height: 820 }
const phone = { width: 390, height: 844 }
const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>

const entries: GalleryEntry[] = [
  { title: 'Fracciones · colorear las partes (ipad)', ...ipad, render: () => frame(<FractionShadeView exercise={genFractionShade(createRng(4), 4)} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · leer la fracción (ipad)', ...ipad, render: () => frame(<FractionReadView exercise={genFractionRead(createRng(8), 6)} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · cómo se dice (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genFractionName(createRng(3), 3)} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · ¿cuál es mayor? (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genFractionCompare(createRng(21))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · ¼ de 20 con objetos (ipad)', ...ipad, render: () => frame(<FractionOfView exercise={genFractionOf(createRng(5), 4, 'drawing', '🍬')} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · ¼ de 20 con números (ipad)', ...ipad, render: () => frame(<FractionOfView exercise={genFractionOf(createRng(12), 4, 'numbers', '🌸')} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · figuras que no son iguales (ipad)', ...ipad, render: () => frame(<FractionEqualView exercise={genFractionEqual(createRng(9))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · nombre del polígono (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genPolygonName(createRng(6))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · lados y esquinas (ipad)', ...ipad, render: () => frame(<FigureNumberView exercise={genPolygonSides(createRng(14))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · tipo de línea (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genLineType(createRng(2))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · paralelas o perpendiculares (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genLineRelation(createRng(7))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · recto, menor o mayor (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genAngleType(createRng(11))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · ángulos rectos de una figura (ipad)', ...ipad, render: () => frame(<AngleTapView exercise={genAngleTap(createRng(7))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · círculo o circunferencia (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genCircle(createRng(3))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · nombre del cuerpo (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genSolidName(createRng(5))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · ¿rueda? (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genSolidRoll(createRng(17))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · caras planas (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={genSolidFaces(createRng(19))} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · perímetro con las medidas (ipad)', ...ipad, render: () => frame(<FigureNumberView exercise={genPerimeter(createRng(10), 'drawing')} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · perímetro: el jardín (ipad)', ...ipad, render: () => frame(<FigureNumberView exercise={genPerimeter(createRng(11), 'story')} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Fracciones · colorear (teléfono)', ...phone, render: () => frame(<FractionShadeView exercise={genFractionShade(createRng(4), 8)} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Geometría · ángulos rectos (teléfono)', ...phone, render: () => frame(<AngleTapView exercise={genAngleTap(createRng(7))} onAnswered={noop} showFeedback allowHints />) },
]

export default entries
