import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { BackArrowButton } from '../components/back-arrow-button'
import { BadgeGallery } from '../components/badge-chip'
import { PremiumUpgradeModal } from '../components/premium-upgrade-modal'
import { Spinner } from '../components/spinner'
import { resolveUserBadges, type BadgeDefinition } from '../data/badges'

export function FriendBadges() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('usuarioId')

  const [loading, setLoading] = useState(true)
  const [friendName, setFriendName] = useState('')
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        const meDoc = await getDoc(doc(db, 'usuarios', currentUserId))
        if (meDoc.exists()) {
          const meData = meDoc.data()
          setIsPremium(meData.isPremium === true)
          setNome(meData.nome || '')
          setEmail(meData.email || '')
          setTelefone(meData.telefone || '')
        }

        if (!id) return

        let userSnap = await getDoc(doc(db, 'usuarios', id))
        if (!userSnap.exists()) {
          const qUser = query(collection(db, 'usuarios'), where('username', '==', id), limit(1))
          const qsUser = await getDocs(qUser)
          if (!qsUser.empty) {
            userSnap = qsUser.docs[0]
          }
        }

        if (userSnap.exists()) {
          const userData = userSnap.data()
          setFriendName(userData.nome || '')
          setBadges(resolveUserBadges(userData))
        }
      } catch (error) {
        console.error('Erro ao buscar conquistas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, currentUserId, navigate])

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-11rem)] bg-gray-100 dark:bg-[#121212] p-4 pb-24">
      <BackArrowButton title={friendName ? `Conquistas de ${friendName}` : 'Conquistas'} route={`/friend/${id}`} />

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
          userId={currentUserId || ''}
          userPhone={telefone}
        />
      )}
    </main>
  )
}
