import { useState, useEffect } from 'react'
import { X, Check, X as XIcon, Inbox } from 'lucide-react'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { UserPill } from './user-pill'

interface Usuario {
  id: string
  nome: string
  username?: string
  photoURL?: string
}

interface Solicitacao {
  id: string // id do documento da amizade
  solicitante: Usuario
  dataCriacao: string
}

interface PendingRequestsModalProps {
  onClose: () => void
  currentUserId: string
}

export function PendingRequestsModal({ onClose, currentUserId }: PendingRequestsModalProps) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // amizade id

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const q = query(
          collection(db, 'amizades'),
          where('receptorID', '==', currentUserId),
          where('status', '==', 'pendente')
        )
        const snap = await getDocs(q)
        
        const requestsData: Solicitacao[] = []
        
        for (const authDoc of snap.docs) {
          const data = authDoc.data()
          // Fetch the requester profile
          const userSnap = await getDoc(doc(db, 'usuarios', data.solicitanteID))
          if (userSnap.exists()) {
            requestsData.push({
              id: authDoc.id,
              solicitante: { id: userSnap.id, ...userSnap.data() } as Usuario,
              dataCriacao: data.dataCriacao
            })
          }
        }
        
        setSolicitacoes(requestsData.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()))
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [currentUserId])

  const handleAccept = async (solicitationId: string) => {
    try {
      setActionLoading(solicitationId)
      await updateDoc(doc(db, 'amizades', solicitationId), {
        status: 'aceito'
      })
      // Remove from list
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitationId))
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (solicitationId: string) => {
    try {
      setActionLoading(solicitationId)
      await deleteDoc(doc(db, 'amizades', solicitationId))
      // Remove from list
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitationId))
    } catch (error) {
      console.error('Erro ao recusar solicitação:', error)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#333]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox size={22} className="text-blue-500" />
            Solicitações Pendentes
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-[#121212]/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <Inbox size={48} className="mb-4 text-gray-300 dark:text-gray-600 opacity-50" />
              <p>Você não tem solicitações de amizade no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map(req => (
                <UserPill
                  key={req.id}
                  nome={req.solicitante.nome}
                  username={req.solicitante.username}
                  photoURL={req.solicitante.photoURL}
                >
                  <div className="flex items-center gap-2">
                    {actionLoading === req.id ? (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-4"></div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="cursor-pointer p-2 bg-[#27AE60]/10 hover:bg-[#27AE60]/20 text-[#27AE60] rounded-full transition-colors focus:ring-2 focus:ring-[#27AE60] outline-none"
                          title="Aceitar"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="cursor-pointer p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors focus:ring-2 focus:ring-red-500 outline-none"
                          title="Recusar"
                        >
                          <XIcon size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </UserPill>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
