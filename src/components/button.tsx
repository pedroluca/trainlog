type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  className?: string
  buttonTextColor?: string
}

export function Button({ children, className, buttonTextColor, ...rest }: ButtonProps) {
  return (
    <button className={`${buttonTextColor ? `${buttonTextColor}` : 'text-white'} bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer font-bold py-2 px-4 rounded ${className}`} {...rest}>
      {children}
    </button>
  )
}