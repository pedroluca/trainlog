import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Dumbbell, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { getVersionWithPrefix } from "../version"

export function Home() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = usuarioID ? true : false
  const navigate = useNavigate()

  useEffect(() => {
    if (usuarioID) {
      navigate('/train')
    }
  })

  return (
    <main className={`${isLogged ? ' pb-24' : ''} flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-br from-gray-50 to-gray-100 p-6`}>
      {/* Hero Section */}
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-4xl border border-gray-200">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Dumbbell size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#27AE60] to-[#219150] bg-clip-text text-transparent mb-4">
            TrainLog
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Seu companheiro inteligente para acompanhar treinos e alcançar seus objetivos fitness
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <FeatureCard
            icon={<TrendingUp size={28} />}
            title="Acompanhe Progresso"
            description="Registre seus treinos diários e veja sua evolução"
            color="from-blue-500 to-blue-600"
          />
          <FeatureCard
            icon={<CheckCircle size={28} />}
            title="Gerencie Exercícios"
            description="Organize e controle todos os seus exercícios"
            color="from-[#27AE60] to-[#219150]"
          />
          <FeatureCard
            icon={<Clock size={28} />}
            title="Timer Integrado"
            description="Cronômetro para intervalos de descanso"
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 mb-8">
          <Link
            to="/login"
            className="block bg-gradient-to-r from-[#27AE60] to-[#219150] hover:from-[#219150] hover:to-[#1e8449] text-white font-bold py-4 px-6 rounded-xl text-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Entrar na Conta
          </Link>
          <Link
            to="/cadastro"
            className="block bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl text-center border-2 border-gray-300 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Criar Nova Conta
          </Link>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">Por que usar o TrainLog?</h3>
          <div className="space-y-3">
            <BenefitItem text="Interface simples e intuitiva" />
            <BenefitItem text="Totalmente gratuito para usar" />
            <BenefitItem text="Acesse de qualquer dispositivo" />
            <BenefitItem text="Dados seguros e sincronizados" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-6">
          <p className="text-gray-500 text-sm mb-2">
            Desenvolvido com 💪 por{' '}
            <a 
              href="https://pedroluca.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#27AE60] hover:text-[#219150] font-medium transition-colors"
            >
              Pedro Luca Prates
            </a>
          </p>
          <p className="text-gray-400 text-xs">{getVersionWithPrefix()}</p>
        </div>
      </div>
    </main>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

// Benefit Item Component
function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle size={16} className="text-white" />
      </div>
      <p className="text-gray-700">{text}</p>
    </div>
  )
}