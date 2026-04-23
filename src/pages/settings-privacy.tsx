import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Toast, ToastState } from '../components/toast'
import { BackArrowButton } from '../components/back-arrow-button'

export function SettingsPrivacy() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')

  const [privacidade, setPrivacidade] = useState<{
    ocultarEmail?: boolean
    ocultarNascimento?: boolean
    ocultarAtividades?: boolean
    ocultarTreinos?: boolean
    ocultarAmigos?: boolean
    ocultarStreak?: boolean
    ocultarPeso?: boolean
    ocultarAltura?: boolean
    ocultarInstagram?: boolean
  }>({
    ocultarEmail: true
  })
  const [loadingPrivacy, setLoadingPrivacy] = useState(false)
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

    const fetchPrivacy = async () => {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioID)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.privacidade) {
            setPrivacidade({
              ocultarEmail: userData.privacidade.ocultarEmail ?? true,
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
        console.error('Erro ao buscar privacidade:', err)
      }
    }

    fetchPrivacy()
  }, [usuarioID, navigate])

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

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <BackArrowButton title="Privacidade" route="/profile/settings" />

      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <div className="space-y-6">
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
                className={`cursor-pointer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  privacidade[item.key as keyof typeof privacidade] ? 'bg-[#27AE60]' : 'bg-gray-300 dark:bg-gray-600'
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
