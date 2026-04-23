import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BackArrowButtonProps {
    title: string
    route?: string
}

export function BackArrowButton({ title, route }: BackArrowButtonProps) {
    const navigate = useNavigate()
    
    const handleClick = () => {
        if (route) {
            navigate(route)
        } else {
            navigate(-1)
        }
    }

    return (
        <div className='w-full max-w-lg md:max-w-3xl lg:max-w-4xl flex items-center gap-4 mb-6'>
          <button
            onClick={() => handleClick()}
            className='cursor-pointer flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>{title}</h1>
        </div>
    )
}