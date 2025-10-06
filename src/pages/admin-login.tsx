import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '../components/button'
import { Shield } from 'lucide-react'

export function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Admin - TrainLog'
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if user is admin
      const userDocRef = doc(db, 'usuarios', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado')
      }

      const userData = userDoc.data()
      
      if (!userData.isAdmin) {
        // Not an admin - sign out and show error
        await auth.signOut()
        setError('Acesso negado. Você não tem permissões de administrador.')
        setLoading(false)
        return
      }

      // Success - store admin info and redirect
      localStorage.setItem('adminId', user.uid)
      localStorage.setItem('isAdmin', 'true')
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Erro no login admin:', err)
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos')
      } else if (error.message?.includes('permissões')) {
        setError(error.message)
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="bg-gray-800/50 backdrop-blur-xl shadow-2xl rounded-2xl p-8 w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#27AE60] to-[#219150] rounded-full flex items-center justify-center mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Acesso restrito a administradores</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent transition-all"
              placeholder="admin@trainlog.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#27AE60] to-[#219150] hover:from-[#219150] hover:to-[#1e8449] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg mt-6"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verificando...
              </div>
            ) : (
              'Entrar como Admin'
            )}
          </Button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar para home
          </button>
        </div>
      </div>
    </main>
  )
}
