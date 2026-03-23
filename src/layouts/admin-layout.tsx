import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { LayoutDashboard, Users, Activity, Bug, LogOut, Menu, X } from 'lucide-react'

export type UserData = {
  id: string
  nome: string
  email: string
  isAdmin?: boolean
  isActive?: boolean
  isPremium?: boolean
  criadoEm?: unknown
}

export type WorkoutData = {
  id: string
  usuarioID: string
  dia: string
  musculo: string
}

export type LogData = {
  id: string
  usuarioID: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  data: string
}

export type UpgradeRequest = {
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

export type AdminContextData = {
  adminId: string
  adminName: string
  users: UserData[]
  setUsers: React.Dispatch<React.SetStateAction<UserData[]>>
  workouts: WorkoutData[]
  logs: LogData[]
  upgradeRequests: UpgradeRequest[]
  setUpgradeRequests: React.Dispatch<React.SetStateAction<UpgradeRequest[]>>
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const adminId = localStorage.getItem('adminId')
  const isAdmin = localStorage.getItem('isAdmin')

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [workouts, setWorkouts] = useState<WorkoutData[]>([])
  const [logs, setLogs] = useState<LogData[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [adminName, setAdminName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        const usersData: UserData[] = usersSnapshot.docs.map((d) => ({
          id: d.id,
          nome: d.data().nome || 'Sem nome',
          email: d.data().email || 'Sem email',
          isAdmin: d.data().isAdmin || false,
          isActive: d.data().isActive !== undefined ? d.data().isActive : true,
          isPremium: d.data().isPremium || false,
          criadoEm: d.data().criadoEm,
        }))
        setUsers(usersData)

        // Fetch upgrade requests
        const upgradeRequestsRef = collection(db, 'upgrade_requests')
        const upgradeRequestsSnapshot = await getDocs(upgradeRequestsRef)
        const upgradeRequestsData: UpgradeRequest[] = upgradeRequestsSnapshot.docs.map((d) => ({
          id: d.id,
          userId: d.data().userId,
          userName: d.data().userName,
          userEmail: d.data().userEmail,
          userPhone: d.data().userPhone,
          message: d.data().message,
          status: d.data().status,
          createdAt: d.data().createdAt,
          updatedAt: d.data().updatedAt,
          processedBy: d.data().processedBy,
          processedAt: d.data().processedAt,
        }))
        // Only show pending
        setUpgradeRequests(upgradeRequestsData.filter(req => req.status === 'pending'))

        // Fetch all workouts
        const workoutsRef = collection(db, 'treinos')
        const workoutsSnapshot = await getDocs(workoutsRef)
        const workoutsData: WorkoutData[] = workoutsSnapshot.docs.map((d) => ({
          id: d.id,
          usuarioID: d.data().usuarioID,
          dia: d.data().dia,
          musculo: d.data().musculo,
        }))
        setWorkouts(workoutsData)

        // Fetch all logs
        const logsRef = collection(db, 'logs')
        const logsSnapshot = await getDocs(logsRef)
        const logsData: LogData[] = logsSnapshot.docs.map((d) => ({
          id: d.id,
          usuarioID: d.data().usuarioID,
          titulo: d.data().titulo,
          series: d.data().series,
          repeticoes: d.data().repeticoes,
          peso: d.data().peso,
          data: d.data().data,
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

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Usuários', path: '/admin/dashboard/users', icon: <Users size={20} /> },
    { name: 'Atividades', path: '/admin/dashboard/activities', icon: <Activity size={20} /> },
    { name: 'Reporte de Bugs', path: '/admin/dashboard/bugs', icon: <Bug size={20} /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando painel admin...</p>
        </div>
      </div>
    )
  }

  const contextData: AdminContextData = {
    adminId: adminId!,
    adminName,
    users,
    setUsers,
    workouts,
    logs,
    upgradeRequests,
    setUpgradeRequests
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Train<span className="text-[#27AE60]">Log</span></h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Admin Panel</p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
                  ${isActive 
                    ? 'bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                {link.icon}
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-gray-800/50 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {adminName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-medium text-sm truncate">{adminName}</p>
              <p className="text-gray-400 text-xs">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-semibold text-sm border border-red-500/20"
          >
            <LogOut size={18} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet context={contextData} />
        </main>
      </div>
    </div>
  )
}
