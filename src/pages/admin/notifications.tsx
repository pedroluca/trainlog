import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Bell, Send, Mail, AlertCircle, CheckCircle, Smartphone } from 'lucide-react'
import { AdminContextData } from '../../layouts/admin-layout'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebaseConfig'

export function AdminNotifications() {
  const { adminId, users } = useOutletContext<AdminContextData>()
  
  const [activeTab, setActiveTab] = useState<'push' | 'email'>('push')
  const [loading, setLoading] = useState(false)
  const [responseLog, setResponseLog] = useState<string | null>(null)
  
  // Push fields
  const [pushTargetId, setPushTargetId] = useState(adminId || '')
  const [pushTitle, setPushTitle] = useState('Teste de Push Admin')
  const [pushBody, setPushBody] = useState('Isto é um teste disparado pelo painel administrador.')
  
  // Email fields
  const [emailTarget, setEmailTarget] = useState('')
  
  // Auto-fill email based on logged-in admin
  useEffect(() => {
    if (adminId && users.length > 0 && !emailTarget) {
      const adminUser = users.find(u => u.id === adminId)
      if (adminUser?.email) {
        setEmailTarget(adminUser.email)
      }
    }
  }, [adminId, users, emailTarget])

  const CRON_SECRET = import.meta.env.VITE_CRON_SECRET || 'tlg_2ab6ApP7sc1SE_BKyuem_zag7Z7'
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://trainlog.site/api'

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTargetId.trim()) return
    
    setLoading(true)
    setResponseLog(null)
    
    try {
      // 1. Opcionalmente, buscar o Player ID do Firebase (igual à Cron) se usarmos um UID válido
      let targetSubscriptionId = ''
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', pushTargetId.trim()))
        if (userDoc.exists()) {
          const data = userDoc.data()
          targetSubscriptionId = data.oneSignalSubscriptionId || data.player_id || ''
        }
      } catch (e) {
        console.log('Firebase fetch ignorado:', e)
      }

      const url = new URL(`${API_BASE}/cron/test-simple-send.php`)
      url.searchParams.append('secret', CRON_SECRET)
      
      // Enviamos a Subscription ID (se encontrada no BD) ou recaímos direto no UID 
      if (targetSubscriptionId) {
         url.searchParams.append('subscription_id', targetSubscriptionId)
      } else {
         url.searchParams.append('external_id', pushTargetId.trim())
      }
      
      url.searchParams.append('title', pushTitle.trim())
      url.searchParams.append('body', pushBody.trim())
      
      const res = await fetch(url.toString())
      const data = await res.json()
      
      setResponseLog(JSON.stringify(data, null, 2))
    } catch (err) {
      setResponseLog(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro genérico' }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailTarget.trim()) return
    
    setLoading(true)
    setResponseLog(null)
    
    try {
      const url = new URL(`${API_BASE}/cron/cron-weekly-report.php`)
      url.searchParams.append('secret', CRON_SECRET)
      url.searchParams.append('test_email', emailTarget.trim())
      
      const res = await fetch(url.toString())
      // O cron-weekly-report pode não retornar JSON puro se der catch em algo, mas tentamos ler como texto primeiro
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponseLog(JSON.stringify(json, null, 2))
      } catch {
        setResponseLog(text)
      }
    } catch (err) {
      setResponseLog(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro genérico' }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400">
            <Bell size={24} />
          </div>
          Disparos & Testes
          <span className="text-sm bg-gray-700/50 text-gray-400 px-3 py-1 rounded-full ml-2 font-normal">
            Teste envio de Push e Email
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Forms */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('push')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'push' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone size={16} />
              Push (OneSignal)
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'email' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail size={16} />
              Email (Relatório)
            </button>
          </div>

          {/* Forms */}
          <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
            {activeTab === 'push' ? (
              <form onSubmit={handleSendPush} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <Smartphone size={20} />
                  <h2 className="text-lg font-bold text-white">Enviar Push Notification</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    UID do Usuário (external_id)
                  </label>
                  <input
                    type="text"
                    value={pushTargetId}
                    onChange={(e) => setPushTargetId(e.target.value)}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Ex: a8549c0e-e16e-428b-8efc-0a104a... "
                  />
                  <p className="text-xs text-gray-500 mt-1">Por padrão está o seu próprio UID de Admin.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Título da Notificação
                  </label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Corpo do Push
                  </label>
                  <textarea
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    required
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} /> Disparar Push
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 text-green-400">
                  <Mail size={20} />
                  <h2 className="text-lg font-bold text-white">Enviar Email de Relatório Semanal</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email de Destino (Teste)
                  </label>
                  <input
                    type="email"
                    value={emailTarget}
                    onChange={(e) => setEmailTarget(e.target.value)}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-green-500"
                    placeholder="seuemail@exemplo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Isso simula a execução do cron enviando dados do seu usuário pro email digitado.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} /> Disparar Email de Teste
                    </>
                  )}
                </button>

                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    O relatório de email rodará no modo de demonstração (`test_email`). Lembre-se que você precisa ter treinado nos últimos 7 dias para que o design mostre dados reais, caso contrário mostrará "0 treinos registrados".
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Log Console */}
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <span className="text-xs font-mono text-gray-400">Response Console</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm max-h-[600px] custom-scrollbar">
            {responseLog === null ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                <CheckCircle size={32} className="opacity-50" />
                <p>Nenhuma requisição feita ainda.</p>
                <p className="text-xs text-center max-w-[200px]">Envie um push ou email para ver a resposta da API aqui.</p>
              </div>
            ) : (
              <pre className="text-green-400 whitespace-pre-wrap break-all">
                {responseLog}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
