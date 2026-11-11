/* Integrator-owned. Provider stack. */
import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useActiveChild } from '@/data'
import { InkProvider } from '@/ink'
import { applyAudioSettings, unlockAudio } from '@/audio'
import { SoundSwitch } from '@/audio/SoundSwitch'
import { ToastHost } from '@/ui'
import { AppRoutes } from './routes'
import { ChunkErrorBoundary } from './ChunkErrorBoundary'
import { UpdateWatcher } from './UpdateWatcher'
import { ScrollAssist } from './ScrollAssist'

/** The child's sound switch on every child screen: the notices «Activa el sonido» point to it. Not in the adult area. */
function ChildSoundSwitch() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/adult')) return null
  return <SoundSwitch floating />
}

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
      <UpdateWatcher />
      <AuthProvider>
        <ChildScopedProviders>
          <ChunkErrorBoundary>
            <AppRoutes />
          </ChunkErrorBoundary>
          <ScrollAssist />
          <ChildSoundSwitch />
          <ToastHost />
        </ChildScopedProviders>
      </AuthProvider>
    </BrowserRouter>
  )
}
