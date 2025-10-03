import { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'

export function Cadastro() {
  const [step, setStep] = useState(1) // 1 or 2
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate step 1 fields
    if (!name.trim()) {
      setError('Por favor, digite seu nome.')
      return
    }

    if (!email.trim()) {
      setError('Por favor, digite seu email.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um email válido.')
      return
    }

    // Validate phone (must have 11 digits)
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length !== 11) {
      setError('Por favor, insira um telefone válido com DDD.')
      return
    }

    // Move to step 2
    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      // Create pending registration request
      await addDoc(collection(db, 'registrationRequests'), {
        nome: name,
        email: email,
        telefone: phone,
        senha: password, // Store temporarily (will be used to create account when approved)
        status: 'pending', // pending, approved, rejected
        criadoEm: new Date().toISOString(),
        aprovedoEm: null,
        aprovedoPor: null,
      })

      setSuccess(true)
      
      // Redirect to success page after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError('Erro ao enviar solicitação. Tente novamente.')
      console.error('Erro ao criar solicitação:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-8 w-[90%] max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitação Enviada!</h2>
          <p className="text-gray-600 mb-4">
            Sua solicitação de cadastro foi recebida com sucesso. 
            Você receberá uma resposta em breve.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para a página de login...
          </p>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-gray-500">{getVersionWithPrefix()}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 pb-2 w-[90%] max-w-md mx-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-center mb-2">Solicitar Cadastro</h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          {step === 1 ? 'Passo 1 de 2: Informações pessoais' : 'Passo 2 de 2: Criar senha'}
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        {step === 1 ? (
          // Step 1: Personal Information
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Nome:</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Digite seu nome completo"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Email:</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Telefone:</label>
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                maxLength={15}
                className="w-full border rounded px-3 py-2"
                placeholder="(11) 99999-9999"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded text-white font-bold bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              Próximo <ArrowRight size={20} />
            </button>
          </form>
        ) : (
          // Step 2: Password
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Nome: <span className="font-semibold">{name}</span></p>
              <p className="text-sm text-gray-600 mb-1">Email: <span className="font-semibold">{email}</span></p>
              <p className="text-sm text-gray-600">Telefone: <span className="font-semibold">{phone}</span></p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-bold mb-2">Senha:</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 pr-10"
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
              <label className="block text-gray-700 font-bold mb-2">Confirme sua senha:</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 pr-10"
                  placeholder="Confirme sua senha"
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
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 rounded text-gray-700 font-bold bg-gray-300 hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} /> Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded text-white font-bold ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </form>
        )}
        
        <p className="text-center mt-2">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Entre aqui
          </Link>
        </p>      
      </div>
      
      {/* Version Display */}
      <div className="mt-4">
        <p className="text-xs text-gray-500">{getVersionWithPrefix()}</p>
      </div>
    </main>
  )
}