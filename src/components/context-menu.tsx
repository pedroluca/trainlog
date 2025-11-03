import { Edit, FileText } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onAddNote: () => void
  position?: { top: number; right: number }
}

export function ContextMenu({ isOpen, onClose, onEdit, onAddNote, position }: ContextMenuProps) {
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
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
      >
        <Edit size={18} />
        <span>Editar Exercício</span>
      </button>
      
      <button
        onClick={() => {
          onAddNote()
          onClose()
        }}
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
      >
        <FileText size={18} />
        <span>Anotação</span>
      </button>
    </div>
  )
}
