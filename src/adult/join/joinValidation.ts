/* Validation for the "join a class" form. Pure, so it is tested without React. */

/** Class codes are 6 letters or digits; spaces and dashes typed by the parent are ignored. */
export function cleanClassCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export interface JoinInput {
  code: string
  childId: string
  consent: boolean
}

export type JoinErrors = Partial<Record<'code' | 'childId' | 'consent', string>>

export function validateJoin(input: JoinInput): JoinErrors {
  const errors: JoinErrors = {}
  if (cleanClassCode(input.code).length !== 6) errors.code = 'El código de clase tiene 6 letras y números. Revísalo con el colegio si no funciona.'
  if (!input.childId) errors.childId = 'Elige el perfil que va a unirse a la clase.'
  if (!input.consent) errors.consent = 'Para unirlo a la clase necesitamos que leas y aceptes el consentimiento.'
  return errors
}

/** The consent sentence, shown and accepted by the adult before the child is linked. */
export function consentText(childName: string, className: string | null): string {
  const clase = className ? `de la clase «${className}»` : 'de la clase con este código'
  return `Doy mi consentimiento para que el profesorado ${clase} vea el progreso de ${childName} en matemáticas (tablas, sumas, restas, multiplicaciones y divisiones) y le pueda asignar prácticas. Sé que puedo pedir al colegio que retire a ${childName} de la clase en cualquier momento.`
}
