import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle2, Headset, X } from 'lucide-react'
import { Button } from '../components/button'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { notifyAdmins } from '../utils/admin-notifications'

export function SettingsSupport() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')

  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const [tipo, setTipo] = useState('Bug')
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
      return
    }

    const fetchUserInfo = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setNome(userData.nome || null)
          setEmail(userData.email || null)
          setUsername(userData.username || null)
        }
      } catch (err) {
        console.error('Erro ao buscar info:', err)
      }
    }

    fetchUserInfo()
  }, [usuarioID, navigate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }
      setImagem(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !mensagem.trim()) {
      setError('Por favor, preencha o título e a mensagem.')
      return
    }

    if (!usuarioID) return

    setLoading(true)
    setError('')

    try {
      let imageUrl = null

      if (imagem) {
        // Upload image
        const formData = new FormData()
        formData.append('image', imagem)
        formData.append('userId', usuarioID)
        
        const baseUploadUrl = import.meta.env.VITE_API_UPLOAD_URL as string
        const apiBugUrl = baseUploadUrl 
          ? baseUploadUrl.replace('upload-profile-image.php', 'upload-bug-report-image.php')
          : ''
        
        if (apiBugUrl) {
          const response = await fetch(apiBugUrl, {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Falha no upload da imagem')
          }

          const data = await response.json()
          if (!data.success) {
            throw new Error(data.message || 'Erro ao enviar a imagem')
          }

          imageUrl = data.imageUrl
        } else {
            console.warn("VITE_API_UPLOAD_URL não está definida nas variáveis de ambiente.")
        }
      }

      await addDoc(collection(db, 'bug_reports'), {
        usuarioID,
        nome: nome || 'Desconhecido',
        email: email || 'Desconhecido',
        username: username || 'Desconhecido',
        tipo,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        imagemUrl: imageUrl,
        dataCriacao: serverTimestamp(),
        status: 'pendente'
      })

      notifyAdmins(
        `Novo(a) ${tipo} Reportado! 🐞`,
        `${titulo.trim()} - Enviado por ${nome || 'Desconhecido'}`,
        '/admin/dashboard/bugs'
      ).catch(e => console.error('Silent error on push:', e))

      setSuccess(true)
      setTimeout(() => {
        navigate(-1)
      }, 2000)

    } catch (err) {
      console.error('Erro ao enviar reporte:', err)
      setError('Ocorreu um erro ao enviar seu reporte. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#121212] p-4 pb-24">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-gray-100 dark:border-[#333] animate-in fade-in duration-300">
          <CheckCircle2 size={64} className="text-[#27AE60] mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Relato Enviado!</h2>
          <p className="text-gray-600 dark:text-gray-400">Obrigado por nos ajudar a melhorar o TrainLog. Analisaremos em breve.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl mb-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <Headset className="text-blue-500" size={32} />
          Ajuda e Suporte
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Encontrou um problema ou tem uma sugestão? Relate bugs ou envie ideias.
        </p>
      </div>

      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo do Relato
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-300 dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
            >
              <option value="Bug">🐞 Reportar um Bug</option>
              <option value="Sugestão">💡 Dar uma Sugestão</option>
              <option value="Erro">⚠️ Erro no Aplicativo</option>
              <option value="Outro">💬 Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={`Ex: ${tipo === 'Bug' ? 'Botão não funciona' : tipo === 'Sugestão' ? 'Adicionar modo escuro' : 'Problema com...'}`}
              className="w-full border border-gray-300 dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensagem detalhada
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva o que aconteceu ou a sua ideia com detalhes..."
              className="w-full border border-gray-300 dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anexar um Print (opcional)
            </label>
            {!imagemPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#404040] rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors bg-gray-50/50 dark:bg-[#252525]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold text-blue-500 dark:text-blue-400">Clique para enviar</span></p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG ou WEBP (Max. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative inline-block">
                <img src={imagemPreview} alt="Preview" className="h-32 rounded-xl object-cover border border-gray-200 dark:border-[#404040]" />
                <button
                  type="button"
                  onClick={() => {
                    setImagem(null)
                    setImagemPreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[#333]">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Relato'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
