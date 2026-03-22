import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { UserPill } from '../components/user-pill'
import { Search, Flame, UsersRound, ArrowLeft, Lock } from 'lucide-react'

interface Usuario {
  id: string
  nome: string
  username?: string
  photoURL?: string
  lastWorkoutDate?: string
  isFounder?: boolean
  isPremium?: boolean
}

interface Amigo {
  amizadeId: string
  usuario: Usuario
}

export function FriendFriends() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('usuarioId') || ''
  
  const [searchTerm, setSearchTerm] = useState('')
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [loading, setLoading] = useState(true)
  const [friendName, setFriendName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const fetchFriendAndFriends = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Get the friend user first to check privacy
      const userSnap = await getDoc(doc(db, 'usuarios', id))
      if (!userSnap.exists()) {
        setIsPrivate(true)
        return
      }
      
      const userData = userSnap.data()
      setFriendName(userData.nome || 'Amigo')
      
      if (userData.privacidade?.ocultarAmigos) {
        setIsPrivate(true)
        return
      }
      
      // Fetch friends
      const qFriends = query(
        collection(db, 'amizades'),
        where('participantes', 'array-contains', id),
        where('status', '==', 'aceito')
      )
      
      const snap = await getDocs(qFriends)
      const amigosList: Amigo[] = []
      
      for (const authDoc of snap.docs) {
        const data = authDoc.data()
        const targetId = data.participantes.find((pId: string) => pId !== id)
        if (targetId) {
          const uSnap = await getDoc(doc(db, 'usuarios', targetId))
          if (uSnap.exists()) {
            amigosList.push({
              amizadeId: authDoc.id,
              usuario: { id: uSnap.id, ...uSnap.data() } as Usuario
            })
          }
        }
      }
      
      setAmigos(amigosList)
    } catch (error) {
      console.error('Erro ao buscar amigos do amigo:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriendAndFriends()
  }, [id])

  const filteredAmigos = useMemo(() => {
    if (!searchTerm.trim()) return amigos
    const lowerSearch = searchTerm.toLowerCase()
    return amigos.filter(a => 
      a.usuario.nome.toLowerCase().includes(lowerSearch) || 
      (a.usuario.username && a.usuario.username.toLowerCase().includes(lowerSearch))
    )
  }, [amigos, searchTerm])

  const isAtivoRecentemente = (lastWorkoutDate?: string) => {
    if (!lastWorkoutDate) return false
    const lastDate = new Date(lastWorkoutDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  const handleUserClick = (userId: string) => {
    if (userId === currentUserId) {
      navigate('/profile')
    } else {
      navigate(`/friend/${userId}`)
    }
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-28 md:py-8 space-y-4">
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl border border-gray-100 dark:border-[#2a2a2a] relative">
        <button
          onClick={() => navigate(`/friend/${id}`)}
          className="cursor-pointer absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 transition-colors z-10"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-4 mb-6 mt-8 md:mt-2">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Amigos de {friendName}</h2>
          </div>
        </div>

        {isPrivate ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <Lock size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-center">A lista de amigos deste usuário é privada.</p>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar amigo por nome ou username..."
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#404040] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#27AE60] dark:focus:ring-[#27AE60] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="min-h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-[200px]">
                  <div className="w-10 h-10 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : amigos.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#333]">
                  <UsersRound size={56} className="mb-4 text-gray-300 dark:text-gray-600 opacity-50" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Este usuário não tem amigos adicionados</p>
                </div>
              ) : filteredAmigos.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <p>Nenhum amigo encontrado na busca.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAmigos.map(amigo => (
                    <UserPill
                      key={amigo.amizadeId}
                      nome={amigo.usuario.nome}
                      username={amigo.usuario.username}
                      photoURL={amigo.usuario.photoURL}
                      isFounder={amigo.usuario.isFounder}
                      isPremium={amigo.usuario.isPremium}
                      onClick={() => handleUserClick(amigo.usuario.id)}
                    >
                      {isAtivoRecentemente(amigo.usuario.lastWorkoutDate) ? (
                        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/10 text-orange-500 border border-orange-200 dark:border-orange-800/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                          <Flame size={14} className="animate-pulse" />
                          <span>Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#333] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-[#404040] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                          <span>Ausente</span>
                        </div>
                      )}
                    </UserPill>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
