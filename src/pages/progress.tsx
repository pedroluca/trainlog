import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { TrendingUp, Award, Dumbbell, Calendar } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

type LogEntry = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  data: string
}

type ExerciseProgress = {
  exerciseName: string
  totalLogs: number
  personalRecord: number
  lastWeight: number
  progress: number // percentage change
  history: Array<{
    data: string
    peso: number
  }>
}

export function Progress() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [exercisesList, setExercisesList] = useState<string[]>([])
  const [exerciseData, setExerciseData] = useState<ExerciseProgress | null>(null)

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
      return
    }

    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioID, navigate])

  useEffect(() => {
    if (selectedExercise && logs.length > 0) {
      calculateExerciseProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExercise, logs])

  const fetchLogs = async () => {
    if (!usuarioID) return

    try {
      const logsRef = collection(db, 'logs')
      const q = query(
        logsRef,
        where('usuarioID', '==', usuarioID),
        orderBy('data', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const logsData: LogEntry[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        usuarioID: doc.data().usuarioID,
        titulo: doc.data().titulo,
        series: doc.data().series,
        repeticoes: doc.data().repeticoes,
        peso: doc.data().peso,
        data: doc.data().data,
      }))
      
      setLogs(logsData)

      // Get unique exercise names
      const uniqueExercises = Array.from(new Set(logsData.map(log => log.titulo)))
      setExercisesList(uniqueExercises)
      
      // Auto-select first exercise
      if (uniqueExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(uniqueExercises[0])
      }

      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      setLoading(false)
    }
  }

  const calculateExerciseProgress = () => {
    const exerciseLogs = logs
      .filter(log => log.titulo === selectedExercise)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    if (exerciseLogs.length === 0) {
      setExerciseData(null)
      return
    }

    const weights = exerciseLogs.map(log => log.peso)
    const personalRecord = Math.max(...weights)
    const firstWeight = weights[0]
    const lastWeight = weights[weights.length - 1]
    const progress = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight) * 100 : 0

    const history = exerciseLogs.map(log => ({
      data: log.data,
      peso: log.peso
    }))

    setExerciseData({
      exerciseName: selectedExercise,
      totalLogs: exerciseLogs.length,
      personalRecord,
      lastWeight,
      progress,
      history
    })
  }

  // Calculate overall stats
  const totalWorkouts = logs.length
  const uniqueExercisesCount = exercisesList.length
  const totalVolume = logs.reduce((sum, log) => sum + (log.series * log.repeticoes * log.peso), 0)

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando progresso...</p>
        </div>
      </main>
    )
  }

  if (logs.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="text-center">
          <TrendingUp size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sem Dados de Progresso</h2>
          <p className="text-gray-600 mb-6">
            Registre alguns treinos para ver seu progresso!
          </p>
          <button
            onClick={() => navigate('/train')}
            className="bg-[#27AE60] hover:bg-[#229954] text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            Ir para Treinos
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="text-black p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp size={28} />
          Progresso
        </h1>
        <p className="text-black/80 text-sm mt-1">Acompanhe sua evolução</p>
      </header>

      <div className="p-6 space-y-6">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar size={24} />}
            label="Total de Logs"
            value={totalWorkouts.toString()}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Dumbbell size={24} />}
            label="Exercícios"
            value={uniqueExercisesCount.toString()}
            color="from-[#27AE60] to-[#229954]"
          />
          <StatCard
            icon={<Award size={24} />}
            label="Volume Total"
            value={`${(totalVolume / 1000).toFixed(1)}t`}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Progresso"
            value={exerciseData ? `${exerciseData.progress > 0 ? '+' : ''}${exerciseData.progress.toFixed(1)}%` : '-'}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Exercise Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-gray-700 font-bold mb-3">
            Selecione o Exercício
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent transition-all"
          >
            {exercisesList.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>

        {/* Exercise Progress Details */}
        {exerciseData && (
          <>
            {/* Stats for Selected Exercise */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Recorde Pessoal</p>
                <p className="text-2xl font-bold text-[#27AE60]">{exerciseData.personalRecord}kg</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Último Peso</p>
                <p className="text-2xl font-bold text-gray-800">{exerciseData.lastWeight}kg</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Sessões</p>
                <p className="text-2xl font-bold text-blue-600">{exerciseData.totalLogs}</p>
              </div>
            </div>

            {/* Professional Line Chart with Recharts */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Progressão de Peso</h3>
              
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={exerciseData.history.map(entry => ({
                      data: new Date(entry.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                      peso: entry.peso,
                      isPR: entry.peso === exerciseData.personalRecord
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27AE60" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#27AE60" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="data" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #27AE60',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      formatter={(value: number) => [`${value}kg`, 'Peso']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#27AE60" 
                      strokeWidth={3}
                      fill="url(#colorPeso)"
                      dot={{ fill: '#27AE60', r: 5 }}
                      activeDot={{ r: 7, fill: '#229954' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {exerciseData.history.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                    <span>Progressão de Peso</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Award size={16} className="text-yellow-500" />
                    <span>Recorde: {exerciseData.personalRecord}kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Sessions Table */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sessões Recentes</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {exerciseData.history.slice().reverse().slice(0, 10).map((entry, index) => {
                  const isPR = entry.peso === exerciseData.personalRecord
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isPR ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isPR && <Award size={20} className="text-yellow-500" />}
                        <div>
                          <p className="text-sm font-bold text-gray-800">{entry.peso}kg</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.data).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {isPR && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full font-bold">
                          PR
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {exerciseData.history.length > 10 && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Mostrando últimas 10 de {exerciseData.history.length} sessões
                </p>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Evolução Geral</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Peso Inicial</span>
                    <span className="font-bold">{exerciseData.history[0]?.peso}kg</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        exerciseData.progress >= 0
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${Math.min(Math.abs(exerciseData.progress) * 2, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Peso Atual</span>
                    <span className="font-bold">{exerciseData.lastWeight}kg</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${exerciseData.progress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {exerciseData.progress > 0 ? '+' : ''}{exerciseData.progress.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">de evolução</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`bg-gradient-to-br ${color} p-3 flex justify-center`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
      <div className="p-3 text-center">
        <p className="text-gray-600 text-xs mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}
