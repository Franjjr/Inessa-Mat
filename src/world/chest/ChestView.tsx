/* The Gran Cofre, presentational. Locked: the crystals and the word with its blanks. Open: the lid lifts, the
   letters assemble into VALIENTE and the adult's real prize appears. */
import { useEffect, useRef } from 'react'
import { ChestArt, Crystal, StarIcon } from '@/art'
import { celebrate } from '@/fx'
import { sfx } from '@/audio'
import { Button, Card, Screen, TopBar } from '@/ui'
import { worldHex } from '@/world/rewards/worldColors'
import { season1 } from '@/content'
import type { ChestState } from './logic'
import s from './chest.module.css'

export interface ChestViewProps {
  state: ChestState
  /** The adult's prize (null while nobody set one). */
  reward: { title: string; description?: string | null; claimed: boolean } | null
  /** Child-facing text already rendered (locked / open copy). */
  lockedText: string
  openText: string
  childName: string
  diplomaReady: boolean
  onClaim?: () => void
  onDiploma?: () => void
}

export function ChestView({ state, reward, lockedText, openText, childName, diplomaReady, onClaim, onDiploma }: ChestViewProps) {
  const { open, collected, total, letters, word } = state
  const celebrated = useRef(false)

  useEffect(() => {
    if (!open || celebrated.current) return
    celebrated.current = true
    sfx.play('chest-open')
    celebrate('chest')
  }, [open])

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <TopBar back="/play" title="El Gran Cofre" />
      <div className={s.stage}>
        <div className={s.chestWrap}>
          <ChestArt open={open} size={open ? 200 : 190} label="El Gran Cofre" />
        </div>

        {!open && (
          <>
            <div className={s.crystals} aria-label={`${collected} de ${total} cristales`}>
              {season1.worlds.map((w) => {
                const got = letters[w.index - 1] !== null
                return (
                  <span key={w.id} className={s.crystalSlot} title={w.crystalName}>
                    <Crystal color={worldHex(w.id)} state={got ? 'collected' : 'locked'} size={44} label={`Cristal ${w.crystalName}`} />
                  </span>
                )
              })}
            </div>
            <p className={s.lead}>{lockedText}</p>
          </>
        )}

        <WordRow word={word} letters={letters} revealed={open} />

        {open ? (
          <>
            <p className={s.lead}>{openText}</p>
            {reward ? (
              <Card className={s.prize}>
                <p className={s.prizeKicker}>
                  <StarIcon size={28} filled /> Tu premio, {childName}
                </p>
                <h2 className={s.prizeTitle}>{reward.title}</h2>
                {reward.description ? <p className={s.prizeText}>{reward.description}</p> : null}
                {reward.claimed ? (
                  <p className={s.claimed}>¡Ya lo tienes! Disfrútalo mucho.</p>
                ) : onClaim ? (
                  <Button variant="gold" size="lg" onClick={onClaim}>¡Ya tengo mi premio!</Button>
                ) : null}
              </Card>
            ) : (
              <p className={s.lead}>Tu familia está preparando una sorpresa especial.</p>
            )}
            {diplomaReady && onDiploma && (
              <Button variant="magic" onClick={onDiploma}>Ver mi diploma</Button>
            )}
          </>
        ) : (
          <p className={s.hint}>{`Gana los ${state.total} cristales para completar la palabra ${word}.`}</p>
        )}
      </div>
    </Screen>
  )
}

function WordRow({ word, letters, revealed }: { word: string; letters: (string | null)[]; revealed: boolean }) {
  const chars = word.split('')
  return (
    <div className={s.word} role="img" aria-label={`Palabra secreta: ${word}`}>
      {chars.map((ch, i) => {
        const got = revealed || Boolean(letters[i])
        return (
          <span
            key={i}
            className={`${s.tile} ${got ? s.tileOn : ''}`}
            style={{ animationDelay: revealed ? `${0.25 + i * 0.12}s` : undefined }}
            data-revealed={got ? 'true' : 'false'}
          >
            {got ? ch : '?'}
          </span>
        )
      })}
    </div>
  )
}

