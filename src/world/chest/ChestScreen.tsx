/* Route /play/chest: the Gran Cofre. Locked until all 8 crystals are won. When it opens, the adult's chest reward
   is marked unlocked (once) and the progress records chestOpened; the child can then mark the prize as received. */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHEST_TEXT } from '@/content'
import {
  getRewards, markRewardClaimed, markRewardUnlocked, updateProgress, useActiveChild, useProgress,
} from '@/data'
import { Spinner, toast } from '@/ui'
import type { Reward } from '@/types'
import { childText } from '@/world/rewards/childText'
import { ChestView } from './ChestView'
import { chestReward, chestState } from './logic'

export default function ChestScreen() {
  const navigate = useNavigate()
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  const [rewards, setRewards] = useState<Reward[] | null>(null)
  const recorded = useRef(false)

  const childId = child?.id
  useEffect(() => {
    if (!childId) return
    let alive = true
    getRewards(childId)
      .then((list) => alive && setRewards(list))
      .catch(() => alive && setRewards([]))
    return () => {
      alive = false
    }
  }, [childId])

  const state = progress ? chestState(progress) : null
  const reward = rewards ? chestReward(rewards) : null

  // Opening the chest: mark the adult's prize as unlocked and remember the chest was opened, once each.
  useEffect(() => {
    // Wait for the rewards to load: the prize has to be known before it can be marked as unlocked.
    if (!childId || !state?.open || rewards === null || recorded.current) return
    recorded.current = true
    void (async () => {
      try {
        if (reward && !reward.unlockedAt) {
          await markRewardUnlocked(reward.id)
          setRewards(await getRewards(childId))
        }
        if (progress && !progress.chestOpened) {
          await updateProgress(childId, (p) => ({ ...p, chestOpened: true }))
        }
      } catch {
        toast('No hemos podido guardar la apertura del cofre. Se intentará de nuevo.')
        recorded.current = false
      }
    })()
  }, [childId, state?.open, rewards, reward, progress])

  if (!child || !progress || !state || rewards === null) {
    return <Spinner label="Abriendo el cofre…" />
  }

  const claim = async () => {
    if (!reward || reward.claimedAt) return
    try {
      await markRewardClaimed(reward.id)
      setRewards(await getRewards(child.id))
      toast('¡Disfrútalo mucho!')
    } catch {
      toast('No hemos podido guardarlo. Prueba otra vez.')
    }
  }

  return (
    <ChestView
      state={state}
      reward={reward ? { title: reward.title, description: reward.description, claimed: Boolean(reward.claimedAt) } : null}
      lockedText={childText(child, CHEST_TEXT.locked)}
      openText={childText(child, CHEST_TEXT.open)}
      childName={childText(child, '{child}')}
      diplomaReady={Boolean(progress.diplomaEarnedAt)}
      onClaim={reward && !reward.claimedAt ? claim : undefined}
      onDiploma={() => navigate('/play/diploma')}
    />
  )
}
