/* What the child gets after a node: stars (pop one by one), the crystal flying into Lumi's horn with its letter of
   VALIENTE (kind 'crystal'), new album stickers and the season celebration (kind 'season'). Shown over the map or
   the node screen; the continue button is the only way out so nothing vanishes unseen. */
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { celebrate } from '@/fx'
import { music, sfx } from '@/audio'
import { LumiHorn, Crystal, Sparkles, StarIcon } from '@/art'
import { getSticker, guardianForWorld, lettersOf, crystalsOf, season1 } from '@/content'
import { useActiveChild, useProgress } from '@/data'
import { Button } from '@/ui'
import type { ProgressState } from '@/types'
import type { RewardOverlayProps } from '@/world/contracts'
import { childText } from './childText'
import { worldHex } from './worldColors'
import s from './RewardOverlay.module.css'

const SLOTS = 8
const TITLE_ID = 'reward-overlay-title'

/** Crystals and letters as booleans / strings for the horn and the secret word. */
function horn(progress: ProgressState | undefined): boolean[] {
  return progress ? crystalsOf(progress) : Array.from({ length: SLOTS }, () => false)
}

export default function RewardOverlay({ kind, stars, world, letter, newStickers = [], onContinue }: RewardOverlayProps) {
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  const reduced = useReducedMotion() ?? false
  const idx = world.index - 1
  const crystalLetter = letter || guardianForWorld(world.id)?.letter || ''

  const [landed, setLanded] = useState(kind !== 'crystal' || reduced)
  const [starsShown, setStarsShown] = useState(reduced ? stars : 0)
  const crystalRef = useRef<HTMLDivElement>(null)
  const hornRef = useRef<HTMLDivElement>(null)
  const [dest, setDest] = useState<{ x: number; y: number } | null>(null)
  const word = season1.secretWord.toUpperCase()

  // Measure the flight once the layout is final (the card does not scale, so rects are true).
  useLayoutEffect(() => {
    if (kind !== 'crystal') return
    const a = crystalRef.current?.getBoundingClientRect()
    const b = hornRef.current?.getBoundingClientRect()
    if (a && b && a.width > 0 && b.width > 0) {
      setDest({ x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height * 0.3 - (a.top + a.height / 2) })
    }
  }, [kind])

  // Without a measurable layout (no flight possible) the crystal lands after a short pause.
  useEffect(() => {
    if (kind !== 'crystal' || reduced || dest) return
    const t = setTimeout(() => onLanded(), 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onLanded reads the latest landed flag via state
  }, [kind, reduced, dest])

  // Stars pop one by one; the result sound follows each pop.
  useLayoutEffect(() => {
    if (reduced) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i <= stars; i++) {
      timers.push(setTimeout(() => {
        setStarsShown(i)
        sfx.play('star')
      }, 350 + i * 320))
    }
    return () => timers.forEach(clearTimeout)
  }, [stars, reduced])

  // Celebrations per kind, once.
  useLayoutEffect(() => {
    if (kind === 'season') {
      music.play('celebration')
      sfx.play('fanfare')
      celebrate('chest')
    } else if (kind === 'node') {
      celebrate(stars >= 3 ? 'big' : stars > 0 ? 'stars' : 'small')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per overlay
  }, [])

  const onLanded = () => {
    if (landed) return
    setLanded(true)
    sfx.play('crystal')
    celebrate('crystal', { colors: [worldHex(world.id), '#fde68a'] })
  }

  // Horn: before the flight lands the new crystal is still missing from its socket.
  const known = horn(progress)
  const hornCrystals = known.map((v, i) => {
    if (kind === 'season') return true
    if (kind === 'crystal' && i === idx) return landed
    return v
  })

  // Secret word: letters already won, plus this world's letter once it lands.
  const won = progress ? lettersOf(progress) : []
  const letters = word.split('').map((ch, i) => {
    if (kind === 'season') return ch
    if (kind === 'crystal' && i === idx) return landed ? crystalLetter.toUpperCase() : null
    return won[i] ? ch : null
  })

  const title = (() => {
    if (kind === 'season') return childText(child, '¡Lumi brilla con todos sus colores, {child}!')
    if (kind === 'crystal') return childText(child, `¡El cristal ${world.crystalName} vuelve a brillar!`)
    if (stars >= 3) return childText(child, '¡Estrellas de oro, {child}!')
    if (stars >= 2) return childText(child, '¡Muy bien, {child}!')
    return childText(child, '¡Lo has conseguido, {child}!')
  })()

  const subtitle = (() => {
    if (kind === 'season') return 'Has encontrado los 8 cristales de Numeria.'
    if (kind === 'crystal') return childText(child, 'Lumi recupera un color de su cuerno.')
    return childText(child, world.name)
  })()

  const cardMotion = reduced
    ? { initial: false as const }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } }

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby={TITLE_ID} style={{ ['--reward' as string]: worldHex(world.id), ['--reward-soft' as string]: world.colorSoft }}>
      <div className={s.backdrop} aria-hidden />
      <motion.div className={s.sheet} {...cardMotion}>
        <h2 id={TITLE_ID} className={s.title}>{title}</h2>
        <p className={s.subtitle}>{subtitle}</p>

        {kind !== 'crystal' && kind !== 'season' && (
          <div className={s.stars} role="img" aria-label={childText(child, `Has conseguido ${stars} de 3 estrellas`)}>
            {[0, 1, 2].map((i) => (
              <StarIcon key={i} size={72} filled={reduced ? i < stars : i < starsShown} />
            ))}
          </div>
        )}

        {(kind === 'crystal' || kind === 'season') && (
          <div className={s.flight}>
            {kind === 'crystal' && (
              <motion.div
                ref={crystalRef}
                className={s.flyingCrystal}
                initial={false}
                animate={
                  !dest
                    ? { x: 0, y: 0, scale: 1, opacity: landed ? 0 : 1 }
                    : landed
                      ? { x: dest.x, y: dest.y, scale: 0.4, opacity: 0 }
                      : { x: dest.x, y: dest.y, scale: 0.4, opacity: 0.2 }
                }
                transition={landed ? { duration: 0.2 } : { delay: 1.1, duration: 0.9, ease: [0.5, 0, 0.75, 0] }}
                onAnimationComplete={() => { if (!landed && dest) onLanded() }}
              >
                <Crystal color={worldHex(world.id)} state="glow" size={112} label={`Cristal ${world.crystalName}`} />
              </motion.div>
            )}
            <div ref={hornRef} className={s.hornWrap}>
              <LumiHorn crystals={hornCrystals} size={kind === 'season' ? 220 : 170} animated={!reduced} />
              <Sparkles active={kind === 'season' || landed} color={worldHex(world.id)} count={kind === 'season' ? 14 : 8} />
            </div>
          </div>
        )}

        {(kind === 'crystal' || kind === 'season') && (
          <div className={s.word} role="img" aria-label={word}>
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                className={`${s.tile} ${ch ? s.tileFilled : ''}`}
                initial={false}
                animate={ch ? { scale: [0.4, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: reduced ? 0 : 0.5, delay: kind === 'season' ? i * 0.12 : 0, ease: 'easeOut' }}
              >
                {ch ?? ''}
              </motion.span>
            ))}
          </div>
        )}

        {kind === 'crystal' && crystalLetter && (
          <p className={s.letterNote}>
            {childText(child, `Has ganado la letra «${crystalLetter.toUpperCase()}» de VALIENTE.`)}
          </p>
        )}

        {newStickers.length > 0 && (
          <div className={s.stickers}>
            <p className={s.stickerTitle}>{childText(child, '¡Cromos nuevos en tu álbum!')}</p>
            <div className={s.stickerRow}>
              {newStickers.map((id, i) => {
                const st = getSticker(id)
                if (!st) return null
                return (
                  <motion.div
                    key={id}
                    className={s.sticker}
                    initial={reduced ? false : { scale: 0.3, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 0.9 + i * 0.25, type: 'spring', stiffness: 260, damping: 16 }}
                  >
                    <span className={s.stickerEmoji} aria-hidden>{st.emoji ?? '⭐'}</span>
                    <span className={s.stickerName}>{st.name}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        <Button size="lg" variant={kind === 'season' ? 'gold' : 'primary'} block onClick={onContinue} className={s.continue}>
          {childText(child, '¡Seguir!')}
        </Button>
      </motion.div>
    </div>
  )
}
