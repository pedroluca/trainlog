import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, secondaryAuth } from '../firebaseConfig'
import { collection, getDocs, doc, getDoc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { Users, Dumbbell, FileText, TrendingUp, LogOut, UserPlus, Check, X } from 'lucide-react'
import { Button } from '../components/button'

type UserData = {
  id: string
  nome: string
  email: string
  isAdmin?: boolean
  isActive?: boolean
  createdAt?: unknown
}

type RegistrationRequest = {
  id: string
  nome: string
  email: string
  telefone: string
  senha: string
  status: 'pending' | 'approved' | 'rejected'
  criadoEm: string
  aprovedoEm?: string | null
  aprovedoPor?: string | null
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

export function AdminDashboard() {
  const navigate = useNavigate()
  const adminId = localStorage.getItem('adminId')
  const isAdmin = localStorage.getItem('isAdmin')
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [workouts, setWorkouts] = useState<WorkoutData[]>([])
  const [logs, setLogs] = useState<LogData[]>([])
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [adminName, setAdminName] = useState('')
  // const [migrating, setMigrating] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [currentRequestsPage, setCurrentRequestsPage] = useState(1)
  const itemsPerPage = 10

  const handleApproveRequest = async (request: RegistrationRequest) => {
    let userCreated = false

    try {
      // Step 1: Create Firebase user account using SECONDARY auth (won't affect admin session)
      console.log('Creating Firebase user account...')
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, request.email, request.senha)
      const user = userCredential.user
      userCreated = true
      console.log('Firebase user created successfully:', user.uid)

      // Step 2: Sign out from secondary auth immediately
      await secondaryAuth.signOut()
      console.log('Signed out from secondary auth')

      // Step 3: Create user document in Firestore (using primary db connection)
      console.log('Creating user document in Firestore...')
      const userDocRef = doc(db, 'usuarios', user.uid)
      await setDoc(userDocRef, {
        nome: request.nome,
        email: request.email,
        telefone: request.telefone,
        isActive: true,
        isAdmin: false,
        criadoEm: new Date().toISOString(),
      })
      console.log('User document created successfully')

      // Step 4: Update the registration request status to approved
      console.log('Updating registration request status to approved...')
      const requestDocRef = doc(db, 'registrationRequests', request.id)
      await updateDoc(requestDocRef, {
        status: 'approved',
        aprovedoEm: new Date().toISOString(),
        aprovedoPor: adminId,
      })
      console.log('Registration request updated to approved successfully')

      // Step 5: Update UI state
      console.log('Updating UI state...')
      setRegistrationRequests(prev => prev.filter(req => req.id !== request.id))
      
      // Refresh users list to show the new user
      const usersRef = collection(db, 'usuarios')
      const usersSnapshot = await getDocs(usersRef)
      const usersData: UserData[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome || 'Sem nome',
        email: doc.data().email || 'Sem email',
        isAdmin: doc.data().isAdmin || false,
        isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
        createdAt: doc.data().createdAt,
      }))
      setUsers(usersData)
      
      alert(`Usuário ${request.nome} aprovado com sucesso!`)
      
    } catch (err: unknown) {
      console.error('Error during approval process:', err)
      
      // Provide more specific error messages
      const error = err as { code?: string; message?: string }
      
      if (userCreated) {
        // User was created but something else failed
        console.log('User was created successfully, but cleanup failed')
        alert(`Usuário ${request.nome} foi criado com sucesso, mas houve um problema ao limpar a solicitação. O usuário está ativo e pode fazer login.`)
        
        // Still update the UI to remove the request from the list
        setRegistrationRequests(prev => prev.filter(req => req.id !== request.id))
        
        // Refresh users list
        try {
          const usersRef = collection(db, 'usuarios')
          const usersSnapshot = await getDocs(usersRef)
          const usersData: UserData[] = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            nome: doc.data().nome || 'Sem nome',
            email: doc.data().email || 'Sem email',
            isAdmin: doc.data().isAdmin || false,
            isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
            createdAt: doc.data().createdAt,
          }))
          setUsers(usersData)
        } catch (refreshError) {
          console.error('Failed to refresh users list:', refreshError)
        }
        
      } else {
        // User creation failed
        if (error.code === 'auth/email-already-in-use') {
          alert(`Erro: O email ${request.email} já está em uso. O usuário pode já ter sido aprovado anteriormente.`)
        } else if (error.code === 'auth/weak-password') {
          alert('Erro: A senha é muito fraca. Peça ao usuário para escolher uma senha mais forte.')
        } else if (error.code === 'auth/invalid-email') {
          alert('Erro: Email inválido.')
        } else {
          alert(`Erro ao aprovar usuário: ${error.message || 'Erro desconhecido'}`)
        }
      }
    }
  }

  const handleRejectRequest = async (request: RegistrationRequest) => {
    if (!confirm(`Tem certeza que deseja rejeitar a solicitação de ${request.nome}?`)) {
      return
    }

    try {
      // Delete the request
      const requestDocRef = doc(db, 'registrationRequests', request.id)
      await deleteDoc(requestDocRef)

      // Remove from pending requests list
      setRegistrationRequests(prev => prev.filter(req => req.id !== request.id))
      
      alert(`Solicitação de ${request.nome} rejeitada.`)
    } catch (err) {
      console.error('Erro ao rejeitar usuário:', err)
      alert('Erro ao rejeitar usuário. Tente novamente.')
    }
  }

  // const handleMigrateUsers = async () => {
  //   if (!confirm('Tem certeza que deseja migrar todos os usuários existentes? Esta ação irá adicionar o campo "isActive: true" para todos os usuários que não possuem este campo.')) {
  //     return
  //   }

  //   setMigrating(true)
  //   let migratedCount = 0
  //   let errorCount = 0

  //   try {
  //     // Fetch all users that don't have isActive field or have it as undefined
  //     const usersRef = collection(db, 'usuarios')
  //     const usersSnapshot = await getDocs(usersRef)
      
  //     const usersToMigrate = usersSnapshot.docs.filter(doc => {
  //       const userData = doc.data()
  //       return userData.isActive === undefined
  //     })

  //     console.log(`Found ${usersToMigrate.length} users to migrate`)

  //     // Update each user document
  //     for (const userDoc of usersToMigrate) {
  //       try {
  //         const userDocRef = doc(db, 'usuarios', userDoc.id)
  //         await updateDoc(userDocRef, {
  //           isActive: true
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
          createdAt: doc.data().createdAt,
        }))
        setUsers(usersData)

        // Fetch registration requests
        const requestsRef = collection(db, 'registrationRequests')
        const requestsSnapshot = await getDocs(requestsRef)
        const requestsData: RegistrationRequest[] = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          email: doc.data().email,
          telefone: doc.data().telefone,
          senha: doc.data().senha,
          status: doc.data().status,
          criadoEm: doc.data().criadoEm,
          aprovedoEm: doc.data().aprovedoEm,
          aprovedoPor: doc.data().aprovedoPor,
        }))
        // Only show pending requests
        setRegistrationRequests(requestsData.filter(req => req.status === 'pending'))

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
      {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Migração de Usuários
            </h2>
            <p className="text-gray-600 text-sm">
              Adicione o campo "isActive: true" para todos os usuários existentes que não possuem este campo.
            </p>
          </div>
          <Button
            onClick={handleMigrateUsers}
            disabled={migrating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
          >
            {migrating ? 'Migrando...' : 'Migrar Usuários'}
          </Button>
        </div>
      </div> */}

      {/* Pending Registration Requests */}
      {registrationRequests.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus size={24} />
            Solicitações Pendentes ({registrationRequests.length})
          </h2>
          <div className="space-y-4">
            {registrationRequests.slice((currentRequestsPage - 1) * itemsPerPage, currentRequestsPage * itemsPerPage).map((request) => (
              <div key={request.id} className="bg-gray-700/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium text-lg">{request.nome}</p>
                  <p className="text-gray-400 text-sm mb-1">{request.email}</p>
                  <p className="text-gray-400 text-sm mb-1">{request.telefone}</p>
                  <p className="text-gray-500 text-xs">
                    Enviado em: {new Date(request.criadoEm).toLocaleDateString('pt-BR')} às {new Date(request.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveRequest(request)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check size={16} />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(request)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <X size={16} />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination for requests */}
          {registrationRequests.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                onClick={() => setCurrentRequestsPage(prev => Math.max(1, prev - 1))}
                disabled={currentRequestsPage === 1}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Anterior
              </Button>
              <span className="text-gray-400">
                Página {currentRequestsPage} de {Math.ceil(registrationRequests.length / itemsPerPage)}
              </span>
              <Button
                onClick={() => setCurrentRequestsPage(prev => Math.min(Math.ceil(registrationRequests.length / itemsPerPage), prev + 1))}
                disabled={currentRequestsPage >= Math.ceil(registrationRequests.length / itemsPerPage)}
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
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Users size={24} />
          Lista de Usuários
        </h2>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">Nenhum usuário encontrado</p>
            <p className="text-gray-500 text-sm">Verifique se há usuários cadastrados no Firestore</p>
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
                    <th className="py-3 px-4 text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
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
            {users.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  Anterior
                </Button>
                <span className="text-gray-400">
                  Página {currentPage} de {Math.ceil(users.length / itemsPerPage)}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(users.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(users.length / itemsPerPage)}
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
