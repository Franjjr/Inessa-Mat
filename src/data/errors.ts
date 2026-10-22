/* Errors thrown by '@/data'. `message` is Spanish, ready to show to an adult; `code` is for program logic. */

export type DataErrorCode =
  | 'no-backend'       // the app was built without Supabase keys
  | 'not-signed-in'
  | 'offline'
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'email-taken'
  | 'weak-password'
  | 'rate-limited'
  | 'no-account'
  | 'permission'
  | 'not-found'
  | 'invalid'
  | 'invalid-code'
  | 'conflict'
  | 'unknown'

export const MESSAGES: Record<DataErrorCode, string> = {
  'no-backend': 'Esta versión de la app funciona sin cuenta. Las cuentas y las clases no están disponibles.',
  'not-signed-in': 'Necesitas iniciar sesión para hacer esto.',
  offline: 'No hay conexión a internet. Inténtalo de nuevo cuando vuelvas a tener conexión.',
  'invalid-credentials': 'El correo o la contraseña no son correctos.',
  'email-not-confirmed': 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada (y la carpeta de spam).',
  'email-taken': 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.',
  'weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres, mezclando letras y números.',
  'rate-limited': 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  'no-account': 'No encontramos ninguna cuenta con ese correo.',
  permission: 'No tienes permiso para hacer esto.',
  'not-found': 'No lo hemos encontrado. Puede que se haya borrado.',
  invalid: 'Algún dato no es válido. Revísalo y vuelve a intentarlo.',
  'invalid-code': 'Ese código de clase no existe o ya no está activo. Revisa las letras con el profe.',
  conflict: 'Otro usuario ha cambiado esto a la vez. Vuelve a intentarlo.',
  unknown: 'Algo no ha ido bien. Vuelve a intentarlo dentro de un momento.',
}

export class DataError extends Error {
  readonly code: DataErrorCode
  readonly cause?: unknown

  constructor(code: DataErrorCode, message: string = MESSAGES[code], cause?: unknown) {
    super(message)
    this.name = 'DataError'
    this.code = code
    this.cause = cause
  }
}

interface ErrorLike {
  message?: string
  code?: string
  status?: number
  name?: string
}

/** True for errors that mean "the network is down / the request never reached the server". */
export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const err = (e ?? {}) as ErrorLike
  if (err.name === 'AuthRetryableFetchError') return true
  if (err.status === 0) return true
  const msg = String(err.message ?? '')
  return /failed to fetch|network ?error|load failed|networkrequestfailed|fetch failed|timeout|ECONNREFUSED|ENOTFOUND/i.test(msg) && !isPostgresCode(err.code)
}

function isPostgresCode(code: unknown): boolean {
  return typeof code === 'string' && (/^[0-9A-Z]{5}$/.test(code) || code.startsWith('PGRST'))
}

/** Maps a Supabase (auth or PostgREST) error to a DataError with a Spanish message. */
export function toDataError(e: unknown): DataError {
  if (e instanceof DataError) return e
  if (isNetworkError(e)) return new DataError('offline', undefined, e)
  const err = (e ?? {}) as ErrorLike
  const code = String(err.code ?? '')
  const msg = String(err.message ?? '')
  // Supabase Auth (error.code is set by GoTrue ≥ 2.x; older servers only send messages)
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return new DataError('invalid-credentials', undefined, e)
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return new DataError('email-not-confirmed', undefined, e)
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already exists/i.test(msg)) return new DataError('email-taken', undefined, e)
  if (code === 'weak_password' || err.name === 'AuthWeakPasswordError' || /password should be|weak password/i.test(msg)) return new DataError('weak-password', undefined, e)
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || err.status === 429 || /rate limit|too many/i.test(msg)) return new DataError('rate-limited', undefined, e)
  if (code === 'otp_disabled' || code === 'user_not_found' || /signups not allowed for otp|user not found/i.test(msg)) return new DataError('no-account', undefined, e)
  if (code === 'validation_failed' || /invalid email|unable to validate email/i.test(msg)) return new DataError('invalid', 'Ese correo no parece válido. Revísalo.', e)
  // PostgREST / Postgres
  if (code === '42501' || code === 'PGRST301' || err.status === 401 || err.status === 403) return new DataError('permission', undefined, e)
  if (code === '28000') return new DataError('not-signed-in', undefined, e)
  if (code === 'P0002' || code === 'PGRST116') return new DataError('not-found', undefined, e)
  if (code === '23505') return new DataError('conflict', undefined, e)
  if (code === '23514' || code === '22023' || code === '22P02' || code === '23502') return new DataError('invalid', undefined, e)
  if (code === 'P0001' && /too many/i.test(msg)) return new DataError('rate-limited', undefined, e)
  if (code === 'P0001' && /owner/i.test(msg)) return new DataError('invalid', 'Una familia o un colegio necesita al menos un responsable (propietario).', e)
  return new DataError('unknown', undefined, e)
}
