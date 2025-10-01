import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig' // Certifique-se de que o firebaseConfig está configurado corretamente
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/button'
import { getVersionWithPrefix } from '../version'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usuarioID = localStorage.getItem('usuarioId')
  const navigate = useNavigate()

  useEffect(() => {
    if (usuarioID) {
      navigate('/train')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user
          const uid = user.uid
          localStorage.setItem("usuarioId", uid)
          navigate('/train')
        })
    } catch (err) {
      setError('Falha ao fazer login: Verifique suas credenciais!')
      console.error('Erro ao fazer login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-[85%] max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Digite sua senha"
            />
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
        <p className="text-center mt-4">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-blue-500 hover:underline">
            Cadastre-se
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