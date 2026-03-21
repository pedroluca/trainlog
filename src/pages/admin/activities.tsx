import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { AdminContextData } from '../../layouts/admin-layout'
import { Button } from '../../components/button'

export function AdminActivities() {
  const { logs, users } = useOutletContext<AdminContextData>()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
            <Activity size={24} />
          </div>
          Atividade Recente Global
          <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full ml-2">
            {logs.length} logs
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => {
          const user = users.find(u => u.id === log.usuarioID)
          const date = new Date(log.data)
          
          return (
            <div key={log.id} className="bg-gray-700/30 hover:bg-gray-700/50 transition-colors rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-transparent hover:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg mt-1 md:mt-0">
                  {user?.nome?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-bold text-base md:text-lg mb-0.5">
                    {user?.nome || 'Usuário desconhecido'}
                    {user?.isPremium && (
                      <span className="ml-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black align-middle shadow-sm">Premium</span>
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Finalizou <strong className="text-gray-200">{log.titulo}</strong> — {log.series}x{log.repeticoes} com <strong className="text-emerald-400">{log.peso}kg</strong>
                  </p>
                </div>
              </div>
              <div className="flex flex-row md:flex-col justify-end md:items-end gap-2 md:gap-0 pl-14 md:pl-0">
                <p className="text-gray-300 text-sm font-medium bg-gray-600/50 md:bg-transparent px-2 py-0.5 md:p-0 rounded">
                  {date.toLocaleDateString('pt-BR')}
                </p>
                <p className="text-gray-500 text-xs font-bold font-mono">
                  {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
          <Activity size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-300 text-xl font-bold mb-2">Nenhum log registrado</p>
          <p className="text-gray-500 text-sm">Os treinos finalizados pelos usuários aparecerão aqui.</p>
        </div>
      )}

      {logs.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-8 px-2">
          <span className="text-gray-400 text-sm font-medium">
            Página {currentPage} de {Math.ceil(logs.length / itemsPerPage)}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(logs.length / itemsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(logs.length / itemsPerPage)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
