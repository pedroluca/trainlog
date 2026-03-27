import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { UserPill } from '../components/user-pill'
import { Toast, ToastState } from '../components/toast'
import { Button } from '../components/button'
import { Check, Search, UserPlus, X, UserRound, ShieldCheck, Link2 } from 'lucide-react'

type UserProfile = {
  id: string
  nome: string
  username?: string
  email?: string
  photoURL?: string
  isTrainer?: boolean
  isPremium?: boolean
  isFounder?: boolean
}

type TrainerRelation = {
  id: string
  trainerId: string
  studentId: string
  status: 'pending' | 'accepted'
  requestedByRole: 'trainer' | 'student'
  requesterId: string
  targetId: string
  participants: string[]
  createdAt: string
  updatedAt: string
  respondedAt?: string
}

type PendingRequestView = {
  relation: TrainerRelation
  requester: UserProfile
}

export function TrainerConnections() {
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('usuarioId') || ''

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [sentOrReceivedRelations, setSentOrReceivedRelations] = useState<TrainerRelation[]>([])
  const [acceptedAsTrainer, setAcceptedAsTrainer] = useState<UserProfile[]>([])
  const [acceptedAsStudent, setAcceptedAsStudent] = useState<UserProfile[]>([])
  const [pendingReceived, setPendingReceived] = useState<PendingRequestView[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })

  const isTrainer = !!currentUser?.isTrainer

  const loadData = useCallback(async () => {
    if (!currentUserId) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)

      const meSnap = await getDoc(doc(db, 'usuarios', currentUserId))
      if (!meSnap.exists()) {
        navigate('/login')
        return
      }

      const me = { id: meSnap.id, ...meSnap.data() } as UserProfile
      setCurrentUser(me)

      const relationSnap = await getDocs(
        query(collection(db, 'trainer_relations'), where('participants', 'array-contains', currentUserId))
      )

      const relations = relationSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainerRelation))
      setSentOrReceivedRelations(relations)

      const receivedPending = relations.filter((r) => r.status === 'pending' && r.targetId === currentUserId)
      const requesterIds = Array.from(new Set(receivedPending.map((r) => r.requesterId)))
      const requesters = await Promise.all(requesterIds.map((id) => getDoc(doc(db, 'usuarios', id))))

      const requestersMap = new Map<string, UserProfile>()
      requesters.forEach((snap) => {
        if (snap.exists()) {
          requestersMap.set(snap.id, { id: snap.id, ...snap.data() } as UserProfile)
        }
      })

      setPendingReceived(
        receivedPending
          .map((relation) => ({ relation, requester: requestersMap.get(relation.requesterId) }))
          .filter((item): item is PendingRequestView => !!item.requester)
          .sort((a, b) => new Date(b.relation.createdAt).getTime() - new Date(a.relation.createdAt).getTime())
      )

      const acceptedForTrainer = relations.filter((r) => r.status === 'accepted' && r.trainerId === currentUserId)
      const acceptedForStudent = relations.filter((r) => r.status === 'accepted' && r.studentId === currentUserId)

      const studentIds = Array.from(new Set(acceptedForTrainer.map((r) => r.studentId)))
      const trainerIds = Array.from(new Set(acceptedForStudent.map((r) => r.trainerId)))

      const [studentSnaps, trainerSnaps] = await Promise.all([
        Promise.all(studentIds.map((id) => getDoc(doc(db, 'usuarios', id)))),
        Promise.all(trainerIds.map((id) => getDoc(doc(db, 'usuarios', id)))),
      ])

      setAcceptedAsTrainer(
        studentSnaps
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() } as UserProfile))
      )

      setAcceptedAsStudent(
        trainerSnaps
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() } as UserProfile))
      )
    } catch (error) {
      console.error('Erro ao carregar conexoes treinador-aluno:', error)
      setToast({ show: true, message: 'Erro ao carregar conexoes.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentUserId, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const outgoingPending = useMemo(
    () => sentOrReceivedRelations.filter((r) => r.status === 'pending' && r.requesterId === currentUserId),
    [sentOrReceivedRelations, currentUserId]
  )

  const findExistingRelation = (otherUserId: string) => {
    return sentOrReceivedRelations.find(
      (relation) => relation.trainerId === otherUserId || relation.studentId === otherUserId
    )
  }

  const normalizeSearch = (term: string) => term.trim().replace(/^@/, '')

  const handleSearch = async () => {
    const normalized = normalizeSearch(searchTerm)
    if (!normalized) {
      setToast({ show: true, message: 'Digite username ou email para buscar.', type: 'error' })
      return
    }

    try {
      setSearchLoading(true)
      setSearchResult(null)

      const byUsername = await getDocs(query(collection(db, 'usuarios'), where('username', '==', normalized)))
      let userDoc = byUsername.docs[0]

      if (!userDoc) {
        const byEmail = await getDocs(
          query(collection(db, 'usuarios'), where('email', '==', normalized.toLowerCase()))
        )
        userDoc = byEmail.docs[0]
      }

      if (!userDoc) {
        setToast({ show: true, message: 'Nenhum usuario encontrado com esse username/email exato.', type: 'info' })
        return
      }

      if (userDoc.id === currentUserId) {
        setToast({ show: true, message: 'Voce nao pode criar solicitacao para si mesmo.', type: 'error' })
        return
      }

      const user = { id: userDoc.id, ...userDoc.data() } as UserProfile
      setSearchResult(user)
    } catch (error) {
      console.error('Erro ao buscar usuario:', error)
      setToast({ show: true, message: 'Erro ao realizar busca.', type: 'error' })
    } finally {
      setSearchLoading(false)
    }
  }

  const resolveRequestRole = (targetUser: UserProfile): { trainerId: string; studentId: string; requestedByRole: 'trainer' | 'student' } | null => {
    if (!currentUser) return null

    if (isTrainer) {
      return { trainerId: currentUser.id, studentId: targetUser.id, requestedByRole: 'trainer' }
    }

    if (targetUser.isTrainer) {
      return { trainerId: targetUser.id, studentId: currentUser.id, requestedByRole: 'student' }
    }

    return null
  }

  const handleSendRequest = async () => {
    if (!searchResult || !currentUser) return

    const relationConfig = resolveRequestRole(searchResult)

    if (!relationConfig) {
      setToast({
        show: true,
        message: 'Para solicitar um treinador, busque um perfil marcado como treinador.',
        type: 'error',
      })
      return
    }

    const alreadyExists = findExistingRelation(searchResult.id)
    if (alreadyExists) {
      const label = alreadyExists.status === 'accepted' ? 'vinculo ativo' : 'solicitacao pendente'
      setToast({ show: true, message: `Ja existe ${label} com esse usuario.`, type: 'info' })
      return
    }

    try {
      setActionLoading('send')
      const now = new Date().toISOString()
        const relationId = `${relationConfig.trainerId}_${relationConfig.studentId}`
        await setDoc(doc(db, 'trainer_relations', relationId), {
        trainerId: relationConfig.trainerId,
        studentId: relationConfig.studentId,
        status: 'pending',
        requestedByRole: relationConfig.requestedByRole,
        requesterId: currentUser.id,
        targetId: searchResult.id,
        participants: [relationConfig.trainerId, relationConfig.studentId],
        createdAt: now,
        updatedAt: now,
      })

      setToast({ show: true, message: 'Solicitacao enviada com sucesso!', type: 'success' })
      setSearchResult(null)
      setSearchTerm('')
      await loadData()
    } catch (error) {
      console.error('Erro ao enviar solicitacao treinador-aluno:', error)
      setToast({ show: true, message: 'Erro ao enviar solicitacao.', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptRequest = async (relationId: string) => {
    try {
      setActionLoading(relationId)
      await updateDoc(doc(db, 'trainer_relations', relationId), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
        respondedAt: new Date().toISOString(),
      })
      setToast({ show: true, message: 'Solicitacao aceita com sucesso.', type: 'success' })
      await loadData()
    } catch (error) {
      console.error('Erro ao aceitar solicitacao:', error)
      setToast({ show: true, message: 'Erro ao aceitar solicitacao.', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (relationId: string) => {
    try {
      setActionLoading(relationId)
      await deleteDoc(doc(db, 'trainer_relations', relationId))
      setToast({ show: true, message: 'Solicitacao recusada.', type: 'info' })
      await loadData()
    } catch (error) {
      console.error('Erro ao recusar solicitacao:', error)
      setToast({ show: true, message: 'Erro ao recusar solicitacao.', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const requestLabel = isTrainer ? 'Buscar aluno por username/email exato' : 'Buscar treinador por username/email exato'

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#121212] p-4 pb-24 md:py-8 gap-4">
      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl border border-gray-100 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Treinadores e Alunos</h1>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-3 py-1 rounded-full">
            {isTrainer ? 'Perfil Treinador' : 'Perfil Aluno'}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-medium">Nova solicitacao</p>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{requestLabel}</label>
          <div className="flex gap-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: joao.silva ou joao@email.com"
              className="flex-1 border dark:border-[#404040] rounded-lg px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
            />
            <Button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-[#27AE60] hover:bg-[#219150] text-white px-4"
            >
              <Search size={18} />
            </Button>
          </div>

          {searchResult && (
            <div className="mt-3 rounded-lg border border-gray-200 dark:border-[#404040] p-3 bg-white dark:bg-[#1a1a1a]">
              <UserPill
                nome={searchResult.nome}
                username={searchResult.username}
                photoURL={searchResult.photoURL}
                isTrainer={searchResult.isTrainer}
                isFounder={searchResult.isFounder}
                isPremium={searchResult.isPremium}
              >
                <button
                  onClick={handleSendRequest}
                  disabled={actionLoading === 'send'}
                  className="cursor-pointer flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg"
                  title="Enviar solicitacao"
                >
                  <UserPlus size={14} /> Enviar
                </button>
              </UserPill>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl p-4">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" /> Solicitações recebidas
            </h2>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
            ) : pendingReceived.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma solicitacao pendente.</p>
            ) : (
              <div className="space-y-3">
                {pendingReceived.map(({ relation, requester }) => (
                  <UserPill
                    key={relation.id}
                    nome={requester.nome}
                    username={requester.username}
                    photoURL={requester.photoURL}
                    isTrainer={requester.isTrainer}
                    isFounder={requester.isFounder}
                    isPremium={requester.isPremium}
                  >
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(relation.id)}
                        disabled={actionLoading === relation.id}
                        className="cursor-pointer p-2 rounded-full bg-[#27AE60]/10 hover:bg-[#27AE60]/20 text-[#27AE60]"
                        title="Aceitar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(relation.id)}
                        disabled={actionLoading === relation.id}
                        className="cursor-pointer p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        title="Recusar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </UserPill>
                ))}
              </div>
            )}
          </section>

          <section className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl p-4">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Link2 size={16} className="text-[#27AE60]" /> Solicitações enviadas
            </h2>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
            ) : outgoingPending.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma solicitacao enviada pendente.</p>
            ) : (
              <div className="space-y-2">
                {outgoingPending.map((relation) => (
                  <p key={relation.id} className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-200 dark:border-[#404040]">
                    {relation.requestedByRole === 'trainer' ? 'Convite para aluno enviado.' : 'Solicitacao para treinador enviada.'}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 md:p-6 w-full max-w-lg md:max-w-3xl border border-gray-100 dark:border-[#2a2a2a]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isTrainer && (
            <section>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserRound size={16} className="text-[#27AE60]" /> Meus alunos
              </h2>
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
              ) : acceptedAsTrainer.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum aluno vinculado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {acceptedAsTrainer.map((student) => (
                    <UserPill
                      key={student.id}
                      nome={student.nome}
                      username={student.username}
                      photoURL={student.photoURL}
                      isTrainer={student.isTrainer}
                      isFounder={student.isFounder}
                      isPremium={student.isPremium}
                    >
                      <button
                        onClick={() =>
                          navigate(
                            `/train?studentId=${student.id}&studentName=${encodeURIComponent(student.nome)}`
                          )
                        }
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider bg-[#27AE60]/10 hover:bg-[#27AE60]/20 text-[#27AE60] px-3 py-2 rounded-lg"
                      >
                        Gerenciar treinos
                      </button>
                    </UserPill>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" /> Meus treinadores
            </h2>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
            ) : acceptedAsStudent.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum treinador vinculado ainda.</p>
            ) : (
              <div className="space-y-3">
                {acceptedAsStudent.map((trainer) => (
                  <UserPill
                    key={trainer.id}
                    nome={trainer.nome}
                    username={trainer.username}
                    photoURL={trainer.photoURL}
                    isTrainer={trainer.isTrainer}
                    isFounder={trainer.isFounder}
                    isPremium={trainer.isPremium}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </main>
  )
}
