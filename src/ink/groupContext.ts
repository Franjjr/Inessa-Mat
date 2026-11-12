/* Context between <CellGroup> and the <DigitCell>s inside it (focus order, auto-advance, Enter, keypad). */
import { createContext, useContext } from 'react'
import type { Direction } from './order'

export interface CellEntry {
  el: HTMLElement
  cellId?: string
  /** Cells of one number share it (see DigitCell `numberId`). */
  numberId?: string
  /** An optional cell (a carry mark): typing never moves the cursor into it; the child taps it to write there. */
  optional?: boolean
  focusable(): boolean
  focus(): void
  input(d: number, via: 'keyboard' | 'keypad'): void
  /** Sets the digit without moving on (the group places the digits of a number typed like on a calculator). */
  assign(d: number | null, via: 'keyboard' | 'keypad'): void
  /** The digit the cell holds now. */
  value(): number | null
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
  /** 'ltr': the digits of a number go in like on a calculator; 'column': units first (a column operation's result). */
  typingOrder: 'ltr' | 'column'
  /** A digit typed in a cell of a number (ltr groups): placed at the units, the rest move left. False: not handled. */
  typeInNumber(uid: string, d: number, via: 'keyboard' | 'keypad'): boolean
  /** Backspace in a cell of a number (ltr groups): the last digit typed goes. False: not handled. */
  deleteInNumber(uid: string): boolean
  /** The group shows an on-screen keypad right now (cells skip their own digit picker). */
  keypadVisible: boolean
  /** A finger tried to write although a pen is in use: point the child to the keypad toggle. */
  nudgeKeypad(): void
}

export const CellGroupContext = createContext<CellGroupApi | null>(null)

export function useCellGroup(): CellGroupApi | null {
  return useContext(CellGroupContext)
}
