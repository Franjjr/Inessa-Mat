import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import App from '@/app/App'
import { markBuildHealthy, reloadForNewBuild } from '@/app/ChunkErrorBoundary'
import { handleForceUpdateLink } from '@/app/version'
import { requestPersistentStorage } from '@/data'

// A preload of a chunk from an older build failed (the app was updated while this tab stayed open): reload once.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})
// Once this build has run for a while, a later deploy may reload again.
window.setTimeout(markBuildHealthy, 15_000)

// A child without an account lives only in this browser: ask it to keep the data (never throws, see src/data/storage.ts).
void requestPersistentStorage()

// Support link «?actualizar=1»: wipe the service worker and its cache, then reload the latest build.
if (!handleForceUpdateLink()) createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
