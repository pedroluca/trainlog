interface OrbitProgressProps {
  color?: string
  alternativeColor?: boolean
}

export const OrbitProgress: React.FC<OrbitProgressProps> = ({
  color = '#1e90ff',
  alternativeColor = false
}) => {
  const selectedColor = alternativeColor ? '#d1d5db' : color // Cinza claro se alternativeColor for true

  return (
    <div className='relative w-[100%] h-6 flex items-center justify-center'>
      <div
        className='absolute w-6 h-6 border-4 border-transparent border-t-current rounded-full animate-spin'
        style={{ borderTopColor: selectedColor }}
      />
    </div>
  )
}