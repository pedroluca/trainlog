import { useState } from 'react'
import { auth, db } from '../firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff } from 'lucide-react'
import { Toast, ToastState } from '../components/toast'

export function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })
  const navigate = useNavigate()

  // Phone mask for Brazilian format: (99) 99999-9999
  const handlePhoneChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    
    // Apply mask
    let formatted = digits
    if (digits.length > 0) {
      formatted = `(${digits.substring(0, 2)}`
    }
    if (digits.length >= 3) {
      formatted += `) ${digits.substring(2, 7)}`
    }
    if (digits.length >= 8) {
      formatted += `-${digits.substring(7, 11)}`
    }
    
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate all fields
      if (!name.trim()) {
        setToast({ show: true, message: 'Por favor, digite seu nome.', type: 'error' })
        setLoading(false)
        return
      }

      if (!email.trim()) {
        setToast({ show: true, message: 'Por favor, digite seu email.', type: 'error' })
        setLoading(false)
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setToast({ show: true, message: 'Por favor, digite um email válido.', type: 'error' })
        setLoading(false)
        return
      }

      // Validate phone (must have 11 digits)
      const phoneDigits = phone.replace(/\D/g, '')
      if (phoneDigits.length !== 11) {
        setToast({ show: true, message: 'Por favor, insira um telefone válido com DDD.', type: 'error' })
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setToast({ show: true, message: 'As senhas não coincidem!', type: 'error' })
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setToast({ show: true, message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' })
        setLoading(false)
        return
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const user = userCredential.user

      // Create user document in Firestore with the same UID
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: phone,
        isPremium: false, // Start as free user
        isAdmin: false,
        isActive: true,
        criadoEm: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        scheduledDays: [], // Empty array, user will set later
      })

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Erro ao criar conta:', err)
      
      // Handle Firebase Authentication errors
      const error = err as { code?: string; message?: string }
      let errorMessage = 'Erro ao criar conta. Tente novamente.'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado. Faça login ou use outro email.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.'
      }
      
      setToast({ show: true, message: errorMessage, type: 'error' })
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100 dark:bg-[#1a1a1a]">
        <div className="bg-white dark:bg-[#2d2d2d] shadow-md rounded-lg p-8 w-[90%] max-w-md mx-4 text-center border border-gray-200 dark:border-[#404040]">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Conta Criada!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sua conta foi criada com sucesso! 🎉
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecionando para a página de login...
          </p>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-500">{getVersionWithPrefix()}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100 dark:bg-[#1a1a1a]">
      <div className="bg-white dark:bg-[#2d2d2d] shadow-md rounded-lg p-6 pb-4 w-[90%] max-w-md mx-4 border border-gray-200 dark:border-[#404040]">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-gray-100">Criar Conta</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Crie sua conta gratuita e comece a treinar! 💪
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Nome:</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
              placeholder="Digite seu nome completo"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email:</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Telefone:</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              maxLength={15}
              className="w-full border dark:border-[#404040] rounded px-3 py-2 dark:bg-[#1a1a1a] dark:text-gray-100"
              placeholder="(11) 99999-9999"
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
                placeholder="Mínimo 6 caracteres"
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
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Confirme sua senha:</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border dark:border-[#404040] rounded px-3 py-2 pr-10 dark:bg-[#1a1a1a] dark:text-gray-100"
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded text-white font-bold ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#27AE60] hover:bg-[#219150]'
            } transition-colors`}
          >
            {loading ? 'Criando conta...' : 'Criar Conta Gratuita'}
          </button>
        </form>
        
        <p className="text-center mt-6 mb-2 text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Entre aqui
          </Link>
        </p>      
      </div>
      
      {/* Version Display */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-500">{getVersionWithPrefix()}</p>
      </div>

      {/* Toast Notification */}
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