import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Palette, Shield, Lock, Headset, Volume2, VolumeX, Mail, ChevronRight, Crown, Box, ShieldUser, UserRound, ExternalLink } from 'lucide-react'
import { Toast, ToastState } from '../components/toast'
import { Footer } from '../components/footer'
import { SettingsCard } from '../components/settings-card'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { BackArrowButton } from '../components/back-arrow-button'
import { getVersion } from '../version'

export function Settings() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')

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
  const [loadingUser, setLoadingUser] = useState(true)
  
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

    const fetchUserDataAndSettings = async () => {
      setLoadingUser(true)
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setNome(userData.nome || 'Não disponível')
          setEmail(userData.email || 'Não disponível')
          setTelefone(userData.telefone || null)
          setIsPremium(userData.isPremium === true)
          
          setAudioEnabled(userData.audioEnabled === true)
          setEmailEnabled(userData.emailNotifications !== false)
        } else {
          console.error('Usuário não encontrado no Firestore')
        }
      } catch (err) {
        console.error('Erro ao buscar dados e configurações do usuário:', err)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUserDataAndSettings()
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

  const SettingsCardSkeleton = () => (
    <div className="flex gap-3 items-center bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-4 w-full mb-4 border border-gray-200 dark:border-[#404040]">
      <div className="flex-shrink-0 w-10 flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
      </div>
      <div className="flex-shrink-0 flex items-center justify-end">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
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
      <BackArrowButton title="Configurações" route="/profile" />

      <div className="w-full max-w-2xl flex flex-col">
        {loadingUser ? (
          <SettingsCardSkeleton />
        ) : (
          <>
            {!isPremium && <SettingsCard
              title="Upgrade para Premium"
              description="Desbloqueie todos os recursos com uma assinatura vitalícia!"
              icon={Crown}
              action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
              onClick={() => setIsPremiumModalOpen(true)}
            />}
          </>
        )}

        <SettingsCard
          title="Aparência"
          description="Altere entre tema claro ou escuro, ou mude a cor principal"
          icon={Palette}
          action={<ChevronRight className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => navigate('/profile/settings/appearance')}
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
          title="Alertas Sonoros"
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

        <h2 className='w-full max-w-2xl text-left text-xl text-gray-800 dark:text-gray-100 mb-2'>
          Sobre
        </h2>

        <SettingsCard
          title="Versão do app"
          description={getVersion()}
          icon={Box}
        />

        <SettingsCard
          title="Política de Privacidade"
          description="Leia nossa política de privacidade"
          icon={ShieldUser}
          action={<ExternalLink className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => window.open('/privacy', '_blank')}
        />

        <SettingsCard
          title="Desenvolvedor"
          description="Pedro Luca Prates"
          icon={UserRound}
          action={<ExternalLink className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />}
          onClick={() => window.open('https://pedroluca.dev.br', '_blank')}
        />
      </div>

      <Footer showInformation={false} />
      
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
