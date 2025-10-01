import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { Button } from '../components/button'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const oobCode = searchParams.get('oobCode') // Firebase reset code from URL

  useEffect(() => {
    // Verify the reset code when component loads
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Link inválido ou expirado')
        setVerifying(false)
        return
      }

      try {
        // Verify the code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(userEmail)
        setVerifying(false)
      } catch (err) {
        console.error('Error verifying reset code:', err)
        setError('Este link de recuperação é inválido ou já expirou. Solicite um novo link.')
        setVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!oobCode) {
      setError('Código de recuperação inválido')
      return
    }

    setLoading(true)

    try {
      // Reset the password
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Error resetting password:', err)
      setError('Erro ao redefinir senha. O link pode ter expirado. Tente solicitar um novo.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while verifying code
  if (verifying) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[85%] max-w-md">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Verificando link de recuperação...</p>
          </div>
        </div>
      </main>
    )
  }

  // Success state
  if (success) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-br from-green-50 to-gray-100">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[85%] max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Senha Redefinida!</h1>
            <p className="text-gray-600 mb-4">
              Sua senha foi alterada com sucesso.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para o login em 3 segundos...
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Error state (invalid or expired link)
  if (error && !email) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-br from-red-50 to-gray-100">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[85%] max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-[#27AE60] hover:bg-[#229954] text-white py-2 px-4 rounded-lg font-bold"
            >
              Voltar para Login
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Main form
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-[85%] max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#27AE60] to-[#229954] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Nova Senha</h1>
          <p className="text-gray-600 text-sm">
            Defina uma nova senha para: <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Nova Senha:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent transition-all"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Confirmar Senha:</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-transparent transition-all"
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#27AE60] to-[#229954] hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-[#27AE60] hover:underline transition-colors"
          >
            ← Voltar para login
          </button>
        </div>
      </div>
    </main>
  )
}
