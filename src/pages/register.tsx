import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, setDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'
import { getVersionWithPrefix } from '../version'
import { Eye, EyeOff } from 'lucide-react'

export function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()

  const firebaseErrorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'O email informado já está em uso.',
    'auth/invalid-email': 'O email informado não é válido.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Operação não permitida. Entre em contato com o suporte.',
    'auth/network-request-failed': 'Falha na conexão com a rede. Verifique sua internet.',
    'auth/internal-error': 'Ocorreu um erro interno. Tente novamente mais tarde.',
  }

  useEffect(() => {
    if (usuarioID) {
      navigate('/train')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Falha do criar conta: As senhas não coincidem!')
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, { displayName: name })

      const userDocRef = doc(db, 'usuarios', user.uid)
      await setDoc(userDocRef, {
        nome: name,
        email: email,
        criadoEm: new Date().toISOString(),
      })

      navigate('/login')
    } catch (err) {
      const errorMessage = firebaseErrorMessages[(err as { code: string }).code] || 'Ocorreu um erro inesperado. Tente novamente.'
      setError('Falha ao criar conta: ' + errorMessage)
      console.error('Erro ao criar conta:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 pb-2 w-[90%] max-w-md mx-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Cadastro</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Nome:</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Digite seu nome"
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
              placeholder="Digite seu email"
            />
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
                placeholder="Digite sua senha"
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
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-bold ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Carregando...' : 'Cadastrar'}
          </button>
        </form>
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