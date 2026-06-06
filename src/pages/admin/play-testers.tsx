import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Mail, ExternalLink, Copy, CheckCircle2, Clock3, Store, Check } from 'lucide-react'
import { AdminContextData, PlayTesterLead } from '../../layouts/admin-layout'
import { db } from '../../firebaseConfig'
import { Spinner } from '../../components/spinner'

type LeadStatusFilter = 'all' | PlayTesterLead['status']

const DEFAULT_ACCESS_LINK = 'https://play.google.com/store/apps/details?id=com.trainlog.app'

const statusLabel: Record<PlayTesterLead['status'], string> = {
  pending: 'Pendente',
  invited_on_google_play: 'Adicionado na Google Play',
  access_email_sent: 'Email de acesso enviado',
}

export function AdminPlayTesters() {
  const { adminId, playTesterLeads, setPlayTesterLeads } = useOutletContext<AdminContextData>()

  const [savingId, setSavingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('all')
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'all') return playTesterLeads
    return playTesterLeads.filter((lead) => lead.status === statusFilter)
  }, [playTesterLeads, statusFilter])

  const formatRawData = (lead: PlayTesterLead) => {
    const data = lead.rawData || {
      id: lead.id,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      followUpStatus: lead.followUpStatus,
      locale: lead.locale,
      userAgent: lead.userAgent,
      requestCount: lead.requestCount,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      invitedAt: lead.invitedAt,
      emailedAt: lead.emailedAt,
      accessLink: lead.accessLink,
      processedBy: lead.processedBy,
    }

    return JSON.stringify(data, null, 2)
  }

  const refreshLeads = async () => {
    const leadsSnapshot = await getDocs(collection(db, 'google_play_waitlist'))
    const nextLeads: PlayTesterLead[] = leadsSnapshot.docs.map((d) => ({
      id: d.id,
      email: d.data().email,
      status: d.data().status || 'pending',
      source: d.data().source || 'unknown',
      locale: d.data().locale,
      userAgent: d.data().userAgent,
      requestCount: d.data().requestCount,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt,
      invitedAt: d.data().invitedAt,
      emailedAt: d.data().emailedAt,
      accessLink: d.data().accessLink,
      processedBy: d.data().processedBy,
    }))

    nextLeads.sort((a, b) => {
      const createdA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
        ? (a.createdAt as { toDate: () => Date }).toDate().getTime()
        : 0
      const createdB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
        ? (b.createdAt as { toDate: () => Date }).toDate().getTime()
        : 0
      return createdB - createdA
    })

    setPlayTesterLeads(nextLeads)
  }

  const getLeadLink = (lead: PlayTesterLead) => linkDrafts[lead.id] || lead.accessLink || DEFAULT_ACCESS_LINK

  const openPreparedEmail = (lead: PlayTesterLead) => {
    const accessLink = getLeadLink(lead)
    const subject = encodeURIComponent('Seu acesso ao Tractus na Google Play')
    const body = encodeURIComponent(
      `Oi!\n\nSeu acesso ao teste do Tractus na Google Play ja esta liberado.\n\nLink: ${accessLink}\n\nSe puder, depois me conte seu feedback sobre o app.\n\nObrigado!`
    )

    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank')
  }

  const copyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email)
    setFeedback({ type: 'success', message: `Email ${email} copiado.` })
  }

  const copyLink = async (lead: PlayTesterLead) => {
    await navigator.clipboard.writeText(getLeadLink(lead))
    setFeedback({ type: 'success', message: 'Link de acesso copiado.' })
  }

  const markAsInvited = async (lead: PlayTesterLead) => {
    setSavingId(lead.id)
    setFeedback(null)

    try {
      await updateDoc(doc(db, 'google_play_waitlist', lead.id), {
        status: 'invited_on_google_play',
        invitedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        processedBy: adminId,
      })

      await refreshLeads()
      setFeedback({ type: 'success', message: `${lead.email} marcado como adicionado na Google Play. O e-mail será enviado automaticamente pela Cloud Function.` })
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao atualizar status para Google Play.' })
    } finally {
      setSavingId(null)
    }
  }

  const markAsEmailed = async (lead: PlayTesterLead) => {
    setSavingId(lead.id)
    setFeedback(null)

    try {
      await updateDoc(doc(db, 'google_play_waitlist', lead.id), {
        status: 'access_email_sent',
        accessLink: getLeadLink(lead),
        emailedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        processedBy: adminId,
      })

      await refreshLeads()
      setFeedback({ type: 'success', message: `${lead.email} marcado como email enviado.` })
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao marcar email como enviado.' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
            <Store size={24} />
          </div>
          Google Play Testers
        </h2>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Filtrar:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatusFilter)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="invited_on_google_play">Adicionados na Google Play</option>
            <option value="access_email_sent">Email enviado</option>
          </select>
        </div>
      </div>

      <div className="mb-5 bg-gray-900/60 border border-gray-700 rounded-xl p-4 text-sm text-gray-300">
        <p className="font-semibold text-white mb-1">Fluxo recomendado</p>
        <p>1) Adicione o email no teste da Google Play</p>
        <p>2) Clique em "Marcar como adicionado"</p>
        <p>3) A Cloud Function envia automaticamente o email com o link da Google Play</p>
      </div>

      {feedback && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm border ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
            Nenhum registro encontrado para este filtro.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const currentLink = getLeadLink(lead)
            const isSaving = savingId === lead.id

            return (
              <div key={lead.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-white font-semibold break-all">{lead.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Origem: {lead.source}
                      {lead.followUpStatus ? ` • followUpStatus: ${lead.followUpStatus}` : ''}
                      {' '}
                      • Status: {statusLabel[lead.status]}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full border ${lead.status === 'pending' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : lead.status === 'invited_on_google_play' ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'}`}>
                      {lead.status === 'pending' && <Clock3 size={12} className="inline mr-1" />}
                      {lead.status === 'invited_on_google_play' && <Store size={12} className="inline mr-1" />}
                      {lead.status === 'access_email_sent' && <CheckCircle2 size={12} className="inline mr-1" />}
                      {statusLabel[lead.status]}
                    </span>
                    <button onClick={() => copyEmail(lead.email)} className="text-gray-300 hover:text-white border border-gray-600 px-2 py-1 rounded-md">
                      <Copy size={12} className="inline mr-1" /> Copiar email
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_auto] gap-3">
                  <input
                    type="url"
                    value={currentLink}
                    onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white"
                    placeholder={DEFAULT_ACCESS_LINK}
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyLink(lead)}
                      className="px-3 py-2 rounded-lg text-sm border border-gray-600 text-gray-200 hover:text-white hover:border-gray-400"
                    >
                      <Copy size={14} className="inline mr-1" /> Link
                    </button>
                    <button
                      onClick={() => openPreparedEmail(lead)}
                      className="px-3 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Mail size={14} className="inline mr-1" /> Abrir email pronto
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => markAsInvited(lead)}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white"
                  >
                    {isSaving ? <Spinner size={14} color="white" className="inline mr-1" /> : <Store size={14} className="inline mr-1" />}
                    Marcar como adicionado
                  </button>

                  <button
                    onClick={() => markAsEmailed(lead)}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white"
                  >
                    {isSaving ? <Spinner size={14} color="white" className="inline mr-1" /> : <Check size={14} className="inline mr-1" />}
                    Marcar email enviado
                  </button>

                  <a
                    href={currentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg text-sm border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <ExternalLink size={14} className="inline mr-1" /> Abrir link
                  </a>
                </div>

                <details className="mt-4 rounded-lg border border-gray-700 bg-gray-950/80 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-300">
                    Ver payload bruto
                  </summary>
                  <pre className="mt-3 overflow-x-auto text-[11px] leading-5 text-gray-300 whitespace-pre-wrap break-words">
                    {formatRawData(lead)}
                  </pre>
                </details>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
