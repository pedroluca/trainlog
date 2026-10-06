import { Flame, Inbox, Search, UserPlus, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { IconButton } from '../components/ui/icon-button'
import { EmptyState, LoadingState } from '../components/ui/misc'
import { Page, PageHeader } from '../components/ui/page'
import { UserRow } from '../components/user-row'
import { useCurrentUser } from '../contexts/current-user-context'
import { getFriends, type Friend } from '../data/friends'
import { getWeekKey } from '../data/streak-utils'
import { AddFriendSheet } from '../features/friends/add-friend-sheet'
import { FriendRequestsSheet } from '../features/friends/friend-requests-sheet'
import { usePendingFriendsCount } from '../hooks/usePendingFriendsCount'
import { cn } from '../utils/cn'

export function Friends() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const pending = usePendingFriendsCount()
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [search, setSearch] = useState('')
  const [sheet, setSheet] = useState<'add' | 'requests' | null>(null)

  const load = useCallback(async () => {
    if (!usuarioID) return
    try {
      setFriends(await getFriends(usuarioID))
    } catch {
      setFriends(current => current ?? [])
    }
  }, [usuarioID])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!friends || !term) return friends ?? []
    return friends.filter(({ user }) => user.nome.toLowerCase().includes(term) || user.username?.toLowerCase().includes(term))
  }, [friends, search])

  if (!usuarioID) return <Navigate to="/login" replace />

  const currentWeek = getWeekKey()

  return (
    <Page>
      <PageHeader
        title="Amigos"
        right={(
          <>
            <IconButton icon={Inbox} variant="surface" label="Solicitações de amizade" badge={pending} onClick={() => setSheet('requests')} />
            <IconButton icon={UserPlus} variant="primary" label="Adicionar amigo" onClick={() => setSheet('add')} disabled={!profile} />
          </>
        )}
      />

      {friends === null ? (
        <LoadingState />
      ) : friends.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="Você ainda não adicionou amigos"
            description="Encontre pessoas pelo nome ou username e acompanhe a sequência de treinos delas."
            actionLabel="Adicionar amigo"
            onAction={() => setSheet('add')}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-transparent bg-surface-2 px-3.5 focus-within:border-primary">
            <Search size={18} className="shrink-0 text-subtle" aria-hidden />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar entre seus amigos"
              aria-label="Buscar entre seus amigos"
              type="search"
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
            />
          </label>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-muted">Nenhum amigo encontrado com “{search}”.</p>
          ) : (
            <Card className="overflow-hidden">
              {filtered.map((item, index) => {
                const streak = item.user.currentStreak ?? 0
                const active = item.user.lastStreakWeek === currentWeek
                const hidesStreak = item.user.privacidade?.ocultarStreak
                return (
                  <div key={item.friendshipId}>
                    {index > 0 && <div className="ml-[72px] h-px bg-border" />}
                    <UserRow
                      user={item.user}
                      to={`/friend/${item.user.username || item.user.id}`}
                      right={hidesStreak ? undefined : (
                        <span
                          title={active ? 'Treinou esta semana' : 'Ainda não treinou esta semana'}
                          className={cn('inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-semibold', active ? 'bg-streak/15 text-streak' : 'bg-surface-2 text-muted')}
                        >
                          <Flame size={14} fill={active ? 'currentColor' : 'transparent'} aria-hidden />
                          {streak}
                        </span>
                      )}
                    />
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      )}

      {sheet === 'add' && profile && (
        <AddFriendSheet me={profile} onClose={() => setSheet(null)} onOpenRequests={() => setSheet('requests')} />
      )}
      {sheet === 'requests' && (
        <FriendRequestsSheet userId={usuarioID} onClose={() => setSheet(null)} onChanged={load} />
      )}
    </Page>
  )
}
