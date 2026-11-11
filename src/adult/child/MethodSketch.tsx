/* A small drawing of how a school method looks in the notebook, for the grown-ups: 52 − 27 pidiendo prestado or
   llevándose una, and 96 ÷ 4 in the galera with or without the subtractions. The sentence under the drawing (from the
   method registry) is always visible and is also the drawing's accessible name. */
import { DIV_METHODS, SUB_METHODS } from '@/engine'
import s from './MethodSketch.module.css'

export type SketchId = 'borrow' | 'carry' | 'galera' | 'galera-short'

const D = ({ x, y, children, small, accent }: { x: number; y: number; children: string; small?: boolean; accent?: boolean }) => (
  <text x={x} y={y} textAnchor="middle" className={`${small ? s.small : s.digit} ${accent ? s.accent : ''}`}>{children}</text>
)
const L = ({ x1, y1, x2, y2, accent }: { x1: number; y1: number; x2: number; y2: number; accent?: boolean }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} className={accent ? s.strike : s.rule} />
)

function Drawing({ id }: { id: SketchId }) {
  switch (id) {
    case 'borrow':
      return (
        <svg viewBox="0 0 110 122" className={s.svg} aria-hidden>
          <D x={50} y={18} small accent>4</D>
          <D x={50} y={46}>5</D>
          <L x1={40} y1={44} x2={60} y2={26} accent />
          <D x={71} y={40} small accent>1</D>
          <D x={82} y={46}>2</D>
          <D x={18} y={78}>−</D>
          <D x={50} y={78}>2</D>
          <D x={82} y={78}>7</D>
          <L x1={8} y1={88} x2={100} y2={88} />
          <D x={50} y={116}>2</D>
          <D x={82} y={116}>5</D>
        </svg>
      )
    case 'carry':
      return (
        <svg viewBox="0 0 110 122" className={s.svg} aria-hidden>
          <D x={50} y={46}>5</D>
          <D x={71} y={40} small accent>1</D>
          <D x={82} y={46}>2</D>
          <D x={18} y={78}>−</D>
          <D x={37} y={72} small accent>1</D>
          <D x={50} y={78}>2</D>
          <D x={82} y={78}>7</D>
          <L x1={8} y1={88} x2={100} y2={88} />
          <D x={50} y={116}>2</D>
          <D x={82} y={116}>5</D>
        </svg>
      )
    case 'galera':
      return (
        <svg viewBox="0 0 130 154" className={s.svg} aria-hidden>
          <D x={22} y={30}>9</D>
          <D x={44} y={30}>6</D>
          <L x1={58} y1={6} x2={58} y2={40} />
          <L x1={58} y1={40} x2={124} y2={40} />
          <D x={82} y={30}>4</D>
          <D x={78} y={66}>2</D>
          <D x={100} y={66}>4</D>
          <D x={8} y={60} accent>−</D>
          <D x={22} y={60} accent>8</D>
          <L x1={8} y1={68} x2={34} y2={68} />
          <D x={22} y={92}>1</D>
          <D x={44} y={92}>6</D>
          <D x={8} y={118} accent>−</D>
          <D x={22} y={118} accent>1</D>
          <D x={44} y={118} accent>6</D>
          <L x1={8} y1={126} x2={56} y2={126} />
          <D x={44} y={150}>0</D>
        </svg>
      )
    case 'galera-short':
      return (
        <svg viewBox="0 0 130 100" className={s.svg} aria-hidden>
          <D x={22} y={30}>9</D>
          <D x={44} y={30}>6</D>
          <L x1={58} y1={6} x2={58} y2={40} />
          <L x1={58} y1={40} x2={124} y2={40} />
          <D x={82} y={30}>4</D>
          <D x={78} y={66}>2</D>
          <D x={100} y={66}>4</D>
          <D x={22} y={62} accent>1</D>
          <D x={44} y={62}>6</D>
          <D x={44} y={94} accent>0</D>
        </svg>
      )
  }
}

export function sketchSentence(id: SketchId): string {
  return [...SUB_METHODS, ...DIV_METHODS].find((m) => m.id === id)?.notebook ?? ''
}

export function MethodSketch({ id, title }: { id: SketchId; title?: string }) {
  const sentence = sketchSentence(id)
  const example = [...SUB_METHODS, ...DIV_METHODS].find((m) => m.id === id)?.example ?? ''
  return (
    <figure className={s.figure} role="img" aria-label={`${title ? `${title}. ` : ''}${example}: ${sentence}`}>
      <Drawing id={id} />
      <figcaption className={s.caption} aria-hidden>
        {title && <strong className={s.title}>{title}</strong>}
        <span>{sentence}</span>
      </figcaption>
    </figure>
  )
}
