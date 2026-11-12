/* Local review log of wrong answers. Its purpose: an adult can look at the answers the app marked wrong and check
   whether a right answer was judged wrong (a false negative). It stays on this device: nothing is sent anywhere, and
   no child or family id is stored. It is bounded: only the newest REVIEW_LIMIT notes are kept. The adult sees it,
   exports it and deletes it in Ajustes («Respuestas marcadas como mal», src/adult/settings/ReviewNotesCard.tsx).
   A handwritten answer also keeps what the app read, digit by digit (confidence, alternatives, the 28×28 image of the
   ink), so the adult can tell a misread from a maths slip. Old notes without it still load. */
import type { AttemptRecord, ErrorType, InputMode, ISODate } from '@/types'
import { takeInkReading, type InkReading } from '@/ink/readLog'
import { db } from './db'

export const REVIEW_LIMIT = 300
const MAX_ANSWER_CHARS = 80

declare const __APP_VERSION__: string | undefined

export interface WrongAnswerNote {
  seq?: number
  at: ISODate
  appVersion: string
  skill: string
  kind: string
  errorType: ErrorType | null
  /** What the child wrote or tapped (clipped). */
  given: string
  /** What the app expected (clipped). */
  expected: string
  inputMode: InputMode
  /** Handwritten answers: what the app read from the ink (missing in older notes and for typed answers). */
  ink?: InkReading
}

function reviewAppVersion(): string {
  return typeof __APP_VERSION__ === 'string' && __APP_VERSION__ ? __APP_VERSION__ : 'dev'
}

function clip(text: string | undefined): string {
  return String(text ?? '').slice(0, MAX_ANSWER_CHARS)
}

/** Keeps a note when the attempt is a graded wrong answer. Call it inside the transaction that stores the attempt
 *  (the transaction must include db.reviewNotes). Right answers and ungraded retries are ignored. */
export async function noteWrongAnswer(attempt: AttemptRecord): Promise<void> {
  if (attempt.correct || attempt.graded === false) return
  const ink = takeInkReading(String(attempt.kind), attempt.given)
  await db.reviewNotes.add({
    at: attempt.createdAt,
    appVersion: reviewAppVersion(),
    skill: String(attempt.skill),
    kind: String(attempt.kind),
    errorType: attempt.errorType ?? null,
    given: clip(attempt.given),
    expected: clip(attempt.expected),
    inputMode: attempt.inputMode,
    ...(ink ? { ink } : {}),
  })
  const count = await db.reviewNotes.count()
  if (count > REVIEW_LIMIT) await db.reviewNotes.limit(count - REVIEW_LIMIT).delete() // the oldest go first
}

/** Newest first. */
export async function listWrongAnswerNotes(limit: number = REVIEW_LIMIT): Promise<WrongAnswerNote[]> {
  return db.reviewNotes.orderBy('seq').reverse().limit(limit).toArray()
}

/** Deletes every note of this device. */
export async function clearWrongAnswerNotes(): Promise<void> {
  await db.reviewNotes.clear()
}
