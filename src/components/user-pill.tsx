import React from 'react'

interface UserPillProps {
  nome: string
  photoURL?: string | null
  username?: string | null
  children?: React.ReactNode
  onClick?: () => void
}

export function UserPill({ nome, photoURL, username, children, onClick }: UserPillProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-[#333] bg-white dark:bg-[#252525] transition-all shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#27AE60]/50 dark:hover:border-[#27AE60]/50' : ''
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Avatar */}
        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-full flex items-center justify-center text-white text-lg font-bold overflow-hidden shadow-inner ring-2 ring-white dark:ring-[#1e1e1e]">
          {photoURL ? (
            <img 
              src={photoURL} 
              alt={nome} 
              className="w-full h-full object-cover"
            />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>
        
        {/* Info */}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {nome}
          </h3>
          {username && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{username}
            </span>
          )}
        </div>
      </div>

      {/* Action / Slot */}
      {children && (
        <div className="shrink-0 ml-3 flex items-center">
          {children}
        </div>
      )}
    </div>
  )
}
