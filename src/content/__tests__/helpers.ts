/* Test helpers: walk every piece of child/adult-facing copy and every selector defined by the content module. */
import type { ActivityConfig, SkillSelector } from '@/types'
import { companions } from '../companions'
import { accessories } from '../accessories'
import { guardians } from '../guardians'
import { lessons } from '../lessons'
import { CHEST_TEXT, DIPLOMA_TEXT, SEASON2_TEASER, TEACH_BACK_ACTIVITY } from '../meta'
import { ERROR_PHRASES, PHRASES } from '../phrases'
import { season1 } from '../season'
import { stickers } from '../stickers'
import { stories } from '../stories'

export interface Copy {
  where: string
  text: string
  /** 'line' = story line (≤ 20 words), 'step' = lesson narration, 'ui' = titles/instructions/other copy. */
  type: 'line' | 'step' | 'ui'
}

export function allActivities(): { where: string; config: ActivityConfig }[] {
  const out: { where: string; config: ActivityConfig }[] = []
  for (const w of season1.worlds) for (const n of w.nodes) if (n.activity) out.push({ where: `${w.id}/${n.id}`, config: n.activity })
  out.push({ where: 'meta/teach-back', config: TEACH_BACK_ACTIVITY })
  return out
}

export function allSelectors(): { where: string; selector: SkillSelector; count: number }[] {
  const out: { where: string; selector: SkillSelector; count: number }[] = []
  for (const a of allActivities()) out.push({ where: a.where, selector: a.config.selector, count: a.config.count ?? 8 })
  for (const l of lessons) l.steps.forEach((s, i) => { if (s.trySelector) out.push({ where: `${l.id}#${i}`, selector: s.trySelector, count: 1 }) })
  for (const g of guardians) {
    g.rounds.forEach((r, i) => out.push({ where: `${g.id}/round${i}`, selector: r.selector, count: r.count }))
    if (g.spell.selector) out.push({ where: `${g.id}/spell`, selector: g.spell.selector, count: 1 })
  }
  return out
}

export function allCopy(): Copy[] {
  const out: Copy[] = []
  const ui = (where: string, text: string) => out.push({ where, text, type: 'ui' })
  ui('season/name', season1.name)
  for (const w of season1.worlds) {
    ui(`${w.id}/name`, w.name)
    ui(`${w.id}/hook`, w.hook)
    ui(`${w.id}/skillsSummary`, w.skillsSummary)
    for (const n of w.nodes) {
      ui(`${w.id}/${n.id}/title`, n.title)
      if (n.activity) {
        ui(`${w.id}/${n.id}/activity.title`, n.activity.title)
        ui(`${w.id}/${n.id}/activity.instructions`, n.activity.instructions)
        const specials = (n.activity.params?.specials ?? []) as { text: string }[]
        specials.forEach((s, i) => ui(`${w.id}/${n.id}/special${i}`, s.text))
      }
    }
  }
  for (const s of stories) {
    ui(`${s.id}/title`, s.title)
    s.scenes.forEach((sc, i) => sc.lines.forEach((l, j) => out.push({ where: `${s.id}/s${i}/l${j}`, text: l.text, type: 'line' })))
  }
  for (const l of lessons) {
    ui(`${l.id}/title`, l.title)
    l.steps.forEach((s, i) => out.push({ where: `${l.id}#${i}`, text: s.text, type: 'step' }))
  }
  for (const g of guardians) {
    ui(`${g.id}/title`, g.title)
    ui(`${g.id}/intro`, g.intro)
    ui(`${g.id}/spell`, g.spell.text)
    ui(`${g.id}/retry`, g.retryText)
  }
  for (const [k, list] of Object.entries(PHRASES)) list.forEach((p, i) => ui(`phrase/${k}/${i}`, p))
  for (const [k, list] of Object.entries(ERROR_PHRASES)) (list ?? []).forEach((p, i) => ui(`error-phrase/${k}/${i}`, p))
  for (const c of companions) ui(`companion/${c.species}/personality`, c.personality)
  for (const a of accessories) ui(`accessory/${a.id}`, a.name)
  for (const s of stickers) ui(`sticker/${s.id}`, s.name)
  ui('meta/teach-back/title', TEACH_BACK_ACTIVITY.title)
  ui('meta/teach-back/instructions', TEACH_BACK_ACTIVITY.instructions)
  for (const [k, v] of Object.entries(SEASON2_TEASER)) if (k !== 'id') ui(`meta/s2/${k}`, v)
  for (const [k, v] of Object.entries(DIPLOMA_TEXT)) ui(`meta/diploma/${k}`, v)
  for (const [k, v] of Object.entries(CHEST_TEXT)) ui(`meta/chest/${k}`, v)
  return out
}

/** Words as an early reader sees them: tokens with a letter, digit or placeholder (dashes/ellipses don't count). */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((t) => /[\p{L}\p{N}{]/u.test(t)).length
}
