/* Dev-only component gallery: /dev/gallery?only=<path-substring>&entry=<title-substring>
   Every module can add files named `*.gallery.tsx` exporting `default: GalleryEntry[]`.
   Each file loads independently, so a broken module does not break the others. */
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface GalleryEntry {
  title: string
  render: () => ReactNode
  /** Optional fixed size for the frame (px). */
  width?: number
  height?: number
  background?: string
}

const modules = import.meta.glob<{ default: GalleryEntry[] }>('/src/**/*.gallery.tsx')

function GallerySection({ path, load, entry }: { path: string; load: () => Promise<{ default: GalleryEntry[] }>; entry: string | null }) {
  const [entries, setEntries] = useState<GalleryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    load().then((m) => setEntries(m.default)).catch((e) => setError(String(e)))
  }, [load])
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, color: 'var(--c-ink-mute)', margin: '8px 0' }}>{path}</h2>
      {error && <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {entries?.filter((e) => !entry || e.title.toLowerCase().includes(entry.toLowerCase())).map((e) => (
          <figure key={e.title} data-gallery={e.title} style={{ margin: 0, background: e.background ?? '#fff', borderRadius: 16, padding: 12, boxShadow: 'var(--shadow-1)', width: e.width, height: e.height, overflow: 'hidden', position: 'relative' }}>
            <Suspense fallback={<span>…</span>}>{e.render()}</Suspense>
            <figcaption style={{ fontSize: 12, color: 'var(--c-ink-mute)', marginTop: 6 }}>{e.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default function Gallery() {
  const [params] = useSearchParams()
  const only = params.get('only')
  const entry = params.get('entry')
  const paths = Object.keys(modules).filter((p) => !only || p.includes(only)).sort()
  return (
    <div className="scrollable" style={{ padding: 24, height: '100dvh' }}>
      <h1 style={{ marginBottom: 16 }}>Galería de componentes</h1>
      {paths.length === 0 && <p>No hay entradas{only ? ` para “${only}”` : ''}.</p>}
      {paths.map((p) => <GallerySection key={p} path={p} load={modules[p]} entry={entry} />)}
    </div>
  )
}
