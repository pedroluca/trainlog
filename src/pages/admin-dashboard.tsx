import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { Users, Dumbbell, FileText, TrendingUp, LogOut, Check, X } from 'lucide-react'
import { Button } from '../components/button'
import { trackPremiumUpgradeApproved, trackPremiumUpgradeRejected } from '../utils/analytics'

type UserData = {
  id: string
  nome: string
  email: string
  isAdmin?: boolean
  isActive?: boolean
  isPremium?: boolean
  createdAt?: unknown
}

type WorkoutData = {
  id: string
  usuarioID: string
  dia: string
  musculo: string
}

type LogData = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  data: string
}

type UpgradeRequest = {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: unknown
  updatedAt: unknown
  processedBy?: string
  processedAt?: string
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const adminId = localStorage.getItem('adminId')
  const isAdmin = localStorage.getItem('isAdmin')
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [workouts, setWorkouts] = useState<WorkoutData[]>([])
  const [logs, setLogs] = useState<LogData[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [adminName, setAdminName] = useState('')
  // const [migrating, setMigrating] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUpgradeRequestsPage, setCurrentUpgradeRequestsPage] = useState(1)
  const itemsPerPage = 10

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState<'name' | 'lastActivity' | 'logs' | 'workouts'>('lastActivity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'premium' | 'free' | 'active' | 'admin'>('all')

  // Modal states
  const [approveUpgradeModalOpen, setApproveUpgradeModalOpen] = useState(false)
  const [rejectUpgradeModalOpen, setRejectUpgradeModalOpen] = useState(false)
  const [selectedUpgradeRequest, setSelectedUpgradeRequest] = useState<UpgradeRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingRequest, setProcessingRequest] = useState(false)

  const handleApproveUpgradeRequest = async (request: UpgradeRequest) => {
    setProcessingRequest(true)

    try {
      // Update user to Premium
      const userDocRef = doc(db, 'usuarios', request.userId)
      await updateDoc(userDocRef, {
        isPremium: true
      })

      // Update request status
      const requestDocRef = doc(db, 'upgrade_requests', request.id)
      await updateDoc(requestDocRef, {
        status: 'approved',
        processedBy: adminId,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Remove from pending requests
      setUpgradeRequests(prev => prev.filter(req => req.id !== request.id))

      // Update users list
      setUsers(prev => prev.map(user => 
        user.id === request.userId 
          ? { ...user, isPremium: true }
          : user
      ))

      // Track approval
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
      // Update request status
      const requestDocRef = doc(db, 'upgrade_requests', request.id)
      await updateDoc(requestDocRef, {
        status: 'rejected',
        processedBy: adminId,
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Não especificado'
      })

      // Remove from pending requests
      setUpgradeRequests(prev => prev.filter(req => req.id !== request.id))

      // Track rejection
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

  // const handleMigrateUsers = async () => {
  //   if (!confirm('Tem certeza que deseja migrar todos os usuários existentes? Esta ação irá adicionar o campo "isPremium: false" para todos os usuários que não possuem este campo.')) {
  //     return
  //   }

  //   setMigrating(true)
  //   let migratedCount = 0
  //   let errorCount = 0

  //   try {
  //     // Fetch all users that don't have isPremium field or have it as undefined
  //     const usersRef = collection(db, 'usuarios')
  //     const usersSnapshot = await getDocs(usersRef)
      
  //     const usersToMigrate = usersSnapshot.docs.filter(doc => {
  //       const userData = doc.data()
  //       return userData.isPremium === undefined
  //     })

  //     console.log(`Found ${usersToMigrate.length} users to migrate`)

  //     // Update each user document
  //     for (const userDoc of usersToMigrate) {
  //       try {
  //         const userDocRef = doc(db, 'usuarios', userDoc.id)
  //         await updateDoc(userDocRef, {
  //           isPremium: false
  //         })
  //         migratedCount++
  //         console.log(`Updated user ${userDoc.id}: ${userDoc.data().nome || 'No name'}`)
  //       } catch (error) {
  //         console.error(`Error updating user ${userDoc.id}:`, error)
  //         errorCount++
  //       }
  //     }

  //     // Refresh users data to show updated information
  //     const updatedUsersSnapshot = await getDocs(usersRef)
  //     const updatedUsersData: UserData[] = updatedUsersSnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       nome: doc.data().nome || 'Sem nome',
  //       email: doc.data().email || 'Sem email',
  //       isAdmin: doc.data().isAdmin || false,
  //       isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
  //       isPremium: doc.data().isPremium || false,
  //       createdAt: doc.data().createdAt,
  //     }))
  //     setUsers(updatedUsersData)

  //     alert(
  //       `Migração concluída!\n` +
  //       `${migratedCount} usuários migrados com sucesso.\n` +
  //       (errorCount > 0 ? `${errorCount} erros encontrados.` : 'Nenhum erro encontrado.')
  //     )
  //   } catch (error) {
  //     console.error('Error during migration:', error)
  //     alert('Erro durante a migração. Verifique o console para mais detalhes.')
  //   } finally {
  //     setMigrating(false)
  //   }
  // }

  useEffect(() => {
    document.title = 'Painel Admin - TrainLog'
    
    // Check admin authentication
    if (!adminId || isAdmin !== 'true') {
      navigate('/admin')
      return
    }

    const fetchAllData = async () => {
      try {
        // Verify admin status in Firestore
        const adminDocRef = doc(db, 'usuarios', adminId!)
        const adminDoc = await getDoc(adminDocRef)

        if (!adminDoc.exists() || !adminDoc.data().isAdmin) {
          localStorage.clear()
          navigate('/admin')
          return
        }

        setAdminName(adminDoc.data().nome)

        // Fetch all users
        const usersRef = collection(db, 'usuarios')
        const usersSnapshot = await getDocs(usersRef)
        const usersData: UserData[] = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome || 'Sem nome',
          email: doc.data().email || 'Sem email',
          isAdmin: doc.data().isAdmin || false,
          isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
          isPremium: doc.data().isPremium || false,
          createdAt: doc.data().createdAt,
        }))
        setUsers(usersData)

        // Fetch upgrade requests
        const upgradeRequestsRef = collection(db, 'upgrade_requests')
        const upgradeRequestsSnapshot = await getDocs(upgradeRequestsRef)
        const upgradeRequestsData: UpgradeRequest[] = upgradeRequestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          userId: doc.data().userId,
          userName: doc.data().userName,
          userEmail: doc.data().userEmail,
          userPhone: doc.data().userPhone,
          message: doc.data().message,
          status: doc.data().status,
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt,
          processedBy: doc.data().processedBy,
          processedAt: doc.data().processedAt,
        }))
        // Only show pending upgrade requests
        setUpgradeRequests(upgradeRequestsData.filter(req => req.status === 'pending'))

        // Fetch all workouts
        const workoutsRef = collection(db, 'treinos')
        const workoutsSnapshot = await getDocs(workoutsRef)
        const workoutsData: WorkoutData[] = workoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          usuarioID: doc.data().usuarioID,
          dia: doc.data().dia,
          musculo: doc.data().musculo,
        }))
        setWorkouts(workoutsData)

        // Fetch all logs
        const logsRef = collection(db, 'logs')
        const logsSnapshot = await getDocs(logsRef)
        const logsData: LogData[] = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          usuarioID: doc.data().usuarioID,
          titulo: doc.data().titulo,
          series: doc.data().series,
          repeticoes: doc.data().repeticoes,
          peso: doc.data().peso,
          data: doc.data().data,
        }))
        
        // Sort by date in memory (newest first)
        logsData.sort((a, b) => {
          const dateA = new Date(a.data).getTime()
          const dateB = new Date(b.data).getTime()
          return dateB - dateA
        })
        
        setLogs(logsData)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar dados admin:', err)
        setLoading(false)
      }
    }

    fetchAllData()
  }, [adminId, isAdmin, navigate])

  const handleLogout = () => {
    auth.signOut()
    localStorage.clear()
    navigate('/admin')
  }

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    // First, filter users
    const filteredUsers = users.filter(user => {
      switch (filterBy) {
        case 'premium':
          return user.isPremium === true
        case 'free':
          return !user.isPremium
        case 'active':
          return user.isActive === true
        case 'admin':
          return user.isAdmin === true
        case 'all':
        default:
          return true
      }
    })

    // Then, sort users
    filteredUsers.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.nome.localeCompare(b.nome)
          break
        case 'lastActivity': {
          const aLogs = logs.filter(l => l.usuarioID === a.id)
          const bLogs = logs.filter(l => l.usuarioID === b.id)
          const aLastLog = aLogs.length > 0 ? new Date(aLogs[0].data).getTime() : 0
          const bLastLog = bLogs.length > 0 ? new Date(bLogs[0].data).getTime() : 0
          comparison = aLastLog - bLastLog
          break
        }
        case 'logs': {
          const aLogsCount = logs.filter(l => l.usuarioID === a.id).length
          const bLogsCount = logs.filter(l => l.usuarioID === b.id).length
          comparison = aLogsCount - bLogsCount
          break
        }
        case 'workouts': {
          const aWorkoutsCount = workouts.filter(w => w.usuarioID === a.id).length
          const bWorkoutsCount = workouts.filter(w => w.usuarioID === b.id).length
          comparison = aWorkoutsCount - bWorkoutsCount
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filteredUsers
  }

  const filteredAndSortedUsers = getFilteredAndSortedUsers()

  // Calculate statistics
  const totalUsers = users.length
  const totalWorkouts = workouts.length
  const totalLogs = logs.length
  const activeUsers = new Set(logs.map(log => log.usuarioID)).size

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Bem-vindo, {adminName}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Users size={32} />}
          title="Total de Usuários"
          value={totalUsers}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<Dumbbell size={32} />}
          title="Total de Treinos"
          value={totalWorkouts}
          color="from-[#27AE60] to-[#219150]"
        />
        <StatCard
          icon={<FileText size={32} />}
          title="Total de Logs"
          value={totalLogs}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={<TrendingUp size={32} />}
          title="Usuários Ativos"
          value={activeUsers}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Migration Section */}
      {/* <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Migração de Usuários - isPremium
            </h2>
            <p className="text-gray-400 text-sm">
              Adicione o campo "isPremium: false" para todos os usuários existentes que não possuem este campo.
            </p>
          </div>
          <Button
            onClick={handleMigrateUsers}
            disabled={migrating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
          >
            {migrating ? 'Migrando...' : 'Migrar Usuários'}
          </Button>
        </div>
      </div> */}

      {/* Pending Upgrade Requests */}
      {upgradeRequests.length > 0 && (
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">👑</span>
            Solicitações de Upgrade Premium ({upgradeRequests.length})
          </h2>
          <div className="space-y-4">
            {upgradeRequests.slice((currentUpgradeRequestsPage - 1) * itemsPerPage, currentUpgradeRequestsPage * itemsPerPage).map((request) => (
              <div key={request.id} className="bg-gray-700/50 rounded-lg p-4 border border-amber-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-white font-medium text-lg">{request.userName}</p>
                    <p className="text-gray-400 text-sm mb-1">{request.userEmail}</p>
                    {request.userPhone && (
                      <a 
                        href={`https://wa.me/55${request.userPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-sm mb-1 flex items-center gap-1 w-fit"
                      >
                        📱 {request.userPhone}
                        <span className="text-xs">(WhatsApp)</span>
                      </a>
                    )}
                    <p className="text-gray-500 text-xs mb-3">
                      Enviado em: {request.createdAt && typeof request.createdAt === 'object' && 'seconds' in request.createdAt
                        ? `${new Date((request.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString('pt-BR')} às ${new Date((request.createdAt as { seconds: number }).seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'N/A'}
                    </p>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                      <p className="text-xs text-gray-400 mb-1">Motivo:</p>
                      <p className="text-white text-sm">{request.message}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => {
                      setSelectedUpgradeRequest(request)
                      setApproveUpgradeModalOpen(true)
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold"
                  >
                    <Check size={16} />
                    Aprovar Premium
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedUpgradeRequest(request)
                      setRejectUpgradeModalOpen(true)
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination for upgrade requests */}
          {upgradeRequests.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                onClick={() => setCurrentUpgradeRequestsPage(prev => Math.max(1, prev - 1))}
                disabled={currentUpgradeRequestsPage === 1}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Anterior
              </Button>
              <span className="text-gray-400">
                Página {currentUpgradeRequestsPage} de {Math.ceil(upgradeRequests.length / itemsPerPage)}
              </span>
              <Button
                onClick={() => setCurrentUpgradeRequestsPage(prev => Math.min(Math.ceil(upgradeRequests.length / itemsPerPage), prev + 1))}
                disabled={currentUpgradeRequestsPage >= Math.ceil(upgradeRequests.length / itemsPerPage)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} />
            Lista de Usuários ({filteredAndSortedUsers.length})
          </h2>
        </div>

        {/* Filters and Sorting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Filter By */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Filtrar por:</label>
            <select
              value={filterBy}
              onChange={(e) => {
                setFilterBy(e.target.value as typeof filterBy)
                setCurrentPage(1) // Reset to first page when filtering
              }}
              className="w-full bg-gray-700 text-white px-1 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[#27AE60]"
            >
              <option value="all">Todos os Usuários</option>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
              <option value="active">Ativos</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full bg-gray-700 text-white px-1 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[#27AE60]"
            >
              <option value="name">Nome</option>
              <option value="lastActivity">Última Atividade</option>
              <option value="logs">Total de Logs</option>
              <option value="workouts">Total de Treinos</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Ordem:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="w-full bg-gray-700 text-white px-1 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[#27AE60]"
            >
              <option value="desc">
                {sortBy === 'name' ? 'Z → A' : 'Maior → Menor'}
              </option>
              <option value="asc">
                {sortBy === 'name' ? 'A → Z' : 'Menor → Maior'}
              </option>
            </select>
          </div>
        </div>

        {filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">Nenhum usuário encontrado</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400 font-semibold">Nome</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Email</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Treinos</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Logs</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Última Atividade</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Premium</th>
                    <th className="py-3 px-4 text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                    const userWorkouts = workouts.filter(w => w.usuarioID === user.id).length
                    const userLogs = logs.filter(l => l.usuarioID === user.id)
                    const userLogsCount = userLogs.length
                    
                    // Find the most recent log for this user
                    const lastLog = userLogs.length > 0 ? userLogs[0] : null
                    const lastActivity = lastLog ? new Date(lastLog.data) : null
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4 text-white">{user.nome}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300">{userWorkouts}</td>
                        <td className="py-3 px-4 text-gray-300">{userLogsCount}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {lastActivity ? (
                            <span className="text-sm">
                              {lastActivity.toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem log de atividade</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.isPremium ? (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Premium</span>
                          ) : (
                            <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">Free</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.isAdmin ? (
                            <span className="bg-[#27AE60] text-white text-xs px-2 py-1 rounded-full">Admin</span>
                          ) : (
                            <span className={`text-white text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-blue-600' : 'bg-gray-600'}`}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination for users */}
            {filteredAndSortedUsers.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  Anterior
                </Button>
                <span className="text-gray-400">
                  Página {currentPage} de {Math.ceil(filteredAndSortedUsers.length / itemsPerPage)}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAndSortedUsers.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredAndSortedUsers.length / itemsPerPage)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Atividade Recente
        </h2>
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => {
            const user = users.find(u => u.id === log.usuarioID)
            const date = new Date(log.data)
            
            return (
              <div key={log.id} className="bg-gray-700/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{user?.nome || 'Usuário desconhecido'}</p>
                  <p className="text-gray-400 text-sm">
                    Registrou: {log.titulo} - {log.series}x{log.repeticoes} @ {log.peso}kg
                  </p>
                </div>
                <p className="text-gray-500 text-sm">
                  {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Approve Upgrade Modal */}
      {approveUpgradeModalOpen && selectedUpgradeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-4">
              Aprovar Premium
            </h3>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg p-4 mb-4 border border-amber-500/20">
              <p className="text-white font-semibold mb-2">{selectedUpgradeRequest.userName}</p>
              <p className="text-gray-300 text-sm mb-1">📧 {selectedUpgradeRequest.userEmail}</p>
              {selectedUpgradeRequest.userPhone && (
                <p className="text-gray-300 text-sm mb-2">📱 {selectedUpgradeRequest.userPhone}</p>
              )}
              {selectedUpgradeRequest.message && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <p className="text-gray-400 text-xs mb-1">Mensagem do usuário:</p>
                  <p className="text-gray-300 text-sm italic">"{selectedUpgradeRequest.message}"</p>
                </div>
              )}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
              <p className="text-blue-300 text-sm">
                💡 <strong>Lembrete:</strong> Entre em contato com o usuário para confirmar o pagamento antes de aprovar.
              </p>
            </div>
            <p className="text-gray-300 mb-6">
              Confirma a atualização desta conta para <strong className="text-amber-400">Premium</strong>?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setApproveUpgradeModalOpen(false)
                  setSelectedUpgradeRequest(null)
                }}
                disabled={processingRequest}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleApproveUpgradeRequest(selectedUpgradeRequest)}
                disabled={processingRequest}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {processingRequest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar Premium
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Upgrade Modal */}
      {rejectUpgradeModalOpen && selectedUpgradeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Rejeitar Upgrade Premium</h3>
            <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-2">{selectedUpgradeRequest.userName}</p>
              <p className="text-gray-400 text-sm mb-1">Email: {selectedUpgradeRequest.userEmail}</p>
              {selectedUpgradeRequest.userPhone && (
                <p className="text-gray-400 text-sm mb-2">Telefone: {selectedUpgradeRequest.userPhone}</p>
              )}
              {selectedUpgradeRequest.message && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-gray-500 text-xs mb-1">Mensagem:</p>
                  <p className="text-gray-300 text-sm italic">"{selectedUpgradeRequest.message}"</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-gray-300 text-sm mb-2 block">
                Motivo da rejeição <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Pagamento não confirmado, dados inválidos, etc."
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-red-500 min-h-[100px] resize-none"
                disabled={processingRequest}
              />
            </div>
            <p className="text-gray-400 text-sm mb-6">
              O usuário será notificado sobre a rejeição com o motivo informado.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setRejectUpgradeModalOpen(false)
                  setSelectedUpgradeRequest(null)
                  setRejectionReason('')
                }}
                disabled={processingRequest}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleRejectUpgradeRequest(selectedUpgradeRequest)}
                disabled={processingRequest || !rejectionReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRequest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <X size={16} />
                    Confirmar Rejeição
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

// Stat Card Component
function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
