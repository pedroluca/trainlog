import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Dumbbell, TrendingUp, Clock, CheckCircle, Zap, Users, Shield } from "lucide-react"
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
    <main className={`${isLogged ? 'pb-24' : ''} flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0d0d0d] dark:via-[#121212] dark:to-[#0d0d0d] p-4 md:p-8`}>

      {/* ── Desktop: two-column layout ── */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* ── Left column: Hero + Features ── */}
        <div className="flex flex-col gap-8">

          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#27AE60] to-[#1a7a40] rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30">
              <Dumbbell size={40} className="text-white" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-[#27AE60] to-[#1ecc6a] bg-clip-text text-transparent leading-tight">
                TrainLog
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-3 max-w-md">
                Seu companheiro inteligente para acompanhar treinos e alcançar seus objetivos fitness
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <FeatureCard
              icon={<TrendingUp size={22} />}
              title="Acompanhe seu Progresso"
              description="Registre treinos diários e visualize sua evolução com gráficos detalhados"
              color="from-blue-500 to-blue-600"
            />
            <FeatureCard
              icon={<CheckCircle size={22} />}
              title="Gerencie Exercícios"
              description="Organize e controle toda a sua biblioteca de exercícios personalizada"
              color="from-[#27AE60] to-[#219150]"
            />
            <FeatureCard
              icon={<Clock size={22} />}
              title="Timer Integrado"
              description="Cronômetro e intervalos de descanso diretamente no app"
              color="from-purple-500 to-purple-600"
            />
          </div>
        </div>

        {/* ── Right column: CTA card ── */}
        <div className="h-full bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-200 dark:border-[#2a2a2a] p-8 flex flex-col justify-center gap-6">

          {/* Card header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comece agora</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Grátis, sem complicação</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="block bg-gradient-to-r from-[#27AE60] to-[#219150] hover:from-[#219150] hover:to-[#1e8449] text-white font-bold py-4 px-6 rounded-2xl text-center shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:scale-[1.02] text-lg"
            >
              Entrar na Conta
            </Link>
            <Link
              to="/cadastro"
              className="block bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#2e2e2e] text-gray-800 dark:text-white font-bold py-4 px-6 rounded-2xl text-center border border-gray-200 dark:border-[#333] transition-all duration-200 hover:scale-[1.02] text-lg"
            >
              Criar Nova Conta
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Por que TrainLog?</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            <BenefitItem icon={<Zap size={15} />} text="Interface intuitiva" />
            <BenefitItem icon={<Shield size={15} />} text="Dados seguros" />
            <BenefitItem icon={<CheckCircle size={15} />} text="100% gratuito" />
            <BenefitItem icon={<Users size={15} />} text="Qualquer dispositivo" />
          </div>

          {/* Footer */}
          <div className="text-center pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
            <p className="text-gray-400 text-xs">
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
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">{getVersionWithPrefix()}</p>
          </div>
        </div>
      </div>
    </main>
  )
}

// Feature Card Component — horizontal layout no desktop
function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="flex items-start gap-4 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  )
}

// Benefit Item — compact grid cell
function BenefitItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#252525] rounded-xl px-3 py-2.5">
      <div className="text-[#27AE60]">{icon}</div>
      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{text}</span>
    </div>
  )
}