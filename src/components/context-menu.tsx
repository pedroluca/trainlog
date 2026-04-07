import { Edit, FileText, Undo2, RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onAddNote: () => void
  onUndoSet?: () => void
  onResetExercise?: () => void
  position?: { top: number; right: number }
}

export function ContextMenu({ isOpen, onClose, onEdit, onAddNote, onUndoSet, onResetExercise, position }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-20 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-lg shadow-lg py-2 min-w-[180px]"
      style={{ 
        top: position?.top || 50, 
        right: position?.right || 10 
      }}
    >
      <button
        onClick={() => {
          onEdit()
          onClose()
        }}
        className="w-full md:text-lg px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
      >
        <Edit size={18} />
        <span>Editar Exercício</span>
      </button>
      
      <button
        onClick={() => {
          onAddNote()
          onClose()
        }}
        className="w-full md:text-lg px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
      >
        <FileText size={18} />
        <span>Anotação</span>
      </button>
      
      {onUndoSet && (
        <button
          onClick={() => {
            onUndoSet()
            onClose()
          }}
          className="w-full md:text-lg px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-orange-600 dark:text-orange-400 transition-colors"
        >
          <Undo2 size={18} />
          <span>Desfazer Série</span>
        </button>
      )}

      {onResetExercise && (
        <button
          onClick={() => {
            onResetExercise()
            onClose()
          }}
          className="w-full md:text-lg px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors border-t border-gray-100 dark:border-gray-700"
        >
          <RotateCcw size={18} />
          <span>Reiniciar Exercício</span>
        </button>
      )}
    </div>
  )
}
