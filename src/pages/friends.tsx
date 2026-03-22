import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { UserPill } from '../components/user-pill'
import { AddFriendModal } from '../components/add-friend-modal'
import { PendingRequestsModal } from '../components/pending-requests-modal'
import { UserPlus, Inbox, Search, Flame, UsersRound } from 'lucide-react'

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

export function Friends() {
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('usuarioId') || ''
  const [searchTerm, setSearchTerm] = useState('')
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false)
  
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!currentUserId) return
    
    // Listen for pending requests count
    const qPending = query(
      collection(db, 'amizades'),
      where('receptorID', '==', currentUserId),
      where('status', '==', 'pendente')
    )
    
    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      setPendingCount(snapshot.size)
    })
    
    return () => unsubscribePending()
  }, [currentUserId])

  const fetchFriends = async () => {
    if (!currentUserId) return
    
    try {
      setLoading(true)
      const qFriends = query(
        collection(db, 'amizades'),
        where('participantes', 'array-contains', currentUserId),
        where('status', '==', 'aceito')
      )
      
      const snap = await getDocs(qFriends)
      const amigosList: Amigo[] = []
      
      for (const authDoc of snap.docs) {
        const data = authDoc.data()
        const friendId = data.participantes.find((id: string) => id !== currentUserId)
        if (friendId) {
          const userSnap = await getDoc(doc(db, 'usuarios', friendId))
          if (userSnap.exists()) {
            amigosList.push({
              amizadeId: authDoc.id,
              usuario: { id: userSnap.id, ...userSnap.data() } as Usuario
            })
          }
        }
      }
      
      setAmigos(amigosList)
    } catch (error) {
      console.error('Erro ao buscar amigos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [currentUserId])

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

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-28 md:py-8 space-y-4">
      {/* Container Principal */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl border border-gray-100 dark:border-[#2a2a2a]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            <UsersRound className="text-[#27AE60]" size={32} />
            <h2>Meus Amigos</h2>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsRequestsModalOpen(true)}
              className="cursor-pointer relative flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold py-2.5 px-4 rounded-xl transition-colors border border-blue-100 dark:border-blue-900/30"
            >
              <Inbox size={20} />
              <span className="md:hidden lg:inline">Solicitações</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="cursor-pointer flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#27AE60] hover:bg-[#219150] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
            >
              <UserPlus size={20} />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Search */}
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

        {/* List */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="w-10 h-10 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : amigos.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#333]">
              <UsersRound size={56} className="mb-4 text-gray-300 dark:text-gray-600 opacity-50" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Você ainda não tem amigos adicionados</p>
              <p className="text-sm">Encontre pessoas e compartilhe sua jornada!</p>
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
                  onClick={() => navigate(`/friend/${amigo.usuario.id}`)}
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
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddFriendModal 
          currentUserId={currentUserId}
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
      
      {isRequestsModalOpen && (
        <PendingRequestsModal 
          currentUserId={currentUserId}
          onClose={() => {
            setIsRequestsModalOpen(false)
            fetchFriends() // Refresh friends list if they accepted any
          }} 
        />
      )}
    </main>
  )
}