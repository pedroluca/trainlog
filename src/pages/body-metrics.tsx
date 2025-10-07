import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/button'

type BodyMeasurement = {
  id: string
  usuarioID: string
  data: string
  peso: number
  altura: number
  imc: number
  notas?: string
}

export function BodyMetrics() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState<BodyMeasurement | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Form states
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newPeso, setNewPeso] = useState('')
  const [newAltura, setNewAltura] = useState('')
  const [newNotas, setNewNotas] = useState('')

  // Function to open add modal with pre-filled data
  const openAddModal = () => {
    console.log('Opening add modal. Measurements count:', measurements.length)
    if (measurements.length > 0) {
      const lastMeasurement = measurements[0] // First item is the most recent (orderBy desc)
      console.log('Last measurement:', lastMeasurement)
      setNewPeso(lastMeasurement.peso.toString())
      setNewAltura((lastMeasurement.altura / 100).toString()) // Convert cm to meters
    } else {
      console.log('No measurements found, starting with empty values')
      setNewPeso('')
      setNewAltura('')
    }
    setNewDate(new Date().toISOString().split('T')[0])
    setNewNotas('')
    setIsAddModalOpen(true)
  }

  useEffect(() => {
    document.title = 'Métricas Corporais - TrainLog'

    if (!usuarioID) {
      navigate('/login')
      return
    }

    const fetchMeasurements = async () => {
      try {
        setLoading(true)
        const measurementsRef = collection(db, 'medicoescorporais')
        const q = query(
          measurementsRef,
          where('usuarioID', '==', usuarioID)
        )
        const querySnapshot = await getDocs(q)
        
        console.log('Total measurements found:', querySnapshot.size)
        
        const measurementsData: BodyMeasurement[] = querySnapshot.docs
          .map((doc) => {
            console.log('Measurement data:', doc.data())
            return {
              id: doc.id,
              ...doc.data()
            } as BodyMeasurement
          })
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Sort by date descending in JS

        console.log('Processed measurements:', measurementsData)
        setMeasurements(measurementsData)
      } catch (err) {
        console.error('Erro ao buscar medições:', err)
        alert('Erro ao buscar medições. Verifique o console para detalhes.')
      } finally {
        setLoading(false)
      }
    }

    // Check premium status
    const checkPremium = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const isPremiumUser = userDoc.data()?.isPremium || false
          
          if (!isPremiumUser) {
            alert('Esta página é exclusiva para usuários Premium.')
            navigate('/profile')
            return
          }
          
          // Only fetch measurements if premium
          fetchMeasurements()
        }
      } catch (err) {
        console.error('Erro ao verificar status premium:', err)
      }
    }

    checkPremium()
  }, [usuarioID, navigate])

  const refetchMeasurements = async () => {
    try {
      const measurementsRef = collection(db, 'medicoescorporais')
      const q = query(
        measurementsRef,
        where('usuarioID', '==', usuarioID)
      )
      const querySnapshot = await getDocs(q)
      
      console.log('Refetch - Total measurements found:', querySnapshot.size)
      
      const measurementsData: BodyMeasurement[] = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as BodyMeasurement))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Sort by date descending in JS

      console.log('Refetch - Processed measurements:', measurementsData)
      setMeasurements(measurementsData)
    } catch (err) {
      console.error('Erro ao buscar medições:', err)
    }
  }

  const handleAddMeasurement = async () => {
    if (!usuarioID) return

    const peso = parseFloat(newPeso)
    const altura = parseFloat(newAltura) * 100 // Convert to cm

    if (!peso || !altura || peso < 20 || peso > 500 || altura < 50 || altura > 300) {
      alert('Por favor, insira valores válidos (Altura: 0.50-3.00m, Peso: 20-500kg)')
      return
    }

    try {
      const imc = peso / Math.pow(altura / 100, 2)

      await addDoc(collection(db, 'medicoescorporais'), {
        usuarioID,
        data: new Date(newDate).toISOString(),
        peso,
        altura,
        imc: parseFloat(imc.toFixed(1)),
        notas: newNotas || undefined
      })

      setIsAddModalOpen(false)
      setNewDate(new Date().toISOString().split('T')[0])
      setNewPeso('')
      setNewAltura('')
      setNewNotas('')
      refetchMeasurements()
      alert('Medição adicionada com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar medição:', err)
      alert('Erro ao adicionar medição. Tente novamente.')
    }
  }

  const handleDeleteMeasurement = async () => {
    if (!selectedMeasurement) return

    try {
      await deleteDoc(doc(db, 'medicoescorporais', selectedMeasurement.id))
      setIsDeleteModalOpen(false)
      setSelectedMeasurement(null)
      refetchMeasurements()
      alert('Medição excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir medição:', err)
      alert('Erro ao excluir medição. Tente novamente.')
    }
  }

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600 dark:text-blue-400' }
    if (imc < 25) return { label: 'Normal', color: 'text-green-600 dark:text-green-400' }
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600 dark:text-yellow-400' }
    return { label: 'Obesidade', color: 'text-red-600 dark:text-red-400' }
  }

  // Prepare chart data (reverse order for chronological display)
  const chartData = [...measurements].reverse().map((m) => ({
    date: new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: m.peso,
    imc: m.imc
  }))

  const currentWeight = measurements.length > 0 ? measurements[0].peso : 0
  const currentIMC = measurements.length > 0 ? measurements[0].imc : 0
  const weightChange = measurements.length > 1 
    ? (currentWeight - measurements[measurements.length - 1].peso).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[#1a1a1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-[#1a1a1a] p-4 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} />
          Voltar ao Perfil
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Métricas Corporais</h1>
      </div>

      {/* Current Stats Cards */}
      {measurements.length > 0 && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 border border-gray-200 dark:border-[#404040]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Peso Atual</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currentWeight.toFixed(1)}kg</p>
            <p className={`text-sm mt-1 ${parseFloat(weightChange) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {parseFloat(weightChange) >= 0 ? '+' : ''}{weightChange}kg desde o início
            </p>
          </div>
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 border border-gray-200 dark:border-[#404040]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">IMC Atual</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currentIMC.toFixed(1)}</p>
            <p className={`text-sm mt-1 font-medium ${getIMCStatus(currentIMC).color}`}>
              {getIMCStatus(currentIMC).label}
            </p>
          </div>
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 border border-gray-200 dark:border-[#404040]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Medições</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{measurements.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Última: {new Date(measurements[0].data).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {measurements.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Evolução do Peso</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#27AE60" 
                  strokeWidth={2}
                  name="Peso (kg)"
                  dot={{ fill: '#27AE60', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Measurements History */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 border border-gray-200 dark:border-[#404040]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Histórico de Medições</h2>
          
          {measurements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma medição registrada ainda</p>
              <Button
                onClick={openAddModal}
                className="bg-[#27AE60] hover:bg-[#219150] text-white px-6 py-2"
              >
                Adicionar Primeira Medição
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {new Date(measurement.data).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    <div className="flex gap-4 mb-2">
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {measurement.peso.toFixed(1)}kg
                      </p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {(measurement.altura / 100).toFixed(2)}m
                      </p>
                      <p className={`text-lg font-semibold ${getIMCStatus(measurement.imc).color}`}>
                        IMC: {measurement.imc.toFixed(1)}
                      </p>
                    </div>
                    {measurement.notas && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{measurement.notas}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMeasurement(measurement)
                      setIsDeleteModalOpen(true)
                    }}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-6 bg-[#27AE60] hover:bg-[#219150] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-50"
        title="Adicionar medição"
      >
        <Plus size={24} />
      </button>

      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Nova Medição</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (metros)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAltura((prev) => Math.max(0.5, parseFloat(prev || '0') - 0.01).toFixed(2))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={newAltura}
                    onChange={(e) => setNewAltura(e.target.value)}
                    className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                    placeholder="1.75"
                  />
                  <button
                    type="button"
                    onClick={() => setNewAltura((prev) => Math.min(3, parseFloat(prev || '0') + 0.01).toFixed(2))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPeso((prev) => Math.max(20, parseFloat(prev || '0') - 0.1).toFixed(1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={newPeso}
                    onChange={(e) => setNewPeso(e.target.value)}
                    className="flex-1 border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 text-center"
                    placeholder="75.0"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPeso((prev) => Math.min(500, parseFloat(prev || '0') + 0.1).toFixed(1))}
                    className="bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 font-bold w-10 h-10 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações (opcional)</label>
                <textarea
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100 resize-none"
                  rows={2}
                  placeholder="Ex: Após treino pesado, Depois das férias..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewDate(new Date().toISOString().split('T')[0])
                  setNewPeso('')
                  setNewAltura('')
                  setNewNotas('')
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMeasurement}
                className="flex-1 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedMeasurement && (
        <div className="fixed inset-0 z-70 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg p-6 w-80 border border-gray-200 dark:border-[#404040]">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Confirmar Exclusão</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Tem certeza de que deseja excluir esta medição?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedMeasurement(null)
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMeasurement}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
