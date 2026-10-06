import { Check, Clock, Inbox, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { EmptyState, Spinner } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { UserRow } from '../../components/user-row'
import { useToast } from '../../contexts/toast-context'
import { getFriendshipStatus, getMyFriendships, searchUsers, sendFriendRequest, type Friendship } from '../../data/friends'
import type { UserProfile } from '../../data/user-profile'

type Props = {
  me: UserProfile
  onClose: () => void
  onOpenRequests: () => void
}

export function AddFriendSheet({ me, onClose, onOpenRequests }: Props) {
  const toast = useToast()
  const [term, setTerm] = useState('')
  const [search, setSearch] = useState<{ term: string; results: UserProfile[] }>({ term: '', results: [] })
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  useEffect(() => {
    getMyFriendships(me.id).then(setFriendships).catch(() => {})
  }, [me.id])

  const query = term.trim()
  const tooShort = query.length < 2
  const searching = !tooShort && search.term !== query
  const results = tooShort ? [] : search.results

  // Busca enquanto digita, com um pequeno atraso para não consultar a cada letra
  useEffect(() => {
    if (tooShort) return
    let active = true
    const timer = setTimeout(() => {
      searchUsers(query, me.id)
        .catch(() => {
          toast.error('Erro ao buscar usuários.')
          return [] as UserProfile[]
        })
        .then(found => {
          if (active) setSearch({ term: query, results: found })
        })
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, tooShort, me.id, toast])

  const send = async (user: UserProfile) => {
    setSendingTo(user.id)
    try {
      const friendship = await sendFriendRequest(me, user.id)
      setFriendships(current => [...current, friendship])
      toast.success(`Solicitação enviada para ${user.nome.split(' ')[0]}`)
    } catch {
      toast.error('Não foi possível enviar a solicitação.')
    } finally {
      setSendingTo(null)
    }
  }

  const statusAccessory = (user: UserProfile) => {
    const status = getFriendshipStatus(friendships, me.id, user.id)
    if (status === 'aceito') return <StatusTag icon={Check} label="Amigos" className="text-primary" />
    if (status === 'enviado') return <StatusTag icon={Clock} label="Pendente" className="text-muted" />
    if (status === 'recebido') return <Button label="Responder" icon={Inbox} size="sm" variant="secondary" onClick={onOpenRequests} />
    return <Button label="Adicionar" icon={UserPlus} size="sm" loading={sendingTo === user.id} onClick={() => send(user)} />
  }

  return (
    <Sheet open onClose={onClose} title="Adicionar amigo" contentClassName="px-0">
      <div className="px-5 pb-3">
        <label className="flex h-12 items-center gap-2 rounded-xl border border-transparent bg-surface-2 px-3.5 focus-within:border-primary">
          <Search size={18} className="shrink-0 text-subtle" aria-hidden />
          <input
            value={term}
            onChange={event => setTerm(event.target.value)}
            placeholder="Nome ou @username"
            aria-label="Buscar usuários"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
          />
          {searching && <Spinner size={18} className="text-primary" />}
        </label>
      </div>

      <div className="min-h-64">
        {tooShort ? (
          <EmptyState icon={Search} title="Encontre seus amigos" description="Digite pelo menos 2 letras do nome ou do username." />
        ) : results.length === 0 ? (
          !searching && <p className="py-10 text-center text-muted">Ninguém encontrado com “{term}”.</p>
        ) : (
          results.map((user, index) => (
            <div key={user.id}>
              {index > 0 && <div className="ml-[72px] h-px bg-border" />}
              <UserRow user={user} to={`/friend/${user.id}`} right={statusAccessory(user)} />
            </div>
          ))
        )}
      </div>
    </Sheet>
  )
}

function StatusTag({ icon: Icon, label, className }: { icon: typeof Check; label: string; className: string }) {
  return (
    <span className={`inline-flex h-8 items-center gap-1 rounded-full bg-surface-2 px-2.5 text-sm font-medium ${className}`}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  )
}
