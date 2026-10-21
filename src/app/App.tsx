/* Integrator-owned. Provider stack. */
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useActiveChild } from '@/data'
import { InkProvider } from '@/ink'
import { applyAudioSettings, unlockAudio } from '@/audio'
import { ToastHost } from '@/ui'
import { AppRoutes } from './routes'

/** Keeps audio settings and the handwriting recogniser in sync with the active child. */
function ChildScopedProviders({ children }: { children: React.ReactNode }) {
  const { child } = useActiveChild()
  useEffect(() => {
    if (child) applyAudioSettings(child.settings)
  }, [child])
  return <InkProvider childId={child?.id ?? null}>{children}</InkProvider>
}

export default function App() {
  useEffect(() => {
    // iOS Safari only allows audio after a user gesture.
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildScopedProviders>
          <AppRoutes />
          <ToastHost />
        </ChildScopedProviders>
      </AuthProvider>
    </BrowserRouter>
  )
}
