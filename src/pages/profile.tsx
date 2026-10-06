import { signOut } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import {
  Activity,
  AtSign,
  Award,
  BadgeCheck,
  CalendarDays,
  Camera,
  Crown,
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  ImageMinus,
  ImagePlus,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Settings,
  Share2,
  Trash2,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BadgeStrip } from '../components/badges'
import { BirthdayCelebrationBalloons, isBirthdayToday } from '../components/birthday-celebration'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { Avatar } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { IconButton } from '../components/ui/icon-button'
import { ListRow, ListSection } from '../components/ui/list'
import { EmptyState, LoadingState, Skeleton, Spinner, StatTile } from '../components/ui/misc'
import { Page, PageHeader, SectionTitle } from '../components/ui/page'
import { ActionSheet } from '../components/ui/sheet'
import { useConfirm } from '../contexts/confirm-context'
import { useCurrentUser } from '../contexts/current-user-context'
import { useToast } from '../contexts/toast-context'
import { resolveAvatarTone, resolveUserBadges } from '../data/badges'
import { calculateBmi, getBmiCategory } from '../data/body-metrics'
import type { Treino } from '../data/get-user-workouts'
import { InvalidImageError, setProfilePhoto, uploadProfilePhoto } from '../data/profile'
import { updateScheduledDays } from '../data/streak-utils'
import { deleteWorkoutWithExercises, subscribeUserWorkouts } from '../data/training'
import { compareWeekDays } from '../data/week-days'
import { exportUserWorkouts } from '../data/workout-transfer'
import { EditProfileSheet } from '../features/profile/edit-profile-sheet'
import { MeasurementSheet } from '../features/profile/measurement-sheet'
import { EditWorkoutSheet } from '../features/workout/edit-workout-sheet'
import { ShareWorkoutSheet } from '../features/workout/share-workout-sheet'
import { ReleaseNotes } from '../features/overlays/release-notes'
import { ImportSheet } from '../features/transfer/import-sheet'
import { auth, db } from '../firebaseConfig'
import { trackProfilePhotoUpdated } from '../utils/analytics'
import { getLocalDateKey } from '../utils/format'
import { getVersionWithPrefix } from '../version'

const formatDecimal = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',')

type Overlay =
  | { type: 'edit-profile' | 'measurement' | 'photo' | 'import' | 'export' | 'premium' | 'whats-new' }
  | { type: 'workout-menu' | 'share' | 'edit-workout'; workout: Treino }

export function Profile() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const photoInput = useRef<HTMLInputElement>(null)

  const [workouts, setWorkouts] = useState<Treino[] | null>(null)
  const [friendsCount, setFriendsCount] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const close = () => setOverlay(null)

  useEffect(() => {
    if (!usuarioID) return
    return subscribeUserWorkouts(
      usuarioID,
      list => setWorkouts([...list].sort((a, b) => compareWeekDays(a.dia, b.dia))),
      () => setWorkouts([]),
    )
  }, [usuarioID])

  useEffect(() => {
    if (!usuarioID) return
    getDocs(query(collection(db, 'amizades'), where('participantes', 'array-contains', usuarioID), where('status', '==', 'aceito')))
      .then(snapshot => setFriendsCount(snapshot.size))
      .catch(error => console.error('Erro ao contar amigos:', error))
  }, [usuarioID])

  const badges = useMemo(() => (profile ? resolveUserBadges(profile) : []), [profile])

  if (!usuarioID) return <Navigate to="/login" replace />
  if (!profile) return <LoadingState className="min-h-dvh" />

  const isPremium = !!profile.isPremium
  const bmi = calculateBmi(profile.peso ?? 0, profile.altura ?? 0)
  const bmiCategory = getBmiCategory(bmi)
  const hasMetrics = !!profile.altura && !!profile.peso
  const birthdayMode = profile.dataNascimento && isBirthdayToday(profile.dataNascimento)
    ? profile.lastBirthdayCelebrationDate === getLocalDateKey() ? 'compact' : 'burst'
    : 'none'

  const openPremium = () => setOverlay({ type: 'premium' })
  const premiumOr = (route: string) => () => (isPremium ? navigate(route) : openPremium())

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setUploading(true)
      const url = await uploadProfilePhoto(file, profile.id)
      await setProfilePhoto(profile.id, url)
      trackProfilePhotoUpdated()
      toast.success('Foto atualizada')
    } catch (error) {
      toast.error(error instanceof InvalidImageError ? error.message : 'Não foi possível atualizar a foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setProfilePhoto(profile.id, null).catch(() => toast.error('Não foi possível remover a foto.'))
  }

  const confirmDeleteWorkout = (workout: Treino) => {
    confirm({
      title: 'Excluir treino',
      message: `Excluir "${workout.musculo}" (${workout.dia}) e todos os exercícios dele?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => deleteWorkoutWithExercises(workout.id)
        .then(() => updateScheduledDays(profile.id))
        .catch(() => toast.error('Não foi possível excluir o treino.')),
    })
  }

  const runExport = async (format: 'json' | 'csv') => {
    try {
      const count = await exportUserWorkouts(profile.id, format)
      if (count === 0) toast.show('Você ainda não tem treinos para exportar.')
      else toast.success(`${count} ${count === 1 ? 'treino exportado' : 'treinos exportados'}`)
    } catch {
      toast.error('Não foi possível exportar os treinos.')
    }
  }

  const confirmSignOut = () => {
    confirm({
      title: 'Sair da conta',
      message: 'Você precisará entrar de novo para acessar seus treinos.',
      confirmLabel: 'Sair',
      icon: LogOut,
      onConfirm: async () => {
        await signOut(auth)
        localStorage.clear()
        navigate('/login')
      },
    })
  }

  return (
    <Page width="lg">
      <BirthdayCelebrationBalloons mode={birthdayMode} />
      <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

      <PageHeader
        title="Perfil"
        right={(
          <>
            <IconButton icon={Pencil} variant="surface" label="Editar perfil" onClick={() => setOverlay({ type: 'edit-profile' })} />
            <IconButton icon={Settings} variant="surface" label="Configurações" onClick={() => navigate('/profile/settings')} />
          </>
        )}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Identidade */}
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Alterar foto de perfil"
                title="Alterar foto de perfil"
                disabled={uploading}
                onClick={() => (profile.photoURL ? setOverlay({ type: 'photo' }) : photoInput.current?.click())}
                className="relative shrink-0 rounded-full focus-ring"
              >
                <Avatar name={profile.nome} src={profile.photoURL} size={76} ring={resolveAvatarTone(badges)} />
                <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-foreground">
                  {uploading ? <Spinner size={14} className="text-primary" /> : <Camera size={14} aria-hidden />}
                </span>
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="type-heading line-clamp-2">{profile.nome}</h2>
                {profile.username ? (
                  <p className="text-sm text-muted">@{profile.username}</p>
                ) : (
                  <button type="button" onClick={() => setOverlay({ type: 'edit-profile' })} className="self-start text-sm font-medium text-primary hover:underline">
                    Definir username
                  </button>
                )}
                <div className="mt-1">
                  <BadgeStrip badges={badges} viewAllHref="/profile/badges" onUpgrade={isPremium ? undefined : openPremium} />
                </div>
              </div>
            </div>

            {!!profile.bio && <p className="whitespace-pre-line text-sm leading-5">{profile.bio}</p>}

            <div className="flex flex-col gap-2">
              {!!profile.email && <InfoLine icon={Mail} text={profile.email} />}
              {!!profile.instagram && <InfoLine icon={AtSign} text={`@${profile.instagram}`} href={`https://instagram.com/${profile.instagram}`} />}
              {profile.isTrainer && <InfoLine icon={BadgeCheck} text={profile.cref ? `CREF ${profile.cref}` : 'Treinador (CREF não informado)'} />}
            </div>
          </Card>

          {/* Estatísticas */}
          <section className="flex flex-col gap-2">
            <SectionTitle title="Estatísticas" />
            <div className="flex gap-2">
              <StatTile label="Sequência" value={profile.currentStreak ?? 0} suffix="sem" color="var(--color-streak)" />
              <StatTile label="Recorde" value={profile.longestStreak ?? 0} suffix="sem" />
              <StatTile label="Treinos" value={profile.totalWorkouts ?? 0} />
            </div>
            <div className="flex gap-2">
              <StatTile label="Freezes" value={profile.freezeCount ?? 0} color="var(--color-info)" />
              <StatTile label="Amigos" value={friendsCount ?? '—'} onClick={() => navigate('/friends')} />
            </div>
          </section>

          {/* Medidas */}
          <section className="flex flex-col gap-2">
            <SectionTitle title="Medidas" />
            <Card className="flex flex-col gap-4 p-4">
              {hasMetrics ? (
                <div className="flex">
                  <Measure label="Altura" value={`${formatDecimal((profile.altura ?? 0) / 100, 2)} m`} />
                  <Measure label="Peso" value={`${formatDecimal(profile.peso ?? 0)} kg`} />
                  <Measure label="IMC" value={formatDecimal(bmi)} hint={bmiCategory?.label} />
                </div>
              ) : (
                <p className="text-sm leading-5 text-muted">Registre altura e peso para acompanhar seu IMC e a evolução do seu corpo.</p>
              )}
              <div className="flex gap-2">
                <Button label={hasMetrics ? 'Nova medição' : 'Adicionar medidas'} icon={Plus} variant="secondary" size="sm" className="flex-1" onClick={() => setOverlay({ type: 'measurement' })} />
                {hasMetrics && (
                  <Button label="Histórico" icon={isPremium ? Activity : Crown} variant="secondary" size="sm" className="flex-1" onClick={premiumOr('/profile/body-metrics')} />
                )}
              </div>
            </Card>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <ListSection title="Atalhos">
            <ListRow title="Progresso" description="Evolução da carga em cada exercício" icon={TrendingUp} to="/progress" />
            <ListRow title="Calendário de streak" icon={CalendarDays} iconColor="var(--color-streak)" onClick={premiumOr('/profile/streak-calendar')} value={isPremium ? undefined : 'Premium'} />
            <ListRow title="Histórico de atividades" icon={History} to="/profile/log" />
            <ListRow title="Conquistas" icon={Award} iconColor="var(--color-premium)" to="/profile/badges" />
            {!isPremium && <ListRow title="Seja Premium" description="Calendário, cores, métricas e mais" icon={Crown} iconColor="var(--color-premium)" onClick={openPremium} />}
          </ListSection>

          {/* Treinos */}
          <section className="flex flex-col gap-2">
            <SectionTitle
              title={`Meus treinos${workouts?.length ? ` · ${workouts.length}` : ''}`}
              action={(
                <div className="-my-2 flex gap-1">
                  <IconButton icon={Download} size={36} iconSize={18} label="Importar treinos" onClick={() => setOverlay({ type: 'import' })} />
                  <IconButton icon={Upload} size={36} iconSize={18} label="Exportar treinos" onClick={() => setOverlay({ type: 'export' })} />
                </div>
              )}
            />
            {workouts === null ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : workouts.length === 0 ? (
              <Card>
                <EmptyState
                  icon={CalendarDays}
                  title="Nenhum treino cadastrado"
                  description="Crie seu primeiro treino na aba Treino ou importe de uma planilha."
                  actionLabel="Importar treinos"
                  onAction={() => setOverlay({ type: 'import' })}
                />
              </Card>
            ) : (
              <Card className="overflow-hidden">
                {workouts.map((workout, index) => (
                  <div key={workout.id}>
                    {index > 0 && <div className="mx-4 h-px bg-border" />}
                    <div className="group flex items-center transition-colors hover:bg-surface-2">
                      <button
                        type="button"
                        onClick={() => setOverlay({ type: 'workout-menu', workout })}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left focus-ring"
                      >
                        <span className="w-12 shrink-0 text-xs text-muted">{workout.dia.slice(0, 3)}</span>
                        <span className="flex-1 truncate text-base font-medium">{workout.musculo}</span>
                        <Share2 size={16} className="shrink-0 text-subtle lg:hidden" aria-hidden />
                      </button>
                      {/* No desktop as ações ficam à vista */}
                      <div className="hidden gap-0.5 pr-2 lg:flex">
                        <IconButton icon={Share2} size={34} iconSize={16} label="Compartilhar" onClick={() => setOverlay({ type: 'share', workout })} />
                        <IconButton icon={Pencil} size={34} iconSize={16} label="Editar treino" onClick={() => setOverlay({ type: 'edit-workout', workout })} />
                        <IconButton icon={Trash2} size={34} iconSize={16} label="Excluir treino" className="text-danger" onClick={() => confirmDeleteWorkout(workout)} />
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </section>

          <Button label="Sair da conta" icon={LogOut} variant="danger-soft" onClick={confirmSignOut} />
        </div>
      </div>

      <footer className="flex flex-col items-center gap-1 pb-2 text-xs text-subtle">
        <button type="button" onClick={() => setOverlay({ type: 'whats-new' })} className="hover:text-primary">
          Tractus {getVersionWithPrefix()}
        </button>
        <span>
          Desenvolvido por{' '}
          <a href="https://pedroluca.dev.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Pedro Luca Prates</a>
        </span>
      </footer>

      {/* ─── Overlays ─────────────────────────────────────────────────────── */}
      <ActionSheet
        open={overlay?.type === 'photo'}
        onClose={close}
        title="Foto de perfil"
        actions={[
          { label: 'Escolher outra foto', icon: ImagePlus, immediate: true, onSelect: () => photoInput.current?.click() },
          { label: 'Remover foto', icon: ImageMinus, destructive: true, onSelect: removePhoto },
        ]}
      />
      <ActionSheet
        open={overlay?.type === 'workout-menu'}
        onClose={close}
        title={overlay?.type === 'workout-menu' ? `${overlay.workout.musculo} · ${overlay.workout.dia}` : undefined}
        actions={overlay?.type === 'workout-menu' ? [
          { label: 'Compartilhar', icon: Share2, onSelect: () => setOverlay({ type: 'share', workout: overlay.workout }) },
          { label: 'Editar treino', icon: Pencil, onSelect: () => setOverlay({ type: 'edit-workout', workout: overlay.workout }) },
          { label: 'Excluir treino', icon: Trash2, destructive: true, onSelect: () => confirmDeleteWorkout(overlay.workout) },
        ] : []}
      />

      {overlay?.type === 'edit-profile' && <EditProfileSheet profile={profile} onClose={close} />}
      {overlay?.type === 'measurement' && <MeasurementSheet profile={profile} onClose={close} />}
      {overlay?.type === 'share' && <ShareWorkoutSheet workout={overlay.workout} onClose={close} />}
      {overlay?.type === 'edit-workout' && <EditWorkoutSheet workoutId={overlay.workout.id} viewerId={profile.id} onClose={close} />}
      {overlay?.type === 'import' && (
        <ImportSheet
          usuarioID={profile.id}
          existingWorkouts={workouts ?? []}
          onClose={close}
          onImported={count => {
            close()
            toast.success(`${count} ${count === 1 ? 'treino importado' : 'treinos importados'}`)
            updateScheduledDays(profile.id)
          }}
        />
      )}
      <ActionSheet
        open={overlay?.type === 'export'}
        onClose={close}
        title="Exportar treinos"
        actions={[
          { label: 'JSON (backup completo)', icon: FileJson, onSelect: () => runExport('json') },
          { label: 'Planilha (CSV)', icon: FileSpreadsheet, onSelect: () => runExport('csv') },
        ]}
      />
      <PremiumUpgrade open={overlay?.type === 'premium'} onClose={close} />
      <ReleaseNotes isOpen={overlay?.type === 'whats-new'} onClose={close} />
    </Page>
  )
}

function InfoLine({ icon: Icon, text, href }: { icon: typeof Mail; text: string; href?: string }) {
  const content = (
    <>
      <Icon size={16} className="shrink-0 text-muted" aria-hidden />
      <span className={href ? 'truncate text-sm text-primary' : 'truncate text-sm text-muted'}>{text}</span>
    </>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:underline">
        {content}
      </a>
    )
  }
  return <div className="flex items-center gap-2.5">{content}</div>
}

function Measure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </div>
  )
}
