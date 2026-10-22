import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChunkErrorBoundary, isChunkLoadError, markBuildHealthy } from './ChunkErrorBoundary'

function Boom({ error }: { error: Error }): never {
  throw error
}

describe('ChunkErrorBoundary', () => {
  const reload = vi.fn()
  const original = window.location
  afterEach(() => {
    markBuildHealthy()
    reload.mockReset()
    Object.defineProperty(window, 'location', { value: original, configurable: true })
  })
  const stubReload = () => Object.defineProperty(window, 'location', { value: { ...original, reload }, configurable: true })

  it('recognises stale-chunk errors from Chrome, Safari and Firefox', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/Shop-abc.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
  })

  it('reloads once for a stale chunk, then shows the retry card instead of looping', () => {
    stubReload()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new TypeError('Failed to fetch dynamically imported module: /assets/Shop-abc.js')
    const first = render(<ChunkErrorBoundary><Boom error={err} /></ChunkErrorBoundary>)
    expect(reload).toHaveBeenCalledTimes(1)
    first.unmount()
    render(<ChunkErrorBoundary><Boom error={err} /></ChunkErrorBoundary>)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Volver a cargar')
  })

  it('does not reload for ordinary render errors', () => {
    stubReload()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ChunkErrorBoundary><Boom error={new Error('bug')} /></ChunkErrorBoundary>)
    expect(reload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
