/* Form validation for sign-up, sign-in and the adult PIN. Pure, so it is unit-tested without React. */
import type { OrgKind } from '@/types'

export const MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Escribe tu correo electrónico.'
  if (!isValidEmail(value)) return 'Ese correo no parece válido. Revísalo, por favor.'
  return null
}

/** Sign-up password: at least 8 characters, with letters and numbers (as the adult copy says). */
export function validateNewPassword(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH) return `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value) || !/\d/.test(value)) return 'Mezcla letras y números para que sea más segura.'
  return null
}

export interface SignupInput {
  displayName: string
  email: string
  password: string
  confirm: string
  orgKind: OrgKind | null
  orgName: string
  acceptedPrivacy: boolean
}

export type SignupErrors = Partial<Record<keyof SignupInput, string>>

export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {}
  const name = input.displayName.trim()
  if (!name) errors.displayName = 'Escribe tu nombre.'
  else if (name.length > 80) errors.displayName = 'Tu nombre es demasiado largo (máximo 80 letras).'

  const emailError = validateEmail(input.email)
  if (emailError) errors.email = emailError

  const passwordError = validateNewPassword(input.password)
  if (passwordError) errors.password = passwordError
  else if (input.confirm !== input.password) errors.confirm = 'Las contraseñas no coinciden.'

  if (!input.orgKind) errors.orgKind = 'Elige si lo usarás en familia o en colegio.'
  if (!input.orgName.trim()) {
    errors.orgName = input.orgKind === 'school' ? 'Escribe el nombre del colegio.' : 'Escribe un nombre para tu familia.'
  }
  if (!input.acceptedPrivacy) errors.acceptedPrivacy = 'Para crear la cuenta, lee y acepta la política de privacidad.'
  return errors
}

export function validateLogin(email: string, password: string): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  if (!password) errors.password = 'Escribe tu contraseña.'
  return errors
}

/** The adult PIN: 4 to 8 digits. */
export function validatePin(pin: string): string | null {
  return /^\d{4,8}$/.test(pin) ? null : 'El PIN debe tener entre 4 y 8 números.'
}
