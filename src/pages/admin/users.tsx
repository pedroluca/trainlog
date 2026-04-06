import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, ChevronDown, ChevronUp, ChevronRight, Activity, Dumbbell, CalendarDays, Trash2 } from 'lucide-react'
import { Button } from '../../components/button'
import { AdminContextData, WorkoutData } from '../../layouts/admin-layout'
import { db } from '../../firebaseConfig'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'

type ExercicioData = {
  id: string
  titulo: string
  series: number
  repeticoes: string | number
  peso: number
}

function UserWorkoutsDetails({ userWorkouts, onWorkoutDeleted }: { userWorkouts: WorkoutData[]; onWorkoutDeleted: (workoutId: string) => void }) {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExercicioData[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)

  const handleToggleWorkout = async (workoutId: string) => {
    if (expandedWorkoutId === workoutId) {
      setExpandedWorkoutId(null)
      return
    }
    
    setExpandedWorkoutId(workoutId)
    setLoading(true)
    try {
      const q = collection(db, 'treinos', workoutId, 'exercicios')
      const snap = await getDocs(q)
      const data = snap.docs.map(doc => ({
        id: doc.id,
        titulo: doc.data().titulo,
        series: doc.data().series,
        repeticoes: doc.data().repeticoes,
        peso: doc.data().peso
      }))
      setExercises(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async (workoutId: string, workoutLabel: string) => {
    const shouldDelete = window.confirm(`Tem certeza que deseja excluir o treino "${workoutLabel}"? Esta acao nao pode ser desfeita.`)
    if (!shouldDelete) return

    try {
      setDeletingWorkoutId(workoutId)

      const exercisesRef = collection(db, 'treinos', workoutId, 'exercicios')
      const exercisesSnap = await getDocs(exercisesRef)
      const deleteExercisesPromises = exercisesSnap.docs.map((exerciseDoc) => deleteDoc(exerciseDoc.ref))
      await Promise.all(deleteExercisesPromises)

      await deleteDoc(doc(db, 'treinos', workoutId))

      if (expandedWorkoutId === workoutId) {
        setExpandedWorkoutId(null)
        setExercises([])
      }

      onWorkoutDeleted(workoutId)
    } catch (err) {
      console.error('Erro ao excluir treino no painel admin:', err)
      window.alert('Erro ao excluir treino. Tente novamente.')
    } finally {
      setDeletingWorkoutId(null)
    }
  }

  if (userWorkouts.length === 0) {
    return <div className="p-6 text-center text-gray-500 text-sm">Este usuário ainda não criou nenhum treino.</div>
  }

  const daysOrder = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const sortedWorkouts = [...userWorkouts].sort((a, b) => daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia))

  return (
    <div className="bg-gray-900/60 p-4 md:p-6 shadow-inner border-t border-gray-700">
      <h4 className="text-white font-bold flex items-center gap-2 mb-4">
        <Activity size={18} className="text-blue-400" />
        Rotinas de Treino
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedWorkouts.map(workout => (
          <div key={workout.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm transition-all">
            <div className="w-full p-4 flex items-center justify-between hover:bg-gray-700/80 transition-colors text-left">
              <div>
                <p className="font-bold text-gray-200 text-sm">{workout.dia}</p>
                <p className="text-xs text-blue-400 flex items-center gap-1.5 mt-1 font-medium bg-blue-500/10 w-max px-2 py-0.5 rounded-md">
                  <Dumbbell size={12} /> {workout.musculo}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteWorkout(workout.id, `${workout.dia} - ${workout.musculo}`)
                  }}
                  disabled={deletingWorkoutId === workout.id}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Excluir treino"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleWorkout(workout.id)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
                  title={expandedWorkoutId === workout.id ? 'Ocultar exercicios' : 'Ver exercicios'}
                >
                  {expandedWorkoutId === workout.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
              </div>
            </div>
            
            {expandedWorkoutId === workout.id && (
              <div className="bg-gray-900/80 p-3 border-t border-gray-700">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : exercises.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">Nenhum exercício cadastrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {exercises.map(ex => (
                      <li key={ex.id} className="text-xs bg-gray-800 p-2.5 rounded-lg border border-gray-700/50 flex justify-between items-center hover:border-gray-600 transition-colors">
                        <span className="font-medium text-gray-300 truncate max-w-[55%] pr-2">{ex.titulo}</span>
                        <div className="flex gap-2.5 text-gray-500 bg-gray-900 px-2 py-1 rounded-md border border-gray-800">
                          <span><strong className="text-gray-300">{ex.series}</strong>x<strong className="text-gray-300">{ex.repeticoes}</strong></span>
                          <span className="w-px bg-gray-700"></span>
                          <span><strong className="text-gray-300">{ex.peso}</strong>kg</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminUsers() {
  const { users, workouts, setWorkouts, logs } = useOutletContext<AdminContextData>()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const [sortBy, setSortBy] = useState<'name' | 'lastActivity' | 'logs' | 'workouts' | 'createdAt'>('lastActivity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'premium' | 'free' | 'active' | 'admin'>('all')

  const getCreatedAtDate = (createdAt: any) => {
    if (!createdAt) return 0
    if (createdAt.toDate) return createdAt.toDate().getTime()
    if (createdAt.seconds) return createdAt.seconds * 1000
    return new Date(createdAt).getTime()
  }

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
        case 'createdAt': {
          comparison = getCreatedAtDate(a.criadoEm) - getCreatedAtDate(b.criadoEm)
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
            <option value="createdAt">Data de Criação (Membro desde)</option>
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
                  <th className="py-4 px-6 font-bold">Membro Desde</th>
                  <th className="py-4 px-6 font-bold">Rotinas</th>
                  <th className="py-4 px-6 font-bold">Logs</th>
                  <th className="py-4 px-6 font-bold">Última Ativ.</th>
                  <th className="py-4 px-6 font-bold">Plano / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                  const userWorkoutsList = workouts.filter(w => w.usuarioID === user.id)
                  const userWorkouts = userWorkoutsList.length
                  const userLogs = logs.filter(l => l.usuarioID === user.id)
                  const userLogsCount = userLogs.length
                  
                  const lastLog = userLogs.length > 0 ? userLogs[0] : null
                  const lastActivity = lastLog ? new Date(lastLog.data) : null
                  
                  const creationTimestamp = getCreatedAtDate(user.criadoEm)
                  const creationDate = creationTimestamp ? new Date(creationTimestamp) : null
                  const isExpanded = expandedUserId === user.id
                  
                  return (
                    <React.Fragment key={user.id}>
                    <tr 
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      className={`hover:bg-gray-700/40 transition-colors group cursor-pointer ${isExpanded ? 'bg-gray-800/60' : ''}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 group-hover:bg-gray-700'}`}>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-blue-400 transition-colors flex items-center gap-2">
                              {user.nome} {user.isAdmin && <span className="bg-[#27AE60]/20 text-[#27AE60] text-[10px] uppercase px-1.5 py-0.5 rounded font-black">Admin</span>}
                            </p>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {creationDate ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                              {creationDate.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {creationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-300">
                        <span className="bg-gray-700 text-gray-200 px-2.5 py-1 rounded-lg text-sm font-bold border border-gray-600 shadow-inner">
                          {userWorkouts}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-300">
                        <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded-lg text-xs font-semibold">
                          {userLogsCount} logs
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {lastActivity ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                              {lastActivity.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-blue-400/80 font-semibold">
                              {lastActivity.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic flex items-center gap-1">
                            <CalendarDays size={12} /> Sem logs
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          {user.isPremium ? (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shadow-sm shadow-amber-900/20">Premium</span>
                          ) : (
                            <span className="bg-gray-700 text-gray-300 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border border-gray-600">Free</span>
                          )}
                          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${user.isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Content for user workouts and exercises */}
                    {isExpanded && (
                      <tr className="bg-[#151a23]">
                        <td colSpan={6} className="p-0 border-b border-gray-700">
                            <UserWorkoutsDetails
                              userWorkouts={userWorkoutsList}
                              onWorkoutDeleted={(workoutId) => {
                                setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
                              }}
                            />
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
