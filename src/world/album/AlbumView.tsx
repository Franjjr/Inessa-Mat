/* Sticker album, presentational: tabs per world, three sticker slots per page. Owned stickers show their picture;
   the rest are silhouettes with the way to get them. */
import { useState } from 'react'
import { Screen, TopBar } from '@/ui'
import type { AlbumPage } from './logic'
import s from './album.module.css'

export interface AlbumViewProps {
  pages: AlbumPage[]
  owned: number
  total: number
  /** Initial page id (defaults to the first page). */
  initialPage?: string
}

export function AlbumView({ pages, owned, total, initialPage }: AlbumViewProps) {
  const [current, setCurrent] = useState(initialPage ?? pages[0]?.id ?? '')
  const page = pages.find((p) => p.id === current) ?? pages[0]
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <TopBar back="/play" title="Álbum de cromos" />
      <div className={s.content}>
        <div className={s.summary}>
          <p className={s.count}>
            <strong>{owned}</strong> de {total} cromos
          </p>
          <div className={s.meter} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={owned} aria-label="Cromos conseguidos">
            <span className={s.meterFill} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={s.tabs} role="tablist" aria-label="Páginas del álbum">
          {pages.map((p) => {
            const got = p.stickers.filter((x) => x.owned).length
            const selected = p.id === page?.id
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`${s.tab} ${selected ? s.tabOn : ''}`}
                style={{ ['--tab' as string]: p.color, ['--tab-soft' as string]: p.soft }}
                onClick={() => setCurrent(p.id)}
              >
                <span className={s.tabTitle}>{p.title}</span>
                <span className={s.tabCount}>{got}/{p.stickers.length}</span>
              </button>
            )
          })}
        </div>

        {page && (
          <section
            className={s.page}
            role="tabpanel"
            aria-label={page.title}
            style={{ ['--tab' as string]: page.color, ['--tab-soft' as string]: page.soft }}
          >
            <div className={s.slots}>
              {page.stickers.map((st) =>
                st.owned ? (
                  <article key={st.id} className={s.sticker}>
                    <span className={s.stickerEmoji} aria-hidden>{st.emoji}</span>
                    <span className={s.stickerName}>{st.name}</span>
                    <span className={s.badge}>¡Conseguido!</span>
                  </article>
                ) : (
                  <article key={st.id} className={`${s.sticker} ${s.locked}`} aria-label={`Cromo por descubrir. ${st.rule}`}>
                    <span className={s.silhouette} aria-hidden>?</span>
                    <span className={s.lockedName}>Cromo misterioso</span>
                    <span className={s.rule}>{st.rule}</span>
                  </article>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </Screen>
  )
}
