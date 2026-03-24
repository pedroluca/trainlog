import { useState } from 'react'
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from './button'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'

interface ReportBugModalProps {
  onClose: () => void
  usuarioID: string
  nome: string | null
  email: string | null
  username: string | null
}

export function ReportBugModal({ onClose, usuarioID, nome, email, username }: ReportBugModalProps) {
  const [tipo, setTipo] = useState('Bug')
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

    setLoading(true)
    setError('')

    try {
      let imageUrl = null

      if (imagem) {
        // Upload image
        const formData = new FormData()
        formData.append('image', imagem)
        formData.append('userId', usuarioID)
        
        // Determina a URL baseado na VITE_API_UPLOAD_URL se existir
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

      // Save to Firestore
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

      setSuccess(true)
      setTimeout(() => {
        onClose()
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
      <div className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex flex-col items-center justify-center px-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center border border-gray-100 dark:border-[#333]">
          <CheckCircle2 size={64} className="text-[#27AE60] mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Relato Enviado!</h2>
          <p className="text-gray-600 dark:text-gray-400">Obrigado por nos ajudar a melhorar o TrainLog. Analisaremos em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex flex-col lg:flex-row items-end lg:items-center justify-center lg:px-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] w-full lg:w-[500px] lg:rounded-2xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-full lg:slide-in-from-bottom-8 duration-300 border border-gray-100 dark:border-[#333]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#333]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle className="text-blue-500" />
            Reportar
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-[#333] flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#404040] text-gray-700 dark:text-gray-200"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Relato'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
