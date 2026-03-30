import { useNavigate } from 'react-router-dom'
import { Button } from '../components/button'
import { Dumbbell, ArrowLeft } from 'lucide-react'
import logo from '../assets/nova-logo-clear.png'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#121212] flex flex-col items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#27AE60]/10 dark:bg-[#27AE60] rounded-full blur-[120px] pointer-events-none dark:opacity-5" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#27AE60]/10 dark:bg-[#27AE60] rounded-full blur-[120px] pointer-events-none dark:opacity-5" />
      
      <div className="z-10 w-full max-w-[400px] flex flex-col items-center text-center transition-all duration-300">
        
        <div className="relative mb-0 mt-8 flex flex-col items-center justify-center">
          <p className="text-[140px] md:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#27AE60] to-[#2ecc71] relative z-10 leading-none tracking-tighter drop-shadow-sm select-none">
            404
          </p>
          <div className="absolute inset-x-0 bottom-4 md:bottom-8 flex justify-center z-20">
             <div className="w-16 h-16 bg-white dark:bg-[#1e1e1e] shadow-xl rounded-2xl flex items-center justify-center text-[#27AE60] transform rotate-12 hover:-rotate-6 transition-transform duration-500 border-2 border-[#f3f4f6] dark:border-[#2d2d2d]">
                <Dumbbell size={32} strokeWidth={2.5} />
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] w-full rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 pt-10 mt-[-20px] relative z-0 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 tracking-tight">
              Treino Não Encontrado
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-[15px] leading-relaxed">
              Parece que você se perdeu na academia. A página que você está acessando não consta na sua ficha de hoje.
            </p>

            <Button 
              onClick={() => navigate('/', { replace: true })} 
              className="cursor-pointer w-full h-12 flex items-center justify-center gap-2 text-[15px] font-bold tracking-wide shadow-lg shadow-[#27AE60]/20 rounded-xl transition-transform active:scale-[0.98]"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
              Voltar para a Home
            </Button>
        </div>

      </div>

      <img 
        src={logo} 
        alt="TrainLog" 
        className="h-6 absolute bottom-8 opacity-30 hover:opacity-100 dark:brightness-200 dark:contrast-125 transition-all duration-300 cursor-pointer" 
        onClick={() => navigate('/')}
      />
    </div>
  )
}
