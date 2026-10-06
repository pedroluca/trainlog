import { Lock, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { EmptyState, LoadingState } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { UserRow } from '../components/user-row'
import { getFriends, type Friend } from '../data/friends'
import { findUserByIdOrUsername } from '../data/profile'

type State = { name: string; friends: Friend[]; hidden: boolean }

export function FriendFriends() {
  const { id = '' } = useParams<{ id: string }>()
  const viewerId = localStorage.getItem('usuarioId')
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    let active = true
    findUserByIdOrUsername(id)
      .then(async user => {
        if (!user || user.privacidade?.ocultarAmigos) {
          if (active) setState({ name: user?.nome ?? '', friends: [], hidden: true })
          return
        }
        const friends = await getFriends(user.id)
        if (active) setState({ name: user.nome, friends, hidden: false })
      })
      .catch(() => active && setState({ name: '', friends: [], hidden: false }))
    return () => {
      active = false
    }
  }, [id])

  return (
    <>
      <StackHeader title={state?.name ? `Amigos de ${state.name.split(' ')[0]}` : 'Amigos'} backTo={`/friend/${id}`} />
      {!state ? (
        <LoadingState />
      ) : (
        <Page className="pt-2">
          {state.hidden ? (
            <Card><EmptyState icon={Lock} title="Lista de amigos privada" /></Card>
          ) : state.friends.length === 0 ? (
            <Card><EmptyState icon={UsersRound} title="Nenhum amigo adicionado ainda" /></Card>
          ) : (
            <Card className="overflow-hidden">
              {state.friends.map((friend, index) => (
                <div key={friend.friendshipId}>
                  {index > 0 && <div className="ml-[72px] h-px bg-border" />}
                  <UserRow user={friend.user} to={friend.user.id === viewerId ? '/profile' : `/friend/${friend.user.username || friend.user.id}`} />
                </div>
              ))}
            </Card>
          )}
        </Page>
      )}
    </>
  )
}
