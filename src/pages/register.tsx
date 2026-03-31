import { useState } from 'react'
import { auth, db } from '../firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { notifyAdmins } from '../utils/admin-notifications'
import { Eye, EyeOff } from 'lucide-react'
import { Toast, ToastState } from '../components/toast'
import logo from '../assets/nova-logo-clear.png'

export function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [cref, setCref] = useState('')
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
        isTrainer,
        cref: isTrainer ? cref.trim().toUpperCase() : '',
        isPremium: false, // Start as free user
        isAdmin: false,
        isActive: true,
        criadoEm: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        scheduledDays: [], // Empty array, user will set later
      })

      // Notifica Administradores em Background
      notifyAdmins(
        'Novo Usuário Registrado! 🎉',
        `Nome: ${name.trim()} | Email: ${email.trim().toLowerCase()}`,
        '/admin/dashboard/users'
      ).catch(e => console.error('Silent error on push:', e))

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
      <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-[#121212]">
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
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-[#1a1a1a] py-8 px-4">
      <div className="bg-white dark:bg-[#2d2d2d] shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md sm:max-w-2xl border border-gray-100 dark:border-[#404040]">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="TrainLog Logo" className="h-16 w-auto drop-shadow-sm" />
        </div>
        <h1 className="text-3xl font-black text-center mb-2 text-gray-800 dark:text-gray-100">Junte-se a nós</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          Acompanhe seus treinos e evolua mais rápido 💪
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full mt-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome completo</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
              placeholder="Ex: Pedro Silva"
            />
          </div>
          
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
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefone com DDD</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              maxLength={15}
              className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#1f1f1f] p-4 transition-all">
            <label className="flex items-center justify-between cursor-pointer gap-3">
              <div>
                <p className="text-gray-800 dark:text-gray-100 font-bold text-sm">Sou treinador</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ative para gerenciar alunos</p>
              </div>
              <input
                type="checkbox"
                checked={isTrainer}
                onChange={(e) => setIsTrainer(e.target.checked)}
                className="w-5 h-5 accent-[#27AE60] rounded cursor-pointer"
              />
            </label>

            {isTrainer && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#404040]">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">CREF (opcional)</label>
                <input
                  type="text"
                  name="cref"
                  value={cref}
                  onChange={(e) => setCref(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all text-sm"
                  placeholder="Ex: CREF 123456-G/SP"
                  maxLength={30}
                />
              </div>
            )}
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
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirme a senha</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 pr-12 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/50 font-medium transition-all"
                placeholder="Repita sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`cursor-pointer w-full sm:col-span-2 mt-4 py-3.5 px-4 rounded-xl text-white font-bold text-lg shadow-md transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#27AE60] hover:bg-[#219150] hover:shadow-lg'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                <span>Criando conta...</span>
              </div>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>
        
        <p className="text-center mt-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-[#27AE60] hover:text-[#219150] hover:underline transition-colors font-bold">
             Faça login
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