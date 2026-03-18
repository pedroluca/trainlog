import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/button'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff } from 'lucide-react'
import { trackLogin, trackPageView } from '../utils/analytics'

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
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gray-100 dark:bg-[#1a1a1a]">
      <div className="bg-white dark:bg-[#2d2d2d] shadow-md rounded-lg p-8 w-[85%] max-w-md border border-gray-200 dark:border-[#404040]">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          {showForgotPassword ? 'Recuperar Senha' : 'Login'}
        </h1>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email:</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
                placeholder="Digite seu email"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Senha:</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border dark:border-[#404040] rounded px-3 py-2 pr-10 dark:bg-[#1a1a1a] dark:text-gray-100"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-500 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-bold ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </Button>
          </form>
        ) : (
          /* Forgot Password Form */
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
              Digite seu email para receber um link de recuperação de senha
            </p>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email:</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
                placeholder="Digite seu email"
              />
            </div>
            
            <Button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-bold ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#27AE60] hover:bg-[#229954]'
              }`}
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </Button>
            
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
                setError('')
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:underline mt-2"
            >
              ← Voltar para login
            </button>
          </div>
        )}
        
        {!showForgotPassword && (
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-blue-500 hover:underline">
              Cadastre-se
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