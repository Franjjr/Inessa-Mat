/* Small inline icons for the ink controls (stroke = currentColor, so they follow the button colour). */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 28, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...rest,
  }
}

export function CheckIcon(p: IconProps) {
  return <svg {...base(p)}><path d="M4.5 12.8l4.6 4.6L19.5 7" /></svg>
}

export function BackspaceIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8.5 5h10.5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8.5L2.8 12z" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </svg>
  )
}

/** A school eraser ("goma"). */
export function EraserIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14.2 4.6l5.2 5.2a1.6 1.6 0 0 1 0 2.3l-7.3 7.3H7.6l-3-3a1.6 1.6 0 0 1 0-2.3l9.3-9.5a1.6 1.6 0 0 1 2.3 0z" />
      <path d="M9.4 9.8l5.3 5.3M12 19.4h8" />
    </svg>
  )
}

export function KeypadIcon(p: IconProps) {
  return (
    <svg {...base({ strokeWidth: 0, ...p })} fill="currentColor">
      {[5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.3} />))}
    </svg>
  )
}

export function PencilIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20l1.2-4.6L15.8 4.8a2.1 2.1 0 0 1 3 0l.4.4a2.1 2.1 0 0 1 0 3L8.6 18.8z" />
      <path d="M13.8 6.8l3.4 3.4" />
    </svg>
  )
}

export function CloseIcon(p: IconProps) {
  return <svg {...base(p)}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
}

export function PlayIcon(p: IconProps) {
  return <svg {...base({ strokeWidth: 0, ...p })} fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z" /></svg>
}

export function RedoIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4 4.5v4h4" />
    </svg>
  )
}
