import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebaseConfig'
import { doc, setDoc } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'

export function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    try {
      // Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Atualiza o perfil do usuário com o nome
      await updateProfile(user, { displayName: name })

      // Salva informações adicionais no Firestore
      const userDocRef = doc(db, 'usuarios', user.uid) // Cria um documento com o UID do usuário
      await setDoc(userDocRef, {
        nome: name,
        email: email,
        criadoEm: new Date().toISOString(), // Data de criação
      })

      navigate('/login') // Redireciona para a página inicial após o cadastro
    } catch (err) {
      setError('Falha ao criar conta. Verifique os dados fornecidos.')
      console.error('Erro ao criar conta:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex py-2 justify-center min-h-[calc(100vh-7rem)] bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 pb-2 w-full max-w-md mx-4 overflow-y-auto">
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
          <div>
            <label className="block text-gray-700 font-bold mb-2">Confirme sua senha:</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Confirme sua senha"
            />
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
    </main>
  )
}