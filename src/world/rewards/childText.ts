/* Child-facing copy for world-meta screens: every TemplateString goes through renderTemplate with the active
   child's context (or a neutral fallback when no child is loaded yet, e.g. in galleries). */
import { FALLBACK_CHILD_NAME, renderTemplate, templateContext } from '@/content'
import type { ChildProfile, TemplateString } from '@/types'

const FALLBACK_CONTEXT = {
  childName: FALLBACK_CHILD_NAME,
  childGender: 'n' as const,
  petName: 'tu compañero',
  petGender: 'n' as const,
  petSpecies: 'cat' as const,
}

/** Render a template for the given child (or the neutral fallback). Pure. */
export function childText(child: ChildProfile | null | undefined, text: TemplateString): string {
  return renderTemplate(text, child ? templateContext(child) : FALLBACK_CONTEXT)
}
