import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebaseConfig'
import { addBadgesToUser } from '../../utils/badge-utils'
import { Users, Dumbbell, FileText, TrendingUp, Check, X } from 'lucide-react'
import { Button } from '../../components/button'
import { trackPremiumUpgradeApproved, trackPremiumUpgradeRejected } from '../../utils/analytics'
import { useOutletContext } from 'react-router-dom'
import { AdminContextData, UpgradeRequest } from '../../layouts/admin-layout'

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg shadow-black/20 transform transition-transform hover:scale-105 flex items-center justify-between`}>
      <div>
        <h3 className="text-sm md:text-base font-medium opacity-90 mb-1">{title}</h3>
        <p className="text-3xl font-black tracking-tight leading-none">{value}</p>
      </div>
      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
  )
}

export function AdminOverview() {
  const { adminId, users, setUsers, workouts, logs, upgradeRequests, setUpgradeRequests } = useOutletContext<AdminContextData>()

  const [approveUpgradeModalOpen, setApproveUpgradeModalOpen] = useState(false)
  const [rejectUpgradeModalOpen, setRejectUpgradeModalOpen] = useState(false)
  const [selectedUpgradeRequest, setSelectedUpgradeRequest] = useState<UpgradeRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingRequest, setProcessingRequest] = useState(false)

  const [currentUpgradeRequestsPage, setCurrentUpgradeRequestsPage] = useState(1)
  const itemsPerPage = 10

  const handleApproveUpgradeRequest = async (request: UpgradeRequest) => {
    setProcessingRequest(true)
    try {
      const userDocRef = doc(db, 'usuarios', request.userId)
      await updateDoc(userDocRef, { isPremium: true })
      await addBadgesToUser(request.userId, ['premium'])

      const requestDocRef = doc(db, 'upgrade_requests', request.id)
      await updateDoc(requestDocRef, {
        status: 'approved',
        processedBy: adminId,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setUpgradeRequests(prev => prev.filter(req => req.id !== request.id))
      setUsers(prev => prev.map(user => 
        user.id === request.userId ? { ...user, isPremium: true } : user
      ))

      trackPremiumUpgradeApproved(request.userId)

      setApproveUpgradeModalOpen(false)
      setSelectedUpgradeRequest(null)
    } catch (err) {
      console.error('Error approving upgrade request:', err)
    } finally {
      setProcessingRequest(false)
    }
  }

  const handleRejectUpgradeRequest = async (request: UpgradeRequest) => {
    setProcessingRequest(true)
    try {
      const requestDocRef = doc(db, 'upgrade_requests', request.id)
      await updateDoc(requestDocRef, {
        status: 'rejected',
        processedBy: adminId,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Não especificado'
      })

      setUpgradeRequests(prev => prev.filter(req => req.id !== request.id))
      trackPremiumUpgradeRejected(request.userId)

      setRejectUpgradeModalOpen(false)
      setSelectedUpgradeRequest(null)
      setRejectionReason('')
    } catch (err) {
      console.error('Error rejecting upgrade request:', err)
    } finally {
      setProcessingRequest(false)
    }
  }

  const totalUsers = users.length
  const totalWorkouts = workouts.length
  const totalLogs = logs.length
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const activeUsers = new Set(
    logs
      .filter(log => new Date(log.data) >= thirtyDaysAgo)
      .map(log => log.usuarioID)
  ).size

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={28} />}
          title="Total de Usuários"
          value={totalUsers}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<Dumbbell size={28} />}
          title="Total de Treinos"
          value={totalWorkouts}
          color="from-[#27AE60] to-[#219150]"
        />
        <StatCard
          icon={<FileText size={28} />}
          title="Total de Logs"
          value={totalLogs}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={<TrendingUp size={28} />}
          title="Usuários Ativos"
          value={activeUsers}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Pending Upgrade Requests */}
      {upgradeRequests.length > 0 ? (
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="bg-amber-500/20 p-2 rounded-xl text-amber-500">
              👑
            </span>
            Solicitações de Upgrade Premium ({upgradeRequests.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upgradeRequests.slice((currentUpgradeRequestsPage - 1) * itemsPerPage, currentUpgradeRequestsPage * itemsPerPage).map((request) => (
              <div key={request.id} className="bg-gray-800/80 rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-colors shadow-lg">
                <div className="flex flex-col h-full">
                  <div className="mb-4 flex-1">
                    <p className="text-white font-bold text-lg">{request.userName}</p>
                    <p className="text-gray-400 text-sm mb-2">{request.userEmail}</p>
                    {request.userPhone && (
                      <a 
                        href={`https://wa.me/55${request.userPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 bg-green-400/10 px-2 py-1 rounded text-sm mb-3 transition-colors"
                      >
                        📱 {request.userPhone}
                        <span className="text-xs opacity-70">(WhatsApp)</span>
                      </a>
                    )}
                    <p className="text-gray-500 text-xs mb-3">
                      Enviado em: {request.createdAt && typeof request.createdAt === 'object' && 'seconds' in request.createdAt
                        ? `${new Date((request.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString('pt-BR')} às ${new Date((request.createdAt as { seconds: number }).seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'N/A'}
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                      <p className="text-xs text-amber-500/70 mb-1 uppercase tracking-wider font-bold">Motivo:</p>
                      <p className="text-gray-300 text-sm">{request.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() => {
                        setSelectedUpgradeRequest(request)
                        setApproveUpgradeModalOpen(true)
                      }}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md shadow-amber-900/20 hover:scale-[1.02]"
                    >
                      <Check size={18} />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUpgradeRequest(request)
                        setRejectUpgradeModalOpen(true)
                      }}
                      className="flex-1 bg-gray-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-white px-4 py-2.5 rounded-xl border border-transparent flex items-center justify-center gap-2 font-bold transition-all"
                    >
                      <X size={18} />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination for upgrade requests */}
          {upgradeRequests.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                onClick={() => setCurrentUpgradeRequestsPage(prev => Math.max(1, prev - 1))}
                disabled={currentUpgradeRequestsPage === 1}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Anterior
              </Button>
              <span className="text-gray-400 font-medium">
                Página {currentUpgradeRequestsPage} de {Math.ceil(upgradeRequests.length / itemsPerPage)}
              </span>
              <Button
                onClick={() => setCurrentUpgradeRequestsPage(prev => Math.min(Math.ceil(upgradeRequests.length / itemsPerPage), prev + 1))}
                disabled={currentUpgradeRequestsPage >= Math.ceil(upgradeRequests.length / itemsPerPage)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">Tudo limpo por aqui!</h3>
          <p className="text-gray-500 max-w-md">Nenhuma solicitação de upgrade premium pendente no momento. Bom trabalho!</p>
        </div>
      )}

      {/* Modals */}
      {approveUpgradeModalOpen && selectedUpgradeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-4">
              Aprovar Premium
            </h3>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl p-4 mb-4 border border-amber-500/20">
              <p className="text-white font-semibold mb-2">{selectedUpgradeRequest.userName}</p>
              <p className="text-gray-300 text-sm mb-1">📧 {selectedUpgradeRequest.userEmail}</p>
              {selectedUpgradeRequest.userPhone && (
                <p className="text-gray-300 text-sm mb-2">📱 {selectedUpgradeRequest.userPhone}</p>
              )}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm leading-relaxed">
                💡 <strong>Lembrete:</strong> Confirme o pagamento via WhatsApp antes de aprovar a conta.
              </p>
            </div>
            <p className="text-gray-300 mb-6 text-center">
              Tem certeza que deseja atualizar este usuário para <strong className="text-amber-400">Premium</strong>?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setApproveUpgradeModalOpen(false)
                  setSelectedUpgradeRequest(null)
                }}
                disabled={processingRequest}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleApproveUpgradeRequest(selectedUpgradeRequest)}
                disabled={processingRequest}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all"
              >
                {processingRequest ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectUpgradeModalOpen && selectedUpgradeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Rejeitar Upgrade</h3>
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <p className="text-white font-semibold mb-2">{selectedUpgradeRequest.userName}</p>
              <p className="text-gray-400 text-sm mb-1">{selectedUpgradeRequest.userEmail}</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Motivo da rejeição (opcional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Pagamento não confirmado..."
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none h-24"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setRejectUpgradeModalOpen(false)
                  setSelectedUpgradeRequest(null)
                  setRejectionReason('')
                }}
                disabled={processingRequest}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleRejectUpgradeRequest(selectedUpgradeRequest)}
                disabled={processingRequest}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
              >
                {processingRequest ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <X size={18} />
                    Rejeitar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
