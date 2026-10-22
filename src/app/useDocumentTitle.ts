/* Integrator-owned. Sets the browser tab / search title for a screen and restores the default when it unmounts. */
import { useEffect } from 'react'

export const DEFAULT_TITLE = 'Repasitos: repasar tablas y operaciones de 7 a 9 años'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
