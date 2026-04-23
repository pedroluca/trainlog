import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { Button } from '../components/button'
import { Eye, EyeOff } from 'lucide-react'
import { BackArrowButton } from '../components/back-arrow-button'

export function SettingsPassword() {
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

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

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setPasswordSuccess('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setPasswordSuccess('')
        navigate(-1)
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
    <main className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <BackArrowButton title="Alterar Senha" route="/profile/settings" />

      <div className="bg-white dark:bg-[#2d2d2d] shadow-lg rounded-xl p-6 w-full max-w-2xl mb-4 border border-gray-200 dark:border-[#404040]">
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
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
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
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua nova senha (mín. 6 caracteres)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
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
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite novamente sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
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

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[#333]">
            <Button
              type="submit"
              className="w-full bg-[#27AE60] hover:bg-[#219150] text-white py-3"
              disabled={loadingPassword}
            >
              {loadingPassword ? 'Alterando...' : 'Confirmar Alteração'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
