import { Bug } from 'lucide-react'

export function AdminBugs() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 md:p-10 border border-white/10 shadow-xl min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-red-500/20 border border-red-500/20">
        <Bug size={48} className="text-red-400" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3">Reporte de Bugs</h2>
      <p className="text-gray-400 max-w-lg mb-8 text-lg">
        Esta funcionalidade ainda está em construção. Em breve, os usuários poderão relatar bugs e melhorias diretamente do aplicativo, e eles aparecerão organizados aqui.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl opacity-50 pointer-events-none">
        <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold px-2 py-1 rounded">Crítico</span>
            <span className="text-gray-500 text-xs">Hoje, 14:30</span>
          </div>
          <h4 className="text-white font-bold mb-1">Botão de treinos sumiu</h4>
          <p className="text-gray-400 text-sm">Na aba de perfil não consigo mais ver a lista...</p>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] uppercase font-bold px-2 py-1 rounded">Médio</span>
            <span className="text-gray-500 text-xs">Ontem, 09:15</span>
          </div>
          <h4 className="text-white font-bold mb-1">Erro ao trocar foto</h4>
          <p className="text-gray-400 text-sm">A foto fica carregando infinitamente quando clico...</p>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold px-2 py-1 rounded">Sugestão</span>
            <span className="text-gray-500 text-xs">Segunda, 11:00</span>
          </div>
          <h4 className="text-white font-bold mb-1">Modo escuro no cronômetro</h4>
          <p className="text-gray-400 text-sm">Seria legal se o cronômetro também seguisse o tema...</p>
        </div>
      </div>
      
      <div className="mt-10 px-6 py-3 bg-gray-900/50 border border-gray-700 rounded-full">
        <p className="text-gray-500 text-sm font-medium tracking-wide">🚧 Módulo em desenvolvimento 🚧</p>
      </div>
    </div>
  )
}
