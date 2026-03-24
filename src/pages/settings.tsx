import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { Button } from '../components/button'
import { ArrowLeft, Bell, BellOff, Eye, EyeOff, Headset, Lock, Moon, Shield, Sun, Volume2, VolumeX } from 'lucide-react'
import { useTheme } from '../contexts/theme-context'
import { Toast, ToastState } from '../components/toast'
import { ReportBugModal } from '../components/report-bug-modal'
import { Footer } from '../components/footer'
import { requestNotificationPermission } from '../firebaseConfig'

export function Settings() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const { theme, toggleTheme } = useTheme()
  
  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)

  // User Info & Modals
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)

  // Push Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [notifLoading, setNotifLoading] = useState(false)

  // Privacy Settings
  const [privacidade, setPrivacidade] = useState({
    ocultarEmail: false,
    ocultarNascimento: false,
    ocultarAtividades: false,
    ocultarTreinos: false,
    ocultarAmigos: false,
    ocultarStreak: false,
    ocultarPeso: false,
    ocultarAltura: false,
    ocultarInstagram: false
  })
  const [loadingPrivacy, setLoadingPrivacy] = useState(false)
  const [showPrivacySection, setShowPrivacySection] = useState(false)

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
          // User info for bug reports
          setNome(userData.nome || null)
          setEmail(userData.email || null)
          setUsername(userData.username || null)
          
          // Audio is disabled by default
          setAudioEnabled(userData.audioEnabled === true)
          if (userData.privacidade) {
            setPrivacidade({
              ocultarEmail: userData.privacidade.ocultarEmail || false,
              ocultarNascimento: userData.privacidade.ocultarNascimento || false,
              ocultarAtividades: userData.privacidade.ocultarAtividades || false,
              ocultarTreinos: userData.privacidade.ocultarTreinos || false,
              ocultarAmigos: userData.privacidade.ocultarAmigos || false,
              ocultarStreak: userData.privacidade.ocultarStreak || false,
              ocultarPeso: userData.privacidade.ocultarPeso || false,
              ocultarAltura: userData.privacidade.ocultarAltura || false,
              ocultarInstagram: userData.privacidade.ocultarInstagram || false,
            })
          }
        }
      } catch (err) {
        console.error('Erro ao buscar configurações:', err)
      }
    }

    fetchSettings()
    
    // Check current notification permission state
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [usuarioID, navigate])

  const handleEnableNotifications = async () => {
    if (!usuarioID) return
    setNotifLoading(true)
    try {
      const result = await requestNotificationPermission()
      if (result.success && result.token) {
        setNotifPermission('granted')
        await updateDoc(doc(db, 'usuarios', usuarioID), { fcmToken: result.token })
        setToast({ show: true, message: 'Notificações ativadas com sucesso! 🔔', type: 'success' })
      } else {
        setNotifPermission(result.permission === 'unsupported' ? 'default' : result.permission)
        const message = result.errorCode === 'permission-denied'
          ? 'Permissão de notificação negada.'
          : result.errorCode === 'missing-vapid'
            ? 'VAPID key ausente na produção. Verifique o .env e o build.'
            : result.errorCode === 'insecure-context'
              ? 'Notificações exigem HTTPS.'
              : result.errorCode === 'unsupported'
                ? 'Este navegador/ambiente não suporta notificações web.'
                : `Permissão concedida, mas falhou ao gerar token FCM. ${result.errorMessage || ''}`
        setToast({ show: true, message, type: 'error' })
      }
    } catch (err) {
      console.error('Erro ao ativar notificações:', err)
      setToast({ show: true, message: 'Erro ao ativar notificações.', type: 'error' })
    } finally {
      setNotifLoading(false)
    }
  }

  const handlePrivacyToggle = async (key: keyof typeof privacidade) => {
    if (!usuarioID) return
    try {
      setLoadingPrivacy(true)
      const newPrivacy = {
        ...privacidade,
        [key]: !privacidade[key]
      }
      const userDocRef = doc(db, 'usuarios', usuarioID)
      await updateDoc(userDocRef, {
        privacidade: newPrivacy
      })
      setPrivacidade(newPrivacy)
    } catch (err) {
      console.error('Erro ao atualizar privacidade:', err)
      setToast({ show: true, message: 'Erro ao atualizar preferências de privacidade.', type: 'error' })
    } finally {
      setLoadingPrivacy(false)
    }
  }

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

      {/* Push Notifications Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          {notifPermission === 'granted' ? <Bell className="text-[#27AE60]" /> : <BellOff className="text-gray-400" />}
          Notificações Push
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            {notifPermission === 'granted' ? (
              <>
                <p className="text-[#27AE60] font-semibold mb-1">Notificações ativas ✓</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você receberá lembretes de treino e novidades do app.
                </p>
              </>
            ) : notifPermission === 'denied' ? (
              <>
                <p className="text-red-500 font-semibold mb-1">Notificações bloqueadas</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Para ativar, vá até as configurações do seu navegador e permita notificações para este site.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
                  Receber lembretes de treino
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ative para receber avisos quando esquecer de treinar.
                </p>
              </>
            )}
          </div>
          
          {notifPermission !== 'denied' && notifPermission !== 'granted' && (
            <Button
              onClick={handleEnableNotifications}
              className="bg-[#27AE60] hover:bg-[#219150] text-white px-4 py-2 shrink-0 ml-2"
              disabled={notifLoading}
            >
              {notifLoading ? 'Aguarde...' : 'Ativar'}
            </Button>
          )}
          
          {notifPermission === 'granted' && (
            <div className="shrink-0 ml-4 w-10 h-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center border border-[#27AE60]/30">
              <Bell size={20} className="text-[#27AE60]" />
            </div>
          )}
        </div>

      </div>

      {/* Privacy Settings Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPrivacySection(!showPrivacySection)}
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 m-0 flex items-center gap-2">
            <Shield className="text-[#2980B9]" />
            Privacidade do Perfil
          </h2>
          <Button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 dark:bg-[#404040] dark:hover:bg-[#505050] text-gray-700 dark:text-gray-300 px-4 py-1.5 text-sm"
          >
            {showPrivacySection ? 'Ocultar' : 'Configurar'}
          </Button>
        </div>

        {showPrivacySection && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#404040] animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-[#404040]">
              Controle o que seus amigos podem ver quando acessarem o seu perfil. Ative as opções abaixo para ocultar a informação correspondente.
            </p>
            
            <div className="space-y-4">
          {[
            { key: 'ocultarEmail', label: 'Email', desc: 'Oculta seu endereço de email' },
            { key: 'ocultarNascimento', label: 'Data de Nascimento', desc: 'Oculta sua data e idade' },
            { key: 'ocultarInstagram', label: 'Instagram', desc: 'Oculta o link do seu perfil' },
            { key: 'ocultarPeso', label: 'Peso Corporal', desc: 'Oculta sua medição de peso' },
            { key: 'ocultarAltura', label: 'Altura', desc: 'Oculta sua medição de altura' },
            { key: 'ocultarAmigos', label: 'Lista de Amigos', desc: 'Impede verem quem você adicionou' },
            { key: 'ocultarStreak', label: 'Sequência (Streak)', desc: 'Oculta seus dias seguidos treinando' },
            { key: 'ocultarAtividades', label: 'Atividades (Logs)', desc: 'Oculta o feed de atividades recentes' },
            { key: 'ocultarTreinos', label: 'Meus Treinos', desc: 'Oculta suas rotinas de exercícios' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-gray-700 dark:text-gray-300 font-medium">Ocultar {item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => handlePrivacyToggle(item.key as keyof typeof privacidade)}
                disabled={loadingPrivacy}
                className={`cursor-pointer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2980B9] focus:ring-offset-2 ${
                  privacidade[item.key as keyof typeof privacidade] ? 'bg-[#2980B9]' : 'bg-gray-300 dark:bg-gray-600'
                } ${loadingPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    privacidade[item.key as keyof typeof privacidade] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
            </div>
          </div>
        )}
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
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
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

      {/* Bug Report Section */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Headset className="text-blue-500" />
          Ajuda e Suporte
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Encontrou um problema ou tem uma sugestão?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajude-nos a melhorar o aplicativo relatando bugs ou enviando ideias.
            </p>
          </div>
          
          <Button
            onClick={() => setIsBugModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shrink-0 ml-4"
          >
            Reportar
          </Button>
        </div>
      </div>

      {/* Future Settings Placeholder */}
      <div className="bg-gray-50 dark:bg-[#2d2d2d] shadow rounded-xl p-6 mb-4 w-full max-w-2xl border border-gray-200 dark:border-[#404040]">
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Mais configurações em breve...
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          • Unidades de medida<br />
          • Notificações personalizadas<br />
          • E muito mais!
        </p>
      </div>

      <Footer />
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {isBugModalOpen && usuarioID && (
        <ReportBugModal
          onClose={() => setIsBugModalOpen(false)}
          usuarioID={usuarioID}
          nome={nome}
          email={email}
          username={username}
        />
      )}
    </main>
  )
}
