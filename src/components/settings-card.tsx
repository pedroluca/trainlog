interface SettingsCardProps {
  action?: React.ReactNode
  title?: string
  description?: string
  icon?: React.ElementType
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export function SettingsCard({ action, title, description, icon: Icon, onClick }: SettingsCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex gap-3 items-center bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-4 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040] ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#353535] transition-colors group' : ''}`}
    >
      <div className="flex-shrink-0 w-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {Icon && <Icon size={24} className={onClick ? 'group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors' : ''} />}
      </div>
      <div className="flex-1 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {title}
        </h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-end">
        {action}
      </div>
    </div>
  )
}