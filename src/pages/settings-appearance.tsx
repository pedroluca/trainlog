import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, Monitor, Check, Lock } from 'lucide-react'
import { useTheme, PRIMARY_COLORS, PrimaryColorHex } from '../contexts/theme-context'
import { db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'

export function SettingsAppearance() {
  const navigate = useNavigate()
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useTheme()
  const [isPremium, setIsPremium] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [nome, setNome] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [telefone, setTelefone] = useState<string | null>(null)
  const usuarioID = localStorage.getItem('usuarioId')

  useEffect(() => {
    if (!usuarioID) return
    getDoc(doc(db, 'usuarios', usuarioID)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setIsPremium(data.isPremium === true)
        setNome(data.nome || null)
        setEmail(data.email || null)
        setTelefone(data.telefone || null)
      }
    }).catch(console.error)
  }, [usuarioID])

  const themeModes = [
    { id: 'light' as const, label: 'Claro', icon: Sun },
    { id: 'dark' as const, label: 'Escuro', icon: Moon },
    { id: 'system' as const, label: 'Sistema', icon: Monitor },
  ]

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      {/* Header */}
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl mb-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Aparência</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Personalize o visual do aplicativo.</p>
      </div>

      {/* Theme Mode */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tema</h2>
        <div className="grid grid-cols-3 gap-3">
          {themeModes.map(({ id, label, icon: Icon }) => {
            const isActive = themeMode === id
            return (
              <button
                key={id}
                onClick={() => setThemeMode(id)}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-[#404040] hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </span>
                )}
                <Icon
                  size={24}
                  className={isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}
                />
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        {themeMode === 'system' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            O tema vai acompanhar a preferência do seu sistema automaticamente.
          </p>
        )}
      </div>

      {/* Primary Color */}
      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Cor Principal</h2>
          {!isPremium && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-700">
              <Lock size={11} /> Premium
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {isPremium
            ? 'Escolha a cor de destaque do aplicativo.'
            : 'Faça upgrade para Premium e personalize a cor do app.'}
        </p>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {PRIMARY_COLORS.map((color) => {
            const isSelected = primaryColor === color.hex
            const isDisabled = !isPremium && color.hex !== PRIMARY_COLORS[0].hex

            return (
              <button
                key={color.hex}
                onClick={() => !isDisabled && setPrimaryColor(color.hex as PrimaryColorHex)}
                title={color.name}
                disabled={isDisabled}
                className={`relative w-full aspect-square rounded-full border-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-gray-800 dark:border-white scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check size={16} className="text-white drop-shadow" />
                  </span>
                )}
                {isDisabled && !isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Lock size={12} className="text-white/80" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {!isPremium && (
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="mt-5 w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold shadow hover:opacity-90 transition-opacity cursor-pointer"
          >
            ✨ Fazer Upgrade para Premium
          </button>
        )}
      </div>

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
