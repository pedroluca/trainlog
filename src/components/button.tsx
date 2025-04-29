type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  className?: string
  buttonTextColor?: string
  bgColor?: string
}

export function Button({ children, className, buttonTextColor, bgColor, ...rest }: ButtonProps) {
  return (
    <button 
      className={`
        ${buttonTextColor ? `${buttonTextColor}` : 'text-white'} 
        ${bgColor ? `${bgColor}` : 'bg-blue-500 hover:bg-blue-700'}
        disabled:cursor-not-allowed 
        cursor-pointer 
        font-bold 
        py-2 
        px-4 
        rounded 
        ${className}
      `} 
      {...rest}
    >
      {children}
    </button>
  )
}