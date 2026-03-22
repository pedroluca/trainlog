import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { ArrowLeft, Lock, UsersRound, Dumbbell, Activity } from 'lucide-react'

// Types
interface Privacidade {
  ocultarEmail?: boolean
  ocultarNascimento?: boolean
  ocultarAtividades?: boolean
  ocultarTreinos?: boolean
  ocultarAmigos?: boolean
  ocultarStreak?: boolean
  ocultarPeso?: boolean
  ocultarAltura?: boolean
  ocultarInstagram?: boolean
}

interface UsuarioProfile {
  id: string
  nome: string
  username?: string
  photoURL?: string
  email?: string
  dataNascimento?: string
  instagram?: string
  altura?: number
  peso?: number
  currentStreak?: number
  longestStreak?: number
  privacidade?: Privacidade
}

interface LogEntry {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  data: string
}

interface ExercicioBasico {
  nome: string
}

interface TreinoListItem {
  id: string
  dia: string
  musculo: string
  nome: string
  exercicios: ExercicioBasico[]
}

export function FriendProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('usuarioId')
  const [isPremiumObserver, setIsPremiumObserver] = useState(false)
  
  const [profile, setProfile] = useState<UsuarioProfile | null>(null)
  const [friendsCount, setFriendsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Tabs: 'atividades' | 'treinos'
  const [activeTab, setActiveTab] = useState<'atividades' | 'treinos'>('atividades')
  
  // Data for tabs
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [treinos, setTreinos] = useState<TreinoListItem[]>([])
  const [loadingTreinos, setLoadingTreinos] = useState(false)
  const [logsLimit, setLogsLimit] = useState(7) // Start with 7 days approx

  useEffect(() => {
    // Determine if the *viewer* is premium
    const checkPremium = async () => {
      if (!currentUserId) return
      const meRef = doc(db, 'usuarios', currentUserId)
      const meSnap = await getDoc(meRef)
      if (meSnap.exists()) {
        setIsPremiumObserver(meSnap.data().isPremium === true)
      }
    }
    checkPremium()
  }, [currentUserId])

  useEffect(() => {
    if (!id) return
    const fetchUserAndCount = async () => {
      setLoading(true)
      try {
        const userRef = doc(db, 'usuarios', id)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setProfile({ id: userSnap.id, ...userSnap.data() } as UsuarioProfile)
        }

        const q = query(
          collection(db, 'amizades'),
          where('participantes', 'array-contains', id),
          where('status', '==', 'aceito')
        )
        const snapCount = await getDocs(q)
        setFriendsCount(snapCount.size)
      } catch (err) {
        console.error('Erro ao buscar perfil do amigo:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndCount()
  }, [id])

  useEffect(() => {
    if (!profile) return
    if (activeTab === 'atividades' && !profile.privacidade?.ocultarAtividades) {
      fetchLogsData()
    } else if (activeTab === 'treinos' && !profile.privacidade?.ocultarTreinos) {
      if (treinos.length === 0) fetchTreinosData()
    }
  }, [profile, activeTab, logsLimit])

  const fetchLogsData = async () => {
    if (!id) return
    setLoadingLogs(true)
    try {
      const logsRef = collection(db, 'logs')
      const q = query(
        logsRef,
        where('usuarioID', '==', id),
        orderBy('data', 'desc'),
        limit(logsLimit)
      )
      const snap = await getDocs(q)
      const fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry))
      setLogs(fetchedLogs)
    } catch (err) {
      console.error('Erro ao buscar logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchTreinosData = async () => {
    if (!id) return
    setLoadingTreinos(true)
    try {
      const treinosRef = collection(db, 'treinos')
      const q = query(treinosRef, where('usuarioID', '==', id))
      const snap = await getDocs(q)
      
      const list: TreinoListItem[] = []
      for (const tDoc of snap.docs) {
        const tData = tDoc.data()
        
        // Fetch subcollection exercicios
        const exRef = collection(tDoc.ref, 'exercicios')
        const exSnap = await getDocs(exRef)
        const exerciciosBasicos = exSnap.docs.map(e => ({ nome: e.data().titulo || 'Exercicio sem nome' }))

        list.push({
          id: tDoc.id,
          dia: tData.dia,
          musculo: tData.musculo,
          nome: tData.nome || tData.musculo, // Fallback if no specific nome exists
          exercicios: exerciciosBasicos
        })
      }
      setTreinos(list)
    } catch (err) {
      console.error('Erro ao buscar treinos do amigo:', err)
    } finally {
      setLoadingTreinos(false)
    }
  }

  const handleLoadMoreLogs = () => {
    setLogsLimit(prev => prev + 10)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212]">
        <div className="w-10 h-10 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4">
        <UsersRound size={64} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">Usuário não encontrado</h2>
        <button onClick={() => navigate('/friends')} className="mt-6 text-blue-500 hover:underline">
          Voltar para amigos
        </button>
      </div>
    )
  }

  const isDentroDosSeteDias = (dataIso: string) => {
    const data = new Date(dataIso)
    const hj = new Date()
    const diff = hj.getTime() - data.getTime()
    return diff <= 7 * 24 * 60 * 60 * 1000
  }

  const priv = profile.privacidade || {}

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-24 md:py-8">
      {/* Container header and info */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl lg:max-w-5xl border border-gray-100 dark:border-[#2a2a2a] mb-6 relative">
        <button
          onClick={() => navigate('/friends')}
          className="cursor-pointer absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Profile Head */}
        <div className="flex flex-col items-center pt-8 md:pt-4 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#27AE60] to-[#1E8449] rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-inner mb-3">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.nome.charAt(0).toUpperCase()
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{profile.nome}</h1>
          {profile.username && (
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium">@{profile.username}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {!priv.ocultarEmail && profile.email && (
            <div className="col-span-2 md:col-span-2 bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#333]">
              <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{profile.email}</p>
            </div>
          )}
          
          {!priv.ocultarNascimento && profile.dataNascimento && (
            <div className="col-span-1 border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3">
              <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Nascimento</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {new Date(profile.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          
          {!priv.ocultarInstagram && profile.instagram && (
            <div className="col-span-1 border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-3">
              <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">Instagram</p>
              <Link to={`https://instagram.com/${profile.instagram}`} target='_blank' className="block text-sm font-semibold text-blue-500 hover:underline max-w-full truncate">@{profile.instagram}</Link>
            </div>
          )}
          
          {!priv.ocultarAltura && profile.altura && profile.altura > 0 && (
             <div className="col-span-1 border border-gray-100 dark:border-[#333] bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-4 py-3">
               <p className="text-xs uppercase font-medium text-emerald-600 dark:text-emerald-400">Altura</p>
               <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">{(profile.altura / 100).toFixed(2)}m</p>
             </div>
          )}
          
          {!priv.ocultarPeso && profile.peso && profile.peso > 0 && (
             <div className="col-span-1 border border-gray-100 dark:border-[#333] bg-emerald-50 dark:bg-emerald-900/10 rounded-xl px-4 py-3">
               <p className="text-xs uppercase font-medium text-emerald-600 dark:text-emerald-400">Peso</p>
               <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">{profile.peso.toFixed(1)}kg</p>
             </div>
          )}
          
          {!priv.ocultarAmigos && (
             <div className="col-span-1 border border-gray-100 dark:border-[#333] bg-blue-50 dark:bg-blue-900/10 rounded-xl px-4 py-3">
               <p className="text-xs uppercase font-medium text-blue-600 dark:text-blue-400">Amigos</p>
               <p className="text-sm font-bold text-blue-900 dark:text-blue-300">{friendsCount}</p>
             </div>
          )}
          
          {!priv.ocultarStreak && (
             <div className="col-span-1 border border-orange-500/20 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 rounded-xl px-4 py-3">
               <p className="text-xs uppercase font-medium text-orange-600 dark:text-orange-400">Sequência</p>
               <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{profile.currentStreak || 0}</p>
             </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl">
        <div className="flex bg-gray-200 dark:bg-[#1e1e1e] p-1 rounded-xl mb-4 border border-gray-100 dark:border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('atividades')}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'atividades' 
                ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Activity size={18} /> Atividades
          </button>
          <button
            onClick={() => setActiveTab('treinos')}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'treinos' 
                ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Dumbbell size={18} /> Treinos
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 md:p-6 mb-6 w-full rounded-2xl border border-gray-100 dark:border-[#2a2a2a] min-h-[300px]">
          {/* ATIVIDADES */}
          {activeTab === 'atividades' && (
            <div className="p-4 md:p-0">
              {priv.ocultarAtividades ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                  <Lock size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium text-center">Este usuário prefere manter suas atividades privadas.</p>
                </div>
              ) : loadingLogs ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Nenhuma atividade recente encontrada.</div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => {
                    const isRecente = isDentroDosSeteDias(log.data)
                    const diaFim = new Date(log.data).toLocaleDateString('pt-BR')
                    const horaFim = new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    
                    if (!isRecente && !isPremiumObserver) {
                      // Freemium só vê dentro dos 7 dias, se for mais velho, ele vê que parou
                      return (
                        <div key={log.id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333] text-center text-gray-500">
                          <p>O usuário logou sua última atividade em {diaFim}</p>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={log.id} className="bg-white dark:bg-[#2d2d2d] rounded-lg p-4 shadow-sm border border-gray-100 dark:border-[#404040]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">{log.titulo || 'Exercício Concluído'}</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                              {log.series} séries × {log.repeticoes} repetições
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#333] px-2 py-1 rounded-md">{diaFim}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{horaFim}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {isPremiumObserver && logs.length >= logsLimit && (
                    <button 
                      onClick={handleLoadMoreLogs}
                      className="cursor-pointer w-full mt-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Veja mais atividades
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TREINOS */}
          {activeTab === 'treinos' && (
            <div className="p-4 md:p-0">
              {priv.ocultarTreinos ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                  <Lock size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium text-center">Os treinos deste usuário são privados.</p>
                </div>
              ) : loadingTreinos ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div></div>
              ) : treinos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">O usuário não possui treinos cadastrados.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {treinos.map(treino => (
                    <div key={treino.id} className="p-4 rounded-xl border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#252525] flex flex-col">
                      <div className="mb-3 border-b border-gray-200 dark:border-[#404040] pb-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate pr-2">{treino.nome}</h4>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded whitespace-nowrap">{treino.dia}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{treino.musculo}</p>
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Exercícios</p>
                        {treino.exercicios.length === 0 ? (
                          <p className="text-sm italic text-gray-400">Nenhum exercício...</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {treino.exercicios.map((ex, i) => (
                              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#27AE60]/60"></div>
                                {ex.nome}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
