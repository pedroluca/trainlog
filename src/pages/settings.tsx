import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ArrowLeft, Moon, Sun, Shield, Lock, Headset, Volume2, VolumeX, Mail, Gem, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/theme-context'
import { Toast, ToastState } from '../components/toast'
import { Footer } from '../components/footer'
import { SettingsCard } from '../components/settings-card'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'

export function Settings() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')
  const { theme, toggleTheme } = useTheme()

  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)

  // Email Notification settings
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [loadingEmail, setLoadingEmail] = useState(false)

  // Modals & User info
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  
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

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setNome(userData.nome || 'Não disponível')
          setEmail(userData.email || 'Não disponível')
          setTelefone(userData.telefone || null)
          setIsPremium(userData.isPremium || false)
        } else {
          console.error('Usuário não encontrado no Firestore')
        }
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err)
      }
    }
    fetchUserData()

    const fetchSettings = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setNome(userData.nome || null)
          setEmail(userData.email || null)
          setTelefone(userData.telefone || null)
          
          setAudioEnabled(userData.audioEnabled === true)
          setEmailEnabled(userData.emailNotifications !== false)
        }
      } catch (err) {
        console.error('Erro ao buscar configurações:', err)
      }
    }

    fetchSettings()
  }, [usuarioID, navigate])

  const handleAudioToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleEmailToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!usuarioID) return

    try {
      setLoadingEmail(true)
      const newEmailState = !emailEnabled
      
      const userDocRef = doc(db, 'usuarios', usuarioID)
      await updateDoc(userDocRef, {
        emailNotifications: newEmailState
      })

      setEmailEnabled(newEmailState)
    } catch (err) {
      console.error('Erro ao atualizar configuração de e-mail:', err)
      setToast({ show: true, message: 'Erro ao atualizar preferências de e-mail.', type: 'error' })
    } finally {
      setLoadingEmail(false)
    }
  }

  const ThemeToggle = () => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleTheme()
      }}
      className={`cursor-pointer relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
        theme === 'dark' ? 'bg-[#27AE60]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )

  const EmailToggle = () => (
    <button
      onClick={handleEmailToggle}
      disabled={loadingEmail}
      className={`cursor-pointer relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        emailEnabled ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
      } ${loadingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          emailEnabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )

  const AudioToggle = () => (
    <button
      onClick={handleAudioToggle}
      disabled={loadingAudio}
      className={`cursor-pointer relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
        audioEnabled ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
      } ${loadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          audioEnabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="cursor-pointer flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar ao Perfil</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
      </div>

      <div className="w-full max-w-2xl flex flex-col">
        {!isPremium && <SettingsCard
          title="Upgrade para Premium"
          description="Desbloqueie todos os recursos com uma assinatura vitalícia!"
          icon={Gem}
          action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => setIsPremiumModalOpen(true)}
        />}

        <SettingsCard
          title="Modo Escuro"
          description="Reduz o brilho da tela e economiza bateria"
          icon={theme === 'dark' ? Moon : Sun}
          action={<ThemeToggle />}
          onClick={toggleTheme}
        />

        <SettingsCard
          title="Privacidade do Perfil"
          description="Controle o que seus amigos podem ver no seu perfil"
          icon={Shield}
          action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => navigate('/profile/settings/privacy')}
        />

        <SettingsCard
          title="E-mails do Sistema"
          description="Receba um resumo dos seus treinos no seu e-mail aos domingos"
          icon={Mail}
          action={<EmailToggle />}
          onClick={(e: any) => handleEmailToggle(e)}
        />

        <SettingsCard
          title="Notificações Sonoras"
          description="Toca um som quando o timer de descanso termina"
          icon={audioEnabled ? Volume2 : VolumeX}
          action={<AudioToggle />}
          onClick={(e: any) => handleAudioToggle(e)}
        />

        <SettingsCard
          title="Alterar Senha"
          description="Altere sua senha de acesso à conta"
          icon={Lock}
          action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => navigate('/profile/settings/password')}
        />

        <SettingsCard
          title="Ajuda e Suporte"
          description="Encontrou um problema ou tem uma sugestão? Reporte para nós!"
          icon={Headset}
          action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => navigate('/profile/settings/support')}
        />

        {/* Future Settings Placeholder */}
        {/* <div className="bg-gray-50 dark:bg-[#2d2d2d] shadow rounded-xl p-6 mt-4 w-full border border-gray-200 dark:border-[#404040]">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Mais configurações em breve...
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            • Unidades de medida<br />
            • Notificações personalizadas<br />
            • E muito mais!
          </p>
        </div> */}
      </div>

      <Footer />
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {isPremiumModalOpen && usuarioID && (
        <PremiumUpgradeModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
          userId={usuarioID}
          userName={nome || ''}
          userEmail={email || ''}
          userPhone={telefone || ''}
        />
      )}
    </main>
  )
}
