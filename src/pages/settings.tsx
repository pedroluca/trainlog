import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { Button } from '../components/button'
import { ArrowLeft, Volume2, VolumeX, Lock, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/theme-context'
import { Toast, ToastState } from '../components/toast'

export function Settings() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const { theme, toggleTheme } = useTheme()
  
  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  })

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
      return
    }

    const fetchSettings = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Audio is disabled by default
          setAudioEnabled(userData.audioEnabled === true)
        }
      } catch (err) {
        console.error('Erro ao buscar configurações:', err)
      }
    }

    fetchSettings()
  }, [usuarioID, navigate])

  const handleAudioToggle = async () => {
    if (!usuarioID) return

    try {
      setLoadingAudio(true)
      const newAudioState = !audioEnabled
      
      const userDocRef = doc(db, 'usuarios', usuarioID)
      await updateDoc(userDocRef, {
        audioEnabled: newAudioState
      })

      setAudioEnabled(newAudioState)
    } catch (err) {
      console.error('Erro ao atualizar configuração de áudio:', err)
      setToast({ show: true, message: 'Erro ao atualizar configuração de áudio.', type: 'error' })
    } finally {
      setLoadingAudio(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('A nova senha deve ser diferente da atual')
      return
    }

    try {
      setLoadingPassword(true)
      const user = auth.currentUser

      if (!user || !user.email) {
        setPasswordError('Usuário não autenticado')
        return
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      setPasswordSuccess('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess('')
      }, 3000)
    } catch (err) {
      console.error('Erro ao alterar senha:', err)
      
      if (err instanceof Error && 'code' in err) {
        const firebaseError = err as { code: string }
        
        if (firebaseError.code === 'auth/wrong-password') {
          setPasswordError('Senha atual incorreta')
        } else if (firebaseError.code === 'auth/too-many-requests') {
          setPasswordError('Muitas tentativas. Tente novamente mais tarde.')
        } else {
          setPasswordError('Erro ao alterar senha. Tente novamente.')
        }
      } else {
        setPasswordError('Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#1a1a1a] p-4 pb-24">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar ao Perfil</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
      </div>

      {/* Dark Mode Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="text-blue-400" /> : <Sun className="text-yellow-500" />}
          Modo Escuro
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 mb-1">
              Tema escuro
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reduz o brilho da tela e economiza bateria
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:ring-offset-2 ${
              theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Audio Settings Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          {audioEnabled ? <Volume2 className="text-[#27AE60]" /> : <VolumeX className="text-gray-400" />}
          Notificações Sonoras
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 mb-1">
              Som ao final do descanso
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toca um som quando o timer de descanso termina
            </p>
          </div>
          
          <button
            onClick={handleAudioToggle}
            disabled={loadingAudio}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:ring-offset-2 ${
              audioEnabled ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
            } ${loadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                audioEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-[#404040]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Lock className="text-gray-700 dark:text-gray-300" />
          Alterar Senha
        </h2>

        {!showPasswordSection ? (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Altere sua senha de acesso à conta
            </p>
            <Button
              onClick={() => setShowPasswordSection(true)}
              className="bg-[#27AE60] hover:bg-[#219150] text-white px-6 py-2"
            >
              Alterar Senha
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                  placeholder="Digite sua nova senha (mín. 6 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                  placeholder="Digite novamente sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {passwordSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                }}
                buttonTextColor="text-gray-800"
                className="bg-gray-300 hover:bg-gray-400"
                disabled={loadingPassword}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#27AE60] hover:bg-[#219150] text-white"
                disabled={loadingPassword}
              >
                {loadingPassword ? 'Alterando...' : 'Confirmar Alteração'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Future Settings Placeholder */}
      <div className="bg-gray-50 dark:bg-[#2d2d2d] shadow rounded-xl p-6 w-full max-w-2xl mt-4 border border-gray-200 dark:border-[#404040]">
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Mais configurações em breve...
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          • Unidades de medida<br />
          • Notificações personalizadas<br />
          • E muito mais!
        </p>
      </div>
      
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
