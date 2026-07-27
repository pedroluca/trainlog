import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { BackArrowButton } from '../components/back-arrow-button'
import { BadgeGallery } from '../components/badge-chip'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { Spinner } from '../components/spinner'
import { resolveUserBadges, type BadgeDefinition } from '../data/badges'

export function ProfileBadges() {
  const navigate = useNavigate()
  const usuarioID = localStorage.getItem('usuarioId')

  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  useEffect(() => {
    if (!usuarioID) {
      navigate('/login')
      return
    }

    const fetchUserBadges = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setIsPremium(!!userData.isPremium)
          setBadges(resolveUserBadges(userData))
          setNome(userData.nome || '')
          setEmail(userData.email || '')
          setTelefone(userData.telefone || '')
        }
      } catch (error) {
        console.error('Erro ao buscar conquistas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBadges()
  }, [usuarioID, navigate])

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <BackArrowButton title="Conquistas" route="/profile" />

      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={32} color="var(--color-primary)" />
          </div>
        ) : (
          <BadgeGallery
            badges={badges}
            userIsPremium={isPremium}
            onUpgrade={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </div>

      {isUpgradeModalOpen && (
        <PremiumUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          userEmail={email}
          userName={nome}
          userId={usuarioID || ''}
          userPhone={telefone}
        />
      )}
    </main>
  )
}
