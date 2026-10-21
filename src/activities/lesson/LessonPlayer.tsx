// PLACEHOLDER — lessons agent implements the animated lesson player (see docs/ARCHITECTURE.md).
import type { LessonDef } from '@/types'
import { Button, Placeholder } from '@/ui'

export default function LessonPlayer({ lesson, onDone }: { lesson: LessonDef; onDone: () => void; onExit?: () => void }) {
  return (
    <div>
      <Placeholder name={`LessonPlayer: ${lesson.id}`} />
      <Button onClick={onDone}>Continuar</Button>
    </div>
  )
}
