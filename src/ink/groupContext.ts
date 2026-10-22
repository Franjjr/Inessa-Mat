/* Context between <CellGroup> and the <DigitCell>s inside it (focus order, auto-advance, Enter, keypad). */
import { createContext, useContext } from 'react'
import type { Direction } from './order'

export interface CellEntry {
  el: HTMLElement
  cellId?: string
  focusable(): boolean
  focus(): void
  input(d: number, via: 'keyboard' | 'keypad'): void
  clear(): void
  isEmpty(): boolean
  /** Recognise pending ink right now (before submitting). Returns true when something was flushed. */
  flush(): boolean
}

export interface CellGroupApi {
  register(uid: string, entry: CellEntry): () => void
  currentId: string | null
  setCurrent(uid: string): void
  /** A digit was typed into `uid`: move to the next cell in the group's order. */
  afterInput(uid: string): void
  move(uid: string, dir: Direction): void
  /** Tab / Shift+Tab inside the group. Returns false at the ends so focus can leave the group. */
  tab(uid: string, backward: boolean): boolean
  /** Backspace on an empty cell: go to the previous cell and clear it. */
  back(uid: string): void
  submit(): void
  /** The group shows an on-screen keypad right now (cells skip their own digit picker). */
  keypadVisible: boolean
}

export const CellGroupContext = createContext<CellGroupApi | null>(null)

export function useCellGroup(): CellGroupApi | null {
  return useContext(CellGroupContext)
}
