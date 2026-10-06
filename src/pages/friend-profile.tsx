import { Activity, AtSign, Crown, Dumbbell, Lock, UserX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BadgeStrip } from '../components/badges'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { Avatar } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState, SegmentedControl, StatTile } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { resolveAvatarTone, resolveUserBadges } from '../data/badges'
import { getFriendsCount } from '../data/friends'
import { getUserWorkouts } from '../data/get-user-workouts'
import { getWorkoutExercises } from '../data/get-workout-exercises'
import { describeLog, getRecentLogs, type LogEntry } from '../data/logs'
import { findUserByIdOrUsername } from '../data/profile'
import type { UserProfile } from '../data/user-profile'
import { compareWeekDays } from '../data/week-days'
import { formatDate, formatDecimal, formatTime, isWithinLastDays } from '../utils/format'

type Tab = 'activity' | 'workouts'
type WorkoutSummary = { id: string; dia: string; musculo: string; exercises: string[] }

const PAGE = 10

export function FriendProfile() {
  const { id = '' } = useParams<{ id: string }>()
  const viewer = useCurrentUser()
  const navigate = useNavigate()
  const viewerId = localStorage.getItem('usuarioId')
  const viewerIsPremium = !!viewer?.isPremium

  const [user, setUser] = useState<UserProfile | null | undefined>(undefined)
  const [friendsCount, setFriendsCount] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('activity')
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [logsLimit, setLogsLimit] = useState(PAGE)
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  useEffect(() => {
    let active = true
    findUserByIdOrUsername(id)
      .then(found => {
        if (!active) return
        setUser(found)
        if (found) getFriendsCount(found.id).then(count => active && setFriendsCount(count)).catch(() => {})
      })
      .catch(() => active && setUser(null))
    return () => {
      active = false
    }
  }, [id])

  const privacy = user?.privacidade ?? {}
  const userId = user?.id
  const activitiesHidden = !!privacy.ocultarAtividades
  const workoutsHidden = !!privacy.ocultarTreinos

  useEffect(() => {
    if (!userId || activitiesHidden) return
    let active = true
    getRecentLogs(userId, logsLimit)
      .catch(() => [] as LogEntry[])
      .then(list => active && setLogs(list))
    return () => {
      active = false
    }
  }, [userId, activitiesHidden, logsLimit])

  useEffect(() => {
    if (!userId || tab !== 'workouts' || workouts || workoutsHidden) return
    getUserWorkouts(userId)
      .then(list => Promise.all([...list].sort((a, b) => compareWeekDays(a.dia, b.dia)).map(async workout => ({
        id: workout.id,
        dia: workout.dia,
        musculo: workout.musculo,
        exercises: (await getWorkoutExercises(workout.id, workout.exerciseOrder)).map(exercise => exercise.titulo),
      }))))
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
  }, [userId, tab, workouts, workoutsHidden])

  const badges = useMemo(() => (user ? resolveUserBadges(user) : []), [user])

  if (!viewerId) return <Navigate to="/login" replace />
  if (user && user.id === viewerId) return <Navigate to="/profile" replace />

  if (user === undefined) {
    return (
      <>
        <StackHeader title="" backTo="/friends" width="lg" />
        <LoadingState />
      </>
    )
  }

  if (user === null) {
    return (
      <>
        <StackHeader title="" backTo="/friends" width="lg" />
        <EmptyState icon={UserX} title="Usuário não encontrado" actionLabel="Voltar para Amigos" onAction={() => navigate('/friends')} className="pt-16" />
      </>
    )
  }

  // Sem Premium, o histórico de amigos fica limitado aos últimos 7 dias
  const visibleLogs = (logs ?? []).filter(log => viewerIsPremium || isWithinLastDays(log.data, 7))
  const lastOldLog = !viewerIsPremium ? (logs ?? []).find(log => !isWithinLastDays(log.data, 7)) : undefined
  const birthDate = !privacy.ocultarNascimento && user.dataNascimento
    ? new Date(`${user.dataNascimento}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : null
  const firstName = user.nome.split(' ')[0]

  return (
    <>
      <StackHeader title={user.username ? `@${user.username}` : firstName} backTo="/friends" width="lg" />
      <Page width="lg" className="pt-2">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-4">
                <Avatar name={user.nome} src={user.photoURL} size={76} ring={resolveAvatarTone(badges)} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 className="type-heading line-clamp-2">{user.nome}</h2>
                  {user.isTrainer && <p className="text-sm text-muted">{user.cref ? `Treinador · CREF ${user.cref}` : 'Treinador'}</p>}
                  <div className="mt-1">
                    <BadgeStrip badges={badges} viewAllHref={`/friend/${user.username || user.id}/badges`} onUpgrade={viewerIsPremium ? undefined : () => setPremiumOpen(true)} />
                  </div>
                </div>
              </div>
              {!!user.bio && <p className="whitespace-pre-line text-sm leading-5">{user.bio}</p>}
              {((!privacy.ocultarInstagram && user.instagram) || birthDate) && (
                <div className="flex flex-col gap-2">
                  {!privacy.ocultarInstagram && !!user.instagram && (
                    <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                      <AtSign size={16} className="text-muted" aria-hidden />
                      @{user.instagram}
                    </a>
                  )}
                  {birthDate && <p className="text-sm text-muted">Aniversário em {birthDate}</p>}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-2">
              {!privacy.ocultarStreak && <StatTile label="Sequência" value={user.currentStreak ?? 0} suffix="sem" color="var(--color-streak)" />}
              {!privacy.ocultarAmigos && (
                <StatTile label="Amigos" value={friendsCount ?? '—'} onClick={() => navigate(`/friend/${user.username || user.id}/friends`)} />
              )}
              {!privacy.ocultarPeso && !!user.peso && <StatTile label="Peso" value={formatDecimal(user.peso)} suffix="kg" />}
              {!privacy.ocultarAltura && !!user.altura && <StatTile label="Altura" value={formatDecimal(user.altura / 100, 2)} suffix="m" />}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <SegmentedControl<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'activity', label: 'Atividades', icon: Activity },
                { value: 'workouts', label: 'Treinos', icon: Dumbbell },
              ]}
            />

            {tab === 'activity' ? (
              activitiesHidden ? (
                <Card><EmptyState icon={Lock} title="Atividades privadas" description={`${firstName} prefere manter as atividades privadas.`} /></Card>
              ) : logs === null ? (
                <LoadingState />
              ) : visibleLogs.length === 0 && !lastOldLog ? (
                <Card><EmptyState icon={Activity} title="Nenhuma atividade recente" /></Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleLogs.length > 0 && (
                    <Card className="overflow-hidden">
                      {visibleLogs.map((log, index) => (
                        <div key={log.id}>
                          {index > 0 && <div className="mx-4 h-px bg-border" />}
                          <div className="flex gap-3 px-4 py-3">
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="text-base font-medium">{log.titulo}</span>
                              <span className="text-xs text-muted">{describeLog(log)}</span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 text-xs">
                              <span className="text-muted">{formatDate(log.data, { day: '2-digit', month: 'short' })}</span>
                              <span className="text-subtle">{formatTime(log.data)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Card>
                  )}
                  {lastOldLog && (
                    <Card className="flex flex-col items-center gap-3 p-4 text-center">
                      <p className="text-sm text-muted">
                        Última atividade antes desta semana em {formatDate(lastOldLog.data, { day: '2-digit', month: 'long' })}. O histórico completo dos amigos é Premium.
                      </p>
                      <Button label="Conhecer o Premium" icon={Crown} variant="secondary" size="sm" onClick={() => setPremiumOpen(true)} />
                    </Card>
                  )}
                  {viewerIsPremium && logs.length >= logsLimit && (
                    <Button label="Ver mais atividades" variant="secondary" onClick={() => setLogsLimit(value => value + PAGE)} />
                  )}
                </div>
              )
            ) : workoutsHidden ? (
              <Card><EmptyState icon={Lock} title="Treinos privados" description="Este usuário prefere manter os treinos privados." /></Card>
            ) : workouts === null ? (
              <LoadingState />
            ) : workouts.length === 0 ? (
              <Card><EmptyState icon={Dumbbell} title="Nenhum treino cadastrado" /></Card>
            ) : (
              <div className="flex flex-col gap-3">
                {workouts.map(workout => (
                  <Card key={workout.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1 truncate text-base font-semibold">{workout.musculo}</span>
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{workout.dia}</span>
                    </div>
                    {workout.exercises.length === 0 ? (
                      <span className="text-xs text-subtle">Nenhum exercício</span>
                    ) : (
                      <p className="text-sm leading-5 text-muted">{workout.exercises.join(' · ')}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Page>
      <PremiumUpgrade open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  )
}
