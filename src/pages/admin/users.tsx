import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '../../components/button'
import { AdminContextData } from '../../layouts/admin-layout'

export function AdminUsers() {
  const { users, workouts, logs } = useOutletContext<AdminContextData>()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sortBy, setSortBy] = useState<'name' | 'lastActivity' | 'logs' | 'workouts'>('lastActivity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'premium' | 'free' | 'active' | 'admin'>('all')

  const getFilteredAndSortedUsers = () => {
    const filteredUsers = users.filter(user => {
      switch (filterBy) {
        case 'premium':
          return user.isPremium === true
        case 'free':
          return !user.isPremium
        case 'active':
          return user.isActive === true
        case 'admin':
          return user.isAdmin === true
        case 'all':
        default:
          return true
      }
    })

    filteredUsers.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.nome.localeCompare(b.nome)
          break
        case 'lastActivity': {
          const aLogs = logs.filter(l => l.usuarioID === a.id)
          const bLogs = logs.filter(l => l.usuarioID === b.id)
          const aLastLog = aLogs.length > 0 ? new Date(aLogs[0].data).getTime() : 0
          const bLastLog = bLogs.length > 0 ? new Date(bLogs[0].data).getTime() : 0
          comparison = aLastLog - bLastLog
          break
        }
        case 'logs': {
          const aLogsCount = logs.filter(l => l.usuarioID === a.id).length
          const bLogsCount = logs.filter(l => l.usuarioID === b.id).length
          comparison = aLogsCount - bLogsCount
          break
        }
        case 'workouts': {
          const aWorkoutsCount = workouts.filter(w => w.usuarioID === a.id).length
          const bWorkoutsCount = workouts.filter(w => w.usuarioID === b.id).length
          comparison = aWorkoutsCount - bWorkoutsCount
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filteredUsers
  }

  const filteredAndSortedUsers = getFilteredAndSortedUsers()

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-500">
            <Users size={24} />
          </div>
          Lista de Usuários
          <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full ml-2">
            {filteredAndSortedUsers.length} encontrados
          </span>
        </h2>
      </div>

      {/* Filters and Sorting Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Filtrar por:</label>
          <select
            value={filterBy}
            onChange={(e) => {
              setFilterBy(e.target.value as typeof filterBy)
              setCurrentPage(1)
            }}
            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          >
            <option value="all">Todos os Usuários</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
            <option value="active">Ativos Recentes</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          >
            <option value="name">Nome (Alfabético)</option>
            <option value="lastActivity">Data de Última Atividade</option>
            <option value="logs">Total de Treinos (Logs)</option>
            <option value="workouts">Rotinas Criadas (Treinos)</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Ordem:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          >
            <option value="desc">
              {sortBy === 'name' ? 'Z → A' : 'Maior → Menor'}
            </option>
            <option value="asc">
              {sortBy === 'name' ? 'A → Z' : 'Menor → Maior'}
            </option>
          </select>
        </div>
      </div>

      {filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-300 text-xl font-bold mb-2">Nenhum usuário encontrado</p>
          <p className="text-gray-500 text-sm">Tente ajustar os filtros acima para ver mais resultados.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-md">
            <table className="w-full text-left bg-gray-800/80">
              <thead className="bg-gray-900">
                <tr className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6 font-bold">Usuário</th>
                  <th className="py-4 px-6 font-bold">Rotinas</th>
                  <th className="py-4 px-6 font-bold">Logs</th>
                  <th className="py-4 px-6 font-bold">Última Ativ.</th>
                  <th className="py-4 px-6 font-bold">Plano</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                  const userWorkouts = workouts.filter(w => w.usuarioID === user.id).length
                  const userLogs = logs.filter(l => l.usuarioID === user.id)
                  const userLogsCount = userLogs.length
                  
                  const lastLog = userLogs.length > 0 ? userLogs[0] : null
                  const lastActivity = lastLog ? new Date(lastLog.data) : null
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-700/40 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="text-white font-bold group-hover:text-blue-400 transition-colors">{user.nome}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-300">{userWorkouts}</td>
                      <td className="py-4 px-6 font-medium text-gray-300">{userLogsCount}</td>
                      <td className="py-4 px-6">
                        {lastActivity ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                              {lastActivity.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {lastActivity.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">Sem logs</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {user.isPremium ? (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shadow-sm shadow-amber-900/20">Premium</span>
                        ) : (
                          <span className="bg-gray-700 text-gray-300 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border border-gray-600">Free</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {user.isAdmin ? (
                          <span className="bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/30 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold">Admin</span>
                        ) : (
                          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${user.isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredAndSortedUsers.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6 px-2">
              <span className="text-gray-400 text-sm font-medium">
                Página {currentPage} de {Math.ceil(filteredAndSortedUsers.length / itemsPerPage)}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAndSortedUsers.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredAndSortedUsers.length / itemsPerPage)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
