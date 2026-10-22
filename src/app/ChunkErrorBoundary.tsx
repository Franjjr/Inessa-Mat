/* Integrator-owned. After a deploy, a tab that stayed open still runs the old bundle; its lazy route chunks are gone
   from the server and the service-worker cache, so the dynamic import fails. Reload once to pick up the new build
   instead of leaving a blank screen. Other render errors show a friendly retry card. */
import { Component, type ReactNode } from 'react'

const RELOAD_KEY = 'numeria:chunk-reload'
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return CHUNK_ERROR.test(message)
}

/** Reloads the page once per session for a stale-chunk failure. Returns false when it already tried. */
export function reloadForNewBuild(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // Storage blocked: still reload once; the worst case is one extra reload.
  }
  window.location.reload()
  return true
}

/** Clears the once-per-session guard after the app has loaded fine, so a later deploy can reload again. */
export function markBuildHealthy(): void {
  try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* ignore */ }
}

interface State { error: unknown }

export class ChunkErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) reloadForNewBuild()
  }

  render() {
    if (this.state.error === null) return this.props.children
    return (
      <div role="alert" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', marginBottom: 16 }}>
            ¡Uy! Algo se ha enredado.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ minHeight: 'var(--tap-min)', padding: '0 24px', borderRadius: 999, border: 0, background: 'var(--c-primary)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)' }}
          >
            Volver a cargar
          </button>
        </div>
      </div>
    )
  }
}
