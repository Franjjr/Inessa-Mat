/* Turns anything thrown by '@/data' into a Spanish sentence an adult can read. */

const FALLBACK = 'Algo no ha ido bien. Inténtalo de nuevo dentro de un momento.'

/** DataError carries a Spanish `message`; other errors get the fallback. Checked by name so mocks stay simple. */
export function errorMessage(e: unknown, fallback: string = FALLBACK): string {
  if (e instanceof Error && e.name === 'DataError' && e.message) return e.message
  return fallback
}
