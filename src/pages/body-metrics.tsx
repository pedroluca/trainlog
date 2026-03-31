import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { Button } from '../components/button'
import { Toast, ToastState } from '../components/toast'

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
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')

  // Form states
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newPeso, setNewPeso] = useState('')
  const [newAltura, setNewAltura] = useState('')
  const [newNotas, setNewNotas] = useState('')
  
  // Toast state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  // Function to open add modal with pre-filled data
  const openAddModal = () => {
    if (measurements.length > 0) {
      const lastMeasurement = measurements[0]
      setNewPeso(lastMeasurement.peso.toString())
      setNewAltura((lastMeasurement.altura / 100).toString())
    } else {
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
        
        const measurementsData: BodyMeasurement[] = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          } as BodyMeasurement))
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        setMeasurements(measurementsData)
        if (measurementsData.length > 0) {
          setSelectedHistoryId(measurementsData[0].id)
        }
      } catch (err) {
        setToast({ show: true, message: 'Erro ao buscar medições. Verifique o console para detalhes.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    const checkPremium = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const isPremiumUser = userDoc.data()?.isPremium || false
          
          if (!isPremiumUser) {
            setToast({ show: true, message: 'Esta página é exclusiva para usuários Premium.', type: 'error' })
            navigate('/profile')
            return
          }
          
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
      
      const measurementsData: BodyMeasurement[] = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as BodyMeasurement))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      setMeasurements(measurementsData)
      if (measurementsData.length > 0 && !measurementsData.find(m => m.id === selectedHistoryId)) {
        setSelectedHistoryId(measurementsData[0].id)
      } else if (measurementsData.length === 0) {
        setSelectedHistoryId('')
      }
    } catch (err) {
      console.error('Erro ao buscar medições:', err)
    }
  }

  const handleAddMeasurement = async () => {
    if (!usuarioID) return

    const peso = parseFloat(newPeso)
    const altura = parseFloat(newAltura) * 100

    if (!peso || !altura || peso < 20 || peso > 500 || altura < 50 || altura > 300) {
      setToast({ show: true, message: 'Por favor, insira valores válidos (Altura: 0.50-3.00m, Peso: 20-500kg)', type: 'error' })
      return
    }

    try {
      const imc = peso / Math.pow(altura / 100, 2)

      const docRef = await addDoc(collection(db, 'medicoescorporais'), {
        usuarioID,
        data: new Date(newDate).toISOString(),
        peso,
        altura,
        imc: parseFloat(imc.toFixed(1)),
        notas: newNotas || undefined
      })

      setIsAddModalOpen(false)
      setSelectedHistoryId(docRef.id)
      setNewDate(new Date().toISOString().split('T')[0])
      setNewPeso('')
      setNewAltura('')
      setNewNotas('')
      
      await refetchMeasurements()
      setSelectedHistoryId(docRef.id) // Ensure new measurement is selected
      setToast({ show: true, message: 'Medição adicionada com sucesso!', type: 'success' })
    } catch (err) {
      setToast({ show: true, message: 'Erro ao adicionar medição. Tente novamente.', type: 'error' })
    }
  }

  const handleDeleteMeasurement = async () => {
    if (!selectedMeasurement) return

    try {
      await deleteDoc(doc(db, 'medicoescorporais', selectedMeasurement.id))
      setIsDeleteModalOpen(false)
      setSelectedMeasurement(null)
      await refetchMeasurements()
      
      if (measurements.length > 1) { // Will be length-1 after refetch
        const remaining = measurements.filter(m => m.id !== selectedMeasurement.id)
        if (remaining.length > 0 && selectedHistoryId === selectedMeasurement.id) {
          setSelectedHistoryId(remaining[0].id)
        }
      } else {
        setSelectedHistoryId('')
      }
      
      setToast({ show: true, message: 'Medição excluída com sucesso!', type: 'success' })
    } catch (err) {
      setToast({ show: true, message: 'Erro ao excluir medição. Tente novamente.', type: 'error' })
    }
  }

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50' }
    if (imc < 25) return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50' }
    if (imc < 30) return { label: 'Sobrepeso', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800/50' }
    return { label: 'Obesidade', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', border: 'border-red-200 dark:border-red-800/50' }
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

  const parsedWeightChange = parseFloat(weightChange)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const activeMeasurement = measurements.find(m => m.id === selectedHistoryId) || measurements[0];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#2a2a2a] px-4 py-8 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Voltar ao Perfil
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shadow-inner border border-emerald-200/50 dark:border-emerald-800/30">
              <Activity size={26} className="text-[#27AE60] dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Métricas Corporais
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium">
            Seu progresso de composição em detalhes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Current Stats Cards */}
        {measurements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] rounded-3xl p-6 border border-gray-100 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Peso Atual</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{currentWeight.toFixed(1)}<span className="text-xl text-gray-400 font-semibold ml-1">kg</span></p>
              </div>
              
              <div className={`inline-flex items-center gap-1 mt-4 px-3 py-1.5 rounded-full text-xs font-bold border ${
                parsedWeightChange > 0 ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30' : 
                parsedWeightChange < 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : 
                'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}>
                {parsedWeightChange > 0 ? <TrendingUp size={14} /> : parsedWeightChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                <span>{parsedWeightChange > 0 ? '+' : ''}{weightChange}kg total</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] rounded-3xl p-6 border border-gray-100 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">IMC Atual</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{currentIMC.toFixed(1)}</p>
              
              <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-bold border ${getIMCStatus(currentIMC).color} ${getIMCStatus(currentIMC).border}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></div>
                {getIMCStatus(currentIMC).label}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] rounded-3xl p-6 border border-gray-100 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Total de Medições</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{measurements.length}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-4">
                Última: <span className="text-gray-700 dark:text-gray-300">{new Date(measurements[0].data).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        {measurements.length > 0 && (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-100 dark:border-[#2a2a2a] shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Evolução do Peso</h2>
            <div className="h-[300px] w-full mt-2 -ml-2 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" strokeOpacity={0.15} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#27AE60', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 30, 30, 0.85)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#F3F4F6',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      padding: '12px 16px',
                      fontWeight: 600
                    }}
                    itemStyle={{ color: '#F3F4F6' }}
                    labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#27AE60" 
                    strokeWidth={4}
                    name="Peso (kg)"
                    dot={{ fill: '#1e1e1e', stroke: '#27AE60', strokeWidth: 3, r: 5 }}
                    activeDot={{ fill: '#27AE60', stroke: '#white', strokeWidth: 2, r: 7 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Measurements Timeline/Cards */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-5 md:p-8 border border-gray-100 dark:border-[#2a2a2a] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Registro Individual</h2>
            
            {measurements.length > 0 && (
              <div className="relative">
                <select
                  value={selectedHistoryId}
                  onChange={(e) => setSelectedHistoryId(e.target.value)}
                  className="cursor-pointer appearance-none bg-gray-50 focus:bg-white dark:bg-[#252525] dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 w-full sm:w-auto outline-none transition-all focus:ring-2 focus:ring-[#27AE60]/20 focus:border-[#27AE60] dark:focus:border-emerald-500 shadow-sm"
                >
                  {measurements.map(m => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.data).toLocaleDateString('pt-BR')} — {m.peso.toFixed(1)}kg
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            )}
          </div>
          
          {measurements.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-dashed border-gray-300 dark:border-[#404040]">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-[#27AE60] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Nenhuma medição registrada</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Registre seu peso e altura para acompanhar sua evolução.</p>
              <Button
                onClick={openAddModal}
                className="bg-[#27AE60] hover:bg-[#219150] shadow-md shadow-emerald-600/20 text-white px-6 py-3"
              >
                Adicionar Primeira Medição
              </Button>
            </div>
          ) : activeMeasurement ? (
            <div className={`group relative overflow-hidden bg-white dark:bg-[#252525] border ${measurements[0].id === activeMeasurement.id ? 'border-emerald-200 dark:border-emerald-800/40 shadow-md shadow-emerald-500/5' : 'border-gray-100 dark:border-[#333] shadow-sm'} rounded-2xl p-6 md:p-8 flex flex-col items-start transition-all`}>
              {measurements[0].id === activeMeasurement.id && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100 to-transparent dark:from-emerald-900/30 -z-0 rounded-bl-[3rem] opacity-60"></div>}
              
              <div className="flex justify-between w-full items-start z-10">
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                      {new Date(activeMeasurement.data).toLocaleDateString('pt-BR', { 
                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
                      })}
                    </p>
                    {measurements[0].id === activeMeasurement.id && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm">Mais Recente</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-6 mt-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Peso</p>
                      <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{activeMeasurement.peso.toFixed(1)}<span className="text-base text-gray-500 ml-1">kg</span></p>
                    </div>
                    
                    <div className="w-px h-12 bg-gray-200 dark:bg-[#404040] hidden sm:block"></div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Altura</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">{(activeMeasurement.altura / 100).toFixed(2)}<span className="text-base text-gray-500 ml-1">m</span></p>
                    </div>
                    
                    <div className="w-px h-12 bg-gray-200 dark:bg-[#404040] hidden md:block"></div>
                    
                    <div className="flex flex-col items-start w-full md:w-auto mt-2 md:mt-0">
                       <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">IMC</p>
                       <div className="flex items-center gap-3">
                         <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-200">{activeMeasurement.imc.toFixed(1)}</p>
                         <span className={`text-[11px] px-3 py-1 rounded-full font-bold border shadow-sm ${getIMCStatus(activeMeasurement.imc).color} ${getIMCStatus(activeMeasurement.imc).border}`}>
                           {getIMCStatus(activeMeasurement.imc).label}
                         </span>
                       </div>
                    </div>
                  </div>

                  {activeMeasurement.notas && (
                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-[#404040] bg-gray-50/50 dark:bg-[#2a2a2a]/30 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Observações</p>
                      <p className="text-base text-gray-700 dark:text-gray-300 font-medium italic flex gap-2 items-start">
                        <span className="text-gray-300 dark:text-[#444] text-2xl leading-none">"</span>
                        {activeMeasurement.notas}
                        <span className="text-gray-300 dark:text-[#444] text-2xl leading-none">"</span>
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedMeasurement(activeMeasurement)
                    setIsDeleteModalOpen(true)
                  }}
                  className="cursor-pointer text-gray-400 hover:text-red-500 dark:text-[#555] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                  aria-label="Deletar medição"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openAddModal}
        className="cursor-pointer fixed bottom-24 right-6 lg:right-12 bg-gradient-to-r from-[#27AE60] to-emerald-600 hover:from-[#219150] hover:to-emerald-700 text-white rounded-2xl p-4 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all hover:-translate-y-1 active:scale-95 z-50 flex items-center justify-center border border-emerald-400/20"
        title="Adicionar medição"
      >
        <Plus size={28} />
      </button>

      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-[#333] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Nova Medição</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-50 focus:bg-white dark:bg-[#252525] dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] focus:ring-2 focus:ring-[#27AE60]/20 focus:border-[#27AE60] dark:focus:border-emerald-500 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Altura <span className="text-gray-400 font-normal normal-case tracking-normal">(metros)</span></label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAltura((prev) => Math.max(0.5, parseFloat(prev || '0') - 0.01).toFixed(2))}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold w-12 h-12 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={newAltura}
                    onChange={(e) => setNewAltura(e.target.value)}
                    className="flex-1 bg-gray-50 focus:bg-white dark:bg-[#252525] dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] focus:ring-2 focus:ring-[#27AE60]/20 focus:border-[#27AE60] dark:focus:border-emerald-500 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-center font-bold text-lg transition-all outline-none"
                    placeholder="1.75"
                  />
                  <button
                    type="button"
                    onClick={() => setNewAltura((prev) => Math.min(3, parseFloat(prev || '0') + 0.01).toFixed(2))}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold w-12 h-12 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Peso <span className="text-gray-400 font-normal normal-case tracking-normal">(kg)</span></label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPeso((prev) => Math.max(20, parseFloat(prev || '0') - 0.1).toFixed(1))}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold w-12 h-12 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={newPeso}
                    onChange={(e) => setNewPeso(e.target.value)}
                    className="flex-1 bg-gray-50 focus:bg-white dark:bg-[#252525] dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] focus:ring-2 focus:ring-[#27AE60]/20 focus:border-[#27AE60] dark:focus:border-emerald-500 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-center font-bold text-lg transition-all outline-none"
                    placeholder="75.0"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPeso((prev) => Math.min(500, parseFloat(prev || '0') + 0.1).toFixed(1))}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#333] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold w-12 h-12 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Observações <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span></label>
                <textarea
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white dark:bg-[#252525] dark:focus:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] focus:ring-2 focus:ring-[#27AE60]/20 focus:border-[#27AE60] dark:focus:border-emerald-500 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Ex: Após treino pesado, balança nova..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewDate(new Date().toISOString().split('T')[0])
                  setNewPeso('')
                  setNewAltura('')
                  setNewNotas('')
                }}
                className="flex-[0.4] bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold py-3.5 px-4 rounded-xl transition-colors active:scale-95 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMeasurement}
                className="flex-1 bg-gradient-to-r from-[#27AE60] to-emerald-600 hover:from-[#219150] hover:to-emerald-700 shadow-md shadow-emerald-500/20 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95"
              >
                Salvar Medição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedMeasurement && (
        <div className="fixed inset-0 z-70 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 md:p-8 w-full max-w-sm border border-gray-100 dark:border-[#333] shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Confirmar Exclusão</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
              Tem certeza de que deseja deletar permanentemente a medição do dia <span className="font-bold">{new Date(selectedMeasurement.data).toLocaleDateString()}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedMeasurement(null)
                }}
                className="cursor-pointer flex-1 bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#404040] text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-xl transition-colors active:scale-95 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMeasurement}
                className="cursor-pointer flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/20 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </div>
      )}
    </main>
  )
}
