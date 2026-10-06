import { Check, Inbox, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IconButton } from '../../components/ui/icon-button'
import { EmptyState, LoadingState } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { UserRow } from '../../components/user-row'
import { useToast } from '../../contexts/toast-context'
import { acceptFriendRequest, getPendingRequests, removeFriendship, type FriendRequest } from '../../data/friends'

type Props = {
  userId: string
  onClose: () => void
  /** Avisa a lista de amigos para recarregar depois de aceitar */
  onChanged: () => void
}

export function FriendRequestsSheet({ userId, onClose, onChanged }: Props) {
  const toast = useToast()
  const [requests, setRequests] = useState<FriendRequest[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    getPendingRequests(userId).then(setRequests).catch(() => setRequests([]))
  }, [userId])

  const respond = async (request: FriendRequest, accept: boolean) => {
    setBusyId(request.id)
    try {
      if (accept) await acceptFriendRequest(request.id)
      else await removeFriendship(request.id)
      if (accept) {
        toast.success(`Você e ${request.requester.nome.split(' ')[0]} agora são amigos`)
        onChanged()
      }
      setRequests(current => current?.filter(item => item.id !== request.id) ?? null)
    } catch {
      toast.error('Não foi possível responder a solicitação.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet open onClose={onClose} title="Solicitações" contentClassName="px-0">
      {!requests ? (
        <LoadingState />
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} title="Nenhuma solicitação pendente" description="Quando alguém te adicionar, a solicitação aparece aqui." />
      ) : (
        requests.map((request, index) => (
          <div key={request.id}>
            {index > 0 && <div className="ml-[72px] h-px bg-border" />}
            <UserRow
              user={request.requester}
              to={`/friend/${request.requester.id}`}
              right={(
                <>
                  <IconButton icon={X} variant="surface" label="Recusar" disabled={busyId === request.id} onClick={() => respond(request, false)} />
                  <IconButton icon={Check} variant="primary" label="Aceitar" disabled={busyId === request.id} onClick={() => respond(request, true)} />
                </>
              )}
            />
          </div>
        ))
      )}
    </Sheet>
  )
}
