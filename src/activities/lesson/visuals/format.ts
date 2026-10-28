/* Typography for numbers shown in lessons. A thousands group written with a plain space («4 325») may break across two
   lines on a phone; a no-break space keeps it together. Applied at render (visuals and the Lumi bubble), so the lesson
   texts keep their plain spaces. */

const NO_BREAK = ' '

/** Replaces the space between two digits with a no-break space: «4 325» becomes «4\u00a0325», other spaces stay. */
export function noBreakGroups(text: string): string {
  return text.replace(/(\d) (?=\d)/g, `$1${NO_BREAK}`)
}

/** A whole number with its thousands groups, e.g. 3400 → «3 400» (no-break), -20 → «−20» (true minus sign). */
export function formatNumber(n: number): string {
  const sign = n < 0 ? '−' : ''
  const digits = String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NO_BREAK)
  return sign + digits
}
