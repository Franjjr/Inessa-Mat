import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import App from '@/app/App'
import { markBuildHealthy, reloadForNewBuild } from '@/app/ChunkErrorBoundary'

// A preload of a chunk from an older build failed (the app was updated while this tab stayed open): reload once.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})
// Once this build has run for a while, a later deploy may reload again.
window.setTimeout(markBuildHealthy, 15_000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
