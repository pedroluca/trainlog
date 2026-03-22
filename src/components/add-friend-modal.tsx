import { useState, useEffect, useMemo } from 'react'
import { X, Search, UserPlus, Clock, Check } from 'lucide-react'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { UserPill } from './user-pill'
import { Button } from './button'

interface Usuario {
  id: string
  nome: string
  username?: string
  photoURL?: string
  isFounder?: boolean
  isPremium?: boolean
}

interface Amizade {
  id: string
  solicitanteID: string
  receptorID: string
  status: 'pendente' | 'aceito'
  participantes: string[]
}

interface AddFriendModalProps {
  onClose: () => void
  currentUserId: string
}

export function AddFriendModal({ onClose, currentUserId }: AddFriendModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [amizades, setAmizades] = useState<Amizade[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // user id

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Fetch all users
        const usersSnap = await getDocs(collection(db, 'usuarios'))
        const usersList = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Usuario))
          .filter(u => u.id !== currentUserId)
        
        setUsuarios(usersList)

        // 2. Fetch current user friendships (to know status)
        const q = query(
          collection(db, 'amizades'),
          where('participantes', 'array-contains', currentUserId)
        )
        const amizadesSnap = await getDocs(q)
        const amizadesList = amizadesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Amizade))
        setAmizades(amizadesList)

      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUserId])

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return []
    const lowerSearch = searchTerm.toLowerCase()
    return usuarios.filter(u => 
      u.nome.toLowerCase().includes(lowerSearch) || 
      (u.username && u.username.toLowerCase().includes(lowerSearch))
    )
  }, [usuarios, searchTerm])

  const getFriendshipStatus = (otherUserId: string) => {
    const amizade = amizades.find(a => a.participantes.includes(otherUserId))
    if (!amizade) return 'none'
    if (amizade.status === 'aceito') return 'aceito'
    if (amizade.solicitanteID === currentUserId) return 'enviado'
    return 'recebido'
  }

  const handleSendRequest = async (receptorID: string) => {
    try {
      setActionLoading(receptorID)
      const novaAmizade = {
        solicitanteID: currentUserId,
        receptorID,
        status: 'pendente',
        participantes: [currentUserId, receptorID],
        dataCriacao: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'amizades'), novaAmizade)
      
      // Update local state
      setAmizades(prev => [...prev, { id: docRef.id, ...novaAmizade } as Amizade])
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#333]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Amigo</h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 border-b border-gray-100 dark:border-[#333]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou username..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#404040] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#27AE60] dark:focus:ring-[#27AE60] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 dark:bg-[#121212]/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !searchTerm.trim() ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <Search size={48} className="mb-4 text-gray-300 dark:text-gray-600 opacity-50" />
              <p>Digite um nome ou username para buscar amigos.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => {
                const status = getFriendshipStatus(user.id)
                
                return (
                  <UserPill
                    key={user.id}
                    nome={user.nome}
                    username={user.username}
                    photoURL={user.photoURL}
                    isFounder={user.isFounder}
                    isPremium={user.isPremium}
                  >
                    {status === 'none' && (
                      <Button
                        onClick={() => handleSendRequest(user.id)}
                        disabled={actionLoading === user.id}
                        className="bg-[#27AE60] hover:bg-[#219150] text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 min-w-[100px] justify-center"
                      >
                        {actionLoading === user.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            Adicionar
                          </>
                        )}
                      </Button>
                    )}
                    
                    {status === 'enviado' && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#333] px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Clock size={16} />
                        Pendente
                      </div>
                    )}
                    
                    {status === 'recebido' && (
                      <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Olhe as solicitações
                      </div>
                    )}
                    
                    {status === 'aceito' && (
                      <div className="flex items-center gap-1 text-[#27AE60] dark:text-[#2ecc71] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Check size={16} />
                        Amigo
                      </div>
                    )}
                  </UserPill>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
