import { useState } from 'react'
import { db } from '../firebaseConfig'
import { collection, addDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import QRCodeRegister from '../assets/qr-code-register.jpg' // QR Code para R$ 14,90
import { Toast, ToastState } from '../components/toast'

export function Cadastro() {
  const [step, setStep] = useState(1) // 1, 2, or 3
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pixKeyCopied, setPixKeyCopied] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })
  const navigate = useNavigate()

  // PIX Configuration for Registration
  const PIX_KEY = 'suporte@trainlog.site'
  const PIX_VALUE = '14.90' // Registration fee
  const ADMIN_WHATSAPP = '5577936181281'

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setPixKeyCopied(true)
    setToast({ show: true, message: 'Chave PIX copiada!', type: 'success' })
    setTimeout(() => setPixKeyCopied(false), 2000)
  }

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

    // Validate step 1 fields
    if (!name.trim()) {
      setToast({ show: true, message: 'Por favor, digite seu nome.', type: 'error' })
      return
    }

    if (!email.trim()) {
      setToast({ show: true, message: 'Por favor, digite seu email.', type: 'error' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setToast({ show: true, message: 'Por favor, digite um email válido.', type: 'error' })
      return
    }

    // Validate phone (must have 11 digits)
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length !== 11) {
      setToast({ show: true, message: 'Por favor, insira um telefone válido com DDD.', type: 'error' })
      return
    }

    // Move to step 2
    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(false)

    if (password !== confirmPassword) {
      setToast({ show: true, message: 'As senhas não coincidem!', type: 'error' })
      return
    }

    if (password.length < 6) {
      setToast({ show: true, message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' })
      return
    }

    // Move to step 3 (payment)
    setStep(3)
  }

  const handleStep3Submit = async () => {
    setLoading(true)

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
      console.error('Erro ao criar solicitação:', err)
      setToast({ show: true, message: 'Erro ao enviar solicitação. Tente novamente.', type: 'error' })
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
      <div className="bg-white shadow-md rounded-lg p-6 pb-2 w-[90%] max-w-md mx-4 overflow-y-auto max-h-[85vh]">
        <h1 className="text-2xl font-bold text-center mb-2">Solicitar Cadastro</h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          {step === 1 && 'Passo 1 de 3: Informações pessoais'}
          {step === 2 && 'Passo 2 de 3: Criar senha'}
          {step === 3 && 'Passo 3 de 3: Pagamento'}
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' 
            }}
          ></div>
        </div>

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
        ) : step === 2 ? (
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
                className="flex-1 py-2 px-4 rounded text-white font-bold bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                Próximo <ArrowRight size={20} />
              </button>
            </div>
          </form>
        ) : (
          // Step 3: PIX Payment
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Nome: <span className="font-semibold">{name}</span></p>
              <p className="text-sm text-gray-600 mb-1">Email: <span className="font-semibold">{email}</span></p>
              <p className="text-sm text-gray-600">Telefone: <span className="font-semibold">{phone}</span></p>
            </div>

            {/* PIX Payment Section */}
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4'>
              <h3 className='font-bold text-gray-800 mb-3 flex items-center justify-center gap-2'>
                💚 Pagamento via PIX
              </h3>
              
              {/* PIX Key */}
              <div className='bg-white rounded-lg p-3 mb-3'>
                <p className='text-xs text-gray-500 mb-1'>Chave PIX:</p>
                <div className='flex items-center justify-between gap-2'>
                  <code className='text-sm font-mono text-gray-800 break-all'>
                    {PIX_KEY}
                  </code>
                  <button
                    type="button"
                    onClick={copyPixKey}
                    className='flex-shrink-0 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors'
                  >
                    {pixKeyCopied ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Value */}
              <div className='bg-white rounded-lg p-3 mb-3'>
                <p className='text-xs text-gray-500 mb-1'>Valor do Cadastro:</p>
                <p className='text-2xl font-bold text-green-600'>R$ {PIX_VALUE}</p>
              </div>

              {/* QR Code */}
              <div className='bg-white rounded-lg p-4 mb-3'>
                <p className='text-xs text-gray-500 mb-2'>QR Code PIX:</p>
                <div className='w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300'>
                  <img src={QRCodeRegister} alt="QR Code PIX Cadastro" className="w-full h-full object-contain" />
                </div>
                <p className='text-xs text-gray-500 mt-2 text-center'>
                  Abra seu app bancário → PIX → Ler QR Code
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
              <p className='text-sm text-blue-800 font-semibold mb-2'>
                📋 Após o pagamento:
              </p>
              <ol className='text-left text-sm text-blue-800 space-y-1 ml-4'>
                <li>1. Tire print/foto do comprovante</li>
                <li>2. Envie via WhatsApp ou Email abaixo</li>
                <li>3. Aguarde aprovação do admin</li>
                <li>4. Faça login com suas credenciais! 🎉</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className='space-y-2 mb-4'>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}?text=Olá! Acabei de fazer o pagamento do cadastro TrainLog (R$ ${PIX_VALUE}). Meu nome: ${name}. Segue o comprovante:`}
                target='_blank'
                rel='noopener noreferrer'
                className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
              >
                <span className='text-xl'>📱</span>
                Enviar Comprovante via WhatsApp
              </a>

              <a
                href={`mailto:suporte@trainlog.site?subject=Comprovante Cadastro TrainLog - ${name}&body=Olá!%0A%0AAcabei de fazer o pagamento do cadastro TrainLog (R$ ${PIX_VALUE}).%0A%0AMeus dados:%0ANome: ${name}%0AEmail: ${email}%0ATelefone: ${phone}%0A%0AComprovante em anexo.`}
                className='w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
              >
                <span className='text-xl'>📧</span>
                Enviar Comprovante via Email
              </a>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 px-4 rounded text-gray-700 font-bold bg-gray-300 hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} /> Voltar
              </button>
              <button
                type="button"
                onClick={handleStep3Submit}
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded text-white font-bold ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {loading ? 'Enviando...' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>
        )}
        
        <p className="text-center mt-6 mb-4">
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