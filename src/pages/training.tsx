import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BirthdayCelebrationModal,
  getBirthdayCelebrationStorageKey,
  isBirthdayToday,
} from '../components/birthday-celebration'
import { StreakPill } from '../components/streak-pill'
import { LoadingState } from '../components/ui/misc'
import { PageHeader, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { TrainingView } from '../features/training/training-view'
import { db } from '../firebaseConfig'
import { trackPageView } from '../utils/analytics'
import { getLocalDateKey, greeting } from '../utils/format'

// Altura útil no celular: a tela inteira menos as áreas seguras e o espaço da cápsula de navegação.
// O carrossel de exercícios ocupa o que sobra, com as ações do card ao alcance do polegar.
const MOBILE_HEIGHT = 'h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_104px)] lg:h-auto'

export function Training() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const studentId = searchParams.get('studentId')
  const managing = !!usuarioID && !!studentId && studentId !== usuarioID
  const ownerId = managing ? studentId : usuarioID
  const [studentName, setStudentName] = useState(searchParams.get('studentName') || '')
  const [accessChecked, setAccessChecked] = useState(!managing)

  useEffect(() => {
    trackPageView('training')
  }, [])

  // Treinador gerenciando aluno: confirma o vínculo antes de mostrar os treinos
  useEffect(() => {
    if (!managing || !usuarioID || !studentId) return
    let active = true
    const verify = async () => {
      try {
        const relation = await getDocs(query(
          collection(db, 'trainer_relations'),
          where('participants', 'array-contains', usuarioID),
          where('trainerId', '==', usuarioID),
          where('studentId', '==', studentId),
          where('status', '==', 'accepted'),
        ))
        if (!active) return
        if (relation.empty) {
          navigate('/profile/connections', { replace: true })
          return
        }
        const student = await getDoc(doc(db, 'usuarios', studentId))
        if (active && student.exists()) setStudentName(student.data().nome || '')
        if (active) setAccessChecked(true)
      } catch (error) {
        console.error('Erro ao verificar o vínculo com o aluno:', error)
        if (active) navigate('/profile/connections', { replace: true })
      }
    }
    verify()
    return () => {
      active = false
    }
  }, [managing, usuarioID, studentId, navigate])

  // Comemoração de aniversário (uma vez por dia)
  const [birthdayName, setBirthdayName] = useState<string | null>(null)
  useEffect(() => {
    if (!usuarioID || managing) return
    const check = async () => {
      try {
        const userRef = doc(db, 'usuarios', usuarioID)
        const snapshot = await getDoc(userRef)
        if (!snapshot.exists()) return
        const data = snapshot.data()
        const birthDate = typeof data.dataNascimento === 'string' ? data.dataNascimento : ''
        if (!birthDate || !isBirthdayToday(birthDate)) return

        const todayKey = getLocalDateKey()
        const storageKey = getBirthdayCelebrationStorageKey(usuarioID, todayKey)
        if (localStorage.getItem(storageKey) === 'seen' || data.lastBirthdayCelebrationDate === todayKey) return

        setBirthdayName(data.nome || 'você')
        localStorage.setItem(storageKey, 'seen')
        await updateDoc(userRef, { lastBirthdayCelebrationDate: todayKey })
      } catch (error) {
        console.error('Erro ao verificar aniversário:', error)
      }
    }
    check()
  }, [usuarioID, managing])

  if (!usuarioID || !ownerId) return <Navigate to="/login" replace />

  const firstName = profile?.nome?.split(' ')[0]
  const studentFirstName = studentName.split(' ')[0]

  return (
    <div className={`flex flex-col ${MOBILE_HEIGHT}`}>
      {managing && (
        <StackHeader title={studentFirstName ? `Treinos de ${studentFirstName}` : 'Treinos do aluno'} backTo="/profile/connections" width="xl" />
      )}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 lg:px-8">
        {!managing && (
          <PageHeader
            title="Treino"
            subtitle={firstName ? `${greeting()}, ${firstName}` : undefined}
            right={<StreakPill />}
            className="px-4 lg:px-0"
          />
        )}

        {accessChecked ? (
          <TrainingView
            viewerId={usuarioID}
            ownerId={ownerId}
            audioEnabled={profile?.audioEnabled === true}
            fallbackStreak={{
              currentStreak: profile?.currentStreak ?? 0,
              totalWorkouts: profile?.totalWorkouts ?? 0,
              streakIncremented: false,
            }}
          />
        ) : (
          <LoadingState />
        )}
      </div>

      <BirthdayCelebrationModal isOpen={!!birthdayName} onClose={() => setBirthdayName(null)} name={birthdayName ?? 'você'} />
    </div>
  )
}
