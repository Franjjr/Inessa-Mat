/* Integrator-owned. Sets the browser tab / search title for a screen and restores the default when it unmounts. */
import { useEffect } from 'react'

export const DEFAULT_TITLE = 'Repasitos: el repaso diario de Primaria, en forma de aventura'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
