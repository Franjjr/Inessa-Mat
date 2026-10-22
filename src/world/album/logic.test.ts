import { describe, expect, it } from 'vitest'
import { initialProgress, stickers } from '@/content'
import { makeChild } from '@/world/rewards/testing'
import { albumPages, albumTotals, SPECIAL_PAGE_ID } from './logic'

describe('sticker album', () => {
  it('has one page per world plus the special page, with every sticker once', () => {
    const pages = albumPages(initialProgress('c'), makeChild())
    expect(pages.map((p) => p.id)).toEqual([...['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'], SPECIAL_PAGE_ID])
    const { total } = albumTotals(pages)
    expect(total).toBe(stickers.length)
  })

  it('locked stickers show how to earn them, owned ones count', () => {
    const progress = { ...initialProgress('c'), stickers: ['w1-seta'] }
    const pages = albumPages(progress, makeChild())
    const w1 = pages.find((p) => p.id === 'w1')!
    const seta = w1.stickers.find((s) => s.id === 'w1-seta')!
    const buho = w1.stickers.find((s) => s.id === 'w1-buho')!
    expect(seta.owned).toBe(true)
    expect(buho.owned).toBe(false)
    expect(buho.rule.length).toBeGreaterThan(0)
    expect(albumTotals(pages).owned).toBe(1)
  })
})
