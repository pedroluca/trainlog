import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Sheet } from '../../components/ui/sheet'
import { TextArea } from '../../components/ui/text-field'

type NoteSheetProps = {
  open: boolean
  onClose: () => void
  initialNote: string
  exerciseTitle: string
  onSave: (note: string) => void
}

/** Montado só enquanto aberto, então o rascunho sempre começa da nota salva */
export function NoteSheet({ open, onClose, initialNote, exerciseTitle, onSave }: NoteSheetProps) {
  const [note, setNote] = useState(initialNote)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Anotação"
      description={exerciseTitle}
      footer={(
        <div className="flex gap-2">
          <Button label="Cancelar" variant="secondary" className="flex-1" onClick={onClose} />
          <Button
            label="Salvar"
            className="flex-1"
            onClick={() => {
              onSave(note)
              onClose()
            }}
          />
        </div>
      )}
    >
      <TextArea
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder="Ex.: foco na contração, descer devagar, banco na posição 3..."
        maxLength={1000}
        autoFocus
        aria-label="Anotação"
      />
    </Sheet>
  )
}
