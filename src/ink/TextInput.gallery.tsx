/* Gallery of the typed-answer box: /dev/gallery?only=src/ink/TextInput.gallery */
import { useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { TextInput } from './TextInput'

function Demo({ start }: { start: string }) {
  const [value, setValue] = useState(start)
  return (
    <div style={{ width: '100%' }}>
      <TextInput value={value} onChange={setValue} onSubmit={() => {}} ariaLabel="Respuesta de lengua" />
    </div>
  )
}

const entries: GalleryEntry[] = [
  { title: 'Respuesta escrita con el teclado de letras', render: () => <Demo start="ñandú" />, width: 360 },
]

export default entries
