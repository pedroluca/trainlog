import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff } from 'lucide-react'
import { trackLogin, trackPageView } from '../utils/analytics'
import logo from '../assets/nova-logo-clear.png'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()

  useEffect(() => {
    trackPageView('login')
    
    if (usuarioID) {
      navigate('/train')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const uid = user.uid

      // Check if user is active in Firestore
      const userDocRef = doc(db, 'usuarios', uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        // User document doesn't exist, sign out and show error
        await auth.signOut()
        setError('Conta não encontrada no sistema. Entre em contato com o administrador.')
        return
      }

      const userData = userDoc.data()
      
      // Check if user is active (default to true for users without isActive field for backward compatibility)
      const isActive = userData.isActive !== undefined ? userData.isActive : true
      
      if (!isActive) {
        // User is inactive, sign out and show error
        await auth.signOut()
        setError('Sua conta está inativa. Entre em contato com o administrador para ativá-la.')
        return
      }

      // User is active, proceed with login
      localStorage.setItem("usuarioId", uid)
      trackLogin('email')
      navigate('/train')
    } catch (err) {
      setError('Falha ao fazer login: Verifique suas credenciais!')
      console.error('Erro ao fazer login:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu email para recuperar a senha')
      return
    }

    setLoading(true)
    setError('')

    try {
      await sendPasswordResetEmail(auth, email)
      setResetEmailSent(true)
      setError('')
    } catch (err) {
      setError('Erro ao enviar email de recuperação. Verifique se o email está correto.')
      console.error('Erro ao enviar email:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-[#121212] p-4">
      <div className="bg-white dark:bg-[#2d2d2d] shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border border-gray-100 dark:border-[#404040]">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="TrainLog Logo" className="h-16 w-auto drop-shadow-sm" />
        </div>
        <h1 className="text-3xl font-black text-center mb-2 text-gray-800 dark:text-gray-100">
          {showForgotPassword ? 'Recuperar Senha' : 'Bem-vindo!'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          {showForgotPassword ? 'Para redefinir sua senha' : 'Faça login para continuar seus treinos'}
        </p>
        
        {error && <p className="text-red-500 text-sm font-medium text-center mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
        {resetEmailSent && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              ✓ Email de recuperação enviado! Verifique sua caixa de entrada.
            </p>
          </div>
        )}

        {!showForgotPassword ? (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 pr-12 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="cursor-pointer text-sm font-semibold text-[#27AE60] hover:text-[#219150] transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full py-3.5 px-4 rounded-xl text-white font-bold text-lg shadow-md transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#27AE60] hover:bg-[#219150] hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        ) : (
          /* Forgot Password Form */
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email cadastrado</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
                placeholder="seu@email.com"
              />
            </div>
            
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className={`cursor-pointer w-full py-3.5 px-4 rounded-xl text-white font-bold text-lg shadow-md transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#27AE60] hover:bg-[#219150] hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                   <span>Enviando...</span>
                </div>
              ) : (
                'Enviar Recuperação'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
                setError('')
              }}
              className="cursor-pointer w-full text-sm text-gray-600 dark:text-gray-400 hover:underline mt-2"
            >
              ← Voltar para login
            </button>
          </div>
        )}
        
        {!showForgotPassword && (
          <p className="text-center mt-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-[#27AE60] hover:text-[#219150] hover:underline transition-colors font-bold">
              Cadastre-se agora
            </Link>
          </p>
        )}
      </div>
      
      {/* Version Display */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-500">{getVersionWithPrefix()}</p>
      </div>
    </main>
  )
}