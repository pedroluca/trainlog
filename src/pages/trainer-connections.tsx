import { Check, ChevronRight, ClipboardList, Search, Send, UserMinus, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { IconButton } from '../components/ui/icon-button'
import { Callout, EmptyState, LoadingState } from '../components/ui/misc'
import { Page, PageHeader, SectionTitle } from '../components/ui/page'
import { TextField } from '../components/ui/text-field'
import { UserRow } from '../components/user-row'
import { useConfirm } from '../contexts/confirm-context'
import { useCurrentUser } from '../contexts/current-user-context'
import { useToast } from '../contexts/toast-context'
import {
  acceptCoachingRequest,
  CoachingRequestError,
  findUserForCoaching,
  getCoachingData,
  removeCoachingRelation,
  sendCoachingRequest,
  type CoachingData,
} from '../data/trainer'
import type { UserProfile } from '../data/user-profile'

const EMPTY: CoachingData = { relations: [], pendingReceived: [], outgoingPending: [], students: [], trainers: [] }

export function TrainerConnections() {
  const usuarioID = localStorage.getItem('usuarioId')
  const profile = useCurrentUser()
  const toast = useToast()
  const confirm = useConfirm()
  const isTrainer = !!profile?.isTrainer

  const [data, setData] = useState<CoachingData | null>(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<UserProfile | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!usuarioID) return
    try {
      setData(await getCoachingData(usuarioID))
    } catch {
      toast.error('Não foi possível carregar seus vínculos.')
      setData(current => current ?? EMPTY)
    }
  }, [usuarioID, toast])

  useEffect(() => {
    load()
  }, [load])

  if (!usuarioID) return <Navigate to="/login" replace />

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    const term = search.trim()
    if (!term) return
    setSearching(true)
    setResult(null)
    try {
      const found = await findUserForCoaching(term)
      if (!found) toast.show('Nenhum usuário com esse username ou email exato.')
      else if (found.id === usuarioID) toast.error('Você não pode criar um vínculo com você mesmo.')
      else setResult(found)
    } catch {
      toast.error('Erro ao buscar usuário.')
    } finally {
      setSearching(false)
    }
  }

  const handleSend = async () => {
    if (!result || !data || !profile) return
    setActionId('send')
    try {
      await sendCoachingRequest(profile, result, data.relations)
      toast.success('Solicitação enviada!')
      setResult(null)
      setSearch('')
      await load()
    } catch (error) {
      toast.error(error instanceof CoachingRequestError ? error.message : 'Erro ao enviar a solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const respond = async (relationId: string, accept: boolean) => {
    setActionId(relationId)
    try {
      if (accept) await acceptCoachingRequest(relationId)
      else await removeCoachingRelation(relationId)
      toast.success(accept ? 'Vínculo aceito!' : 'Solicitação recusada.')
      await load()
    } catch {
      toast.error('Não foi possível responder a solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const confirmUnlink = (user: UserProfile, relationId: string) => {
    confirm({
      title: 'Desfazer vínculo',
      message: `Remover o vínculo com ${user.nome}? Os treinos já criados continuam com o aluno.`,
      confirmLabel: 'Remover',
      icon: UserMinus,
      onConfirm: () => respond(relationId, false),
    })
  }

  const relationIdWith = (otherId: string) =>
    data?.relations.find(relation => relation.status === 'accepted' && (relation.trainerId === otherId || relation.studentId === otherId))?.id

  return (
    <Page width="lg">
      <PageHeader title={isTrainer ? 'Alunos' : 'Treinador'} subtitle={isTrainer ? 'Perfil de treinador' : 'Perfil de aluno'} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">{isTrainer ? 'Convidar aluno' : 'Encontrar treinador'}</h2>
              <p className="text-sm leading-5 text-muted">
                {isTrainer
                  ? 'Busque pelo username ou email exato do aluno. Depois que ele aceitar, você poderá montar os treinos dele.'
                  : 'Busque pelo username ou email exato do seu personal. Ele poderá montar treinos para você.'}
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex items-end gap-2">
              <TextField
                containerClassName="flex-1"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="@username ou email"
                aria-label="Username ou email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <IconButton type="submit" icon={Search} variant="primary" size={48} label="Buscar" disabled={searching} />
            </form>
            {result && (
              <div className="overflow-hidden rounded-2xl bg-surface-2">
                <UserRow user={result} right={<Button label="Enviar" icon={Send} size="sm" loading={actionId === 'send'} onClick={handleSend} />} />
              </div>
            )}
          </Card>

          {data && data.pendingReceived.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionTitle title="Solicitações recebidas" />
              <Card className="overflow-hidden">
                {data.pendingReceived.map(({ relation, requester }, index) => (
                  <div key={relation.id}>
                    {index > 0 && <div className="ml-[72px] h-px bg-border" />}
                    <UserRow
                      user={requester}
                      subtitle={relation.requestedByRole === 'trainer' ? 'Quer ser seu treinador' : 'Quer ser seu aluno'}
                      right={(
                        <>
                          <IconButton icon={X} variant="surface" label="Recusar" disabled={actionId === relation.id} onClick={() => respond(relation.id, false)} />
                          <IconButton icon={Check} variant="primary" label="Aceitar" disabled={actionId === relation.id} onClick={() => respond(relation.id, true)} />
                        </>
                      )}
                    />
                  </div>
                ))}
              </Card>
            </section>
          )}

          {data && data.outgoingPending.length > 0 && (
            <Callout tone="info" title="Aguardando resposta">
              {`${data.outgoingPending.length} ${data.outgoingPending.length === 1 ? 'solicitação enviada ainda não foi respondida' : 'solicitações enviadas ainda não foram respondidas'}.`}
            </Callout>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {data === null ? (
            <LoadingState />
          ) : (
            <>
              {isTrainer && (
                <section className="flex flex-col gap-2">
                  <SectionTitle title="Meus alunos" />
                  {data.students.length === 0 ? (
                    <Card>
                      <EmptyState icon={ClipboardList} title="Nenhum aluno vinculado" description="Convide seus alunos pela busca." />
                    </Card>
                  ) : (
                    <Card className="overflow-hidden">
                      {data.students.map((student, index) => (
                        <div key={student.id}>
                          {index > 0 && <div className="ml-[72px] h-px bg-border" />}
                          <UserRow
                            user={student}
                            subtitle="Montar os treinos"
                            to={`/train?studentId=${student.id}&studentName=${encodeURIComponent(student.nome)}`}
                            right={<ChevronRight size={18} className="text-subtle" aria-hidden />}
                          />
                        </div>
                      ))}
                    </Card>
                  )}
                </section>
              )}

              <section className="flex flex-col gap-2">
                <SectionTitle title="Meus treinadores" />
                {data.trainers.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={ClipboardList}
                      title="Nenhum treinador vinculado"
                      description="Quando um treinador montar um treino para você, ele aparece na aba Treino."
                    />
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    {data.trainers.map((trainer, index) => {
                      const relationId = relationIdWith(trainer.id)
                      return (
                        <div key={trainer.id}>
                          {index > 0 && <div className="ml-[72px] h-px bg-border" />}
                          <UserRow
                            user={trainer}
                            subtitle={trainer.cref ? `CREF ${trainer.cref}` : undefined}
                            to={`/friend/${trainer.username || trainer.id}`}
                            right={relationId ? (
                              <IconButton icon={UserMinus} label="Desfazer vínculo" onClick={() => confirmUnlink(trainer, relationId)} />
                            ) : undefined}
                          />
                        </div>
                      )
                    })}
                  </Card>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </Page>
  )
}
