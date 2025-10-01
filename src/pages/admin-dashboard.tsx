import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { Users, Dumbbell, FileText, TrendingUp, LogOut } from 'lucide-react'
import { Button } from '../components/button'

type UserData = {
  id: string
  nome: string
  email: string
  isAdmin?: boolean
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

export function AdminDashboard() {
  const navigate = useNavigate()
  const adminId = localStorage.getItem('adminId')
  const isAdmin = localStorage.getItem('isAdmin')
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [workouts, setWorkouts] = useState<WorkoutData[]>([])
  const [logs, setLogs] = useState<LogData[]>([])
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    // Check admin authentication
    if (!adminId || isAdmin !== 'true') {
      navigate('/admin')
      return
    }

    const fetchAdminData = async () => {
      try {
        // Verify admin status in Firestore
        const adminDocRef = doc(db, 'usuarios', adminId)
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
        console.log('Total users found:', usersSnapshot.size)
        console.log('Users docs:', usersSnapshot.docs.map(d => ({ id: d.id, data: d.data() })))
        
        const usersData: UserData[] = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome || 'Sem nome',
          email: doc.data().email || 'Sem email',
          isAdmin: doc.data().isAdmin || false,
          createdAt: doc.data().createdAt,
        }))
        setUsers(usersData)
        console.log('Users state set:', usersData)

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

        // Fetch all logs (without orderBy to avoid index requirement)
        const logsRef = collection(db, 'logs')
        const logsSnapshot = await getDocs(logsRef)
        console.log('Total logs found:', logsSnapshot.size)
        console.log('Logs docs:', logsSnapshot.docs.map(d => ({ id: d.id, data: d.data() })))
        
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
        console.log('Logs state set:', logsData)

        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar dados admin:', err)
        console.error('Error details:', err)
        setLoading(false)
      }
    }

    fetchAdminData()
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-semibold">Nome</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Email</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Treinos</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Logs</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Última Atividade</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
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
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">User</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
