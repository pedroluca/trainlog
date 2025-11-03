import { useState } from 'react'
import { Button } from './button'

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => void
  currentNote?: string
  exerciseTitle: string
}

export function AddNoteModal({ isOpen, onClose, onSave, currentNote = '', exerciseTitle }: AddNoteModalProps) {
  const [note, setNote] = useState(currentNote)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-70 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 dark:text-gray-100">Adicionar Nota</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{exerciseTitle}</p>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Nota:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 min-h-[120px] resize-none"
            placeholder="Ex: Foco na contração, descer lentamente..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            buttonTextColor="text-gray-800 dark:text-gray-300"
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Salvar Nota
          </Button>
        </div>
      </div>
    </div>
  )
}
