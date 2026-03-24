import { useState, useEffect } from 'react'
import { Bug, AlertTriangle, Lightbulb, MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebaseConfig'

interface BugReport {
  id: string
  usuarioID: string
  nome: string
  email: string
  username: string
  tipo: string
  titulo: string
  mensagem: string
  imagemUrl: string | null
  dataCriacao: any
  status: string
}

export function AdminBugs() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, 'bug_reports'),
          orderBy('dataCriacao', 'desc')
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugReport))
        setReports(data)
      } catch (err) {
        console.error('Erro ao buscar relatos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case 'Bug': return 'bg-red-500/20 text-red-400'
      case 'Erro': return 'bg-orange-500/20 text-orange-400'
      case 'Sugestão': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch(tipo) {
      case 'Bug': return <Bug size={14} className="mr-1" />
      case 'Erro': return <AlertTriangle size={14} className="mr-1" />
      case 'Sugestão': return <Lightbulb size={14} className="mr-1" />
      default: return <MessageSquare size={14} className="mr-1" />
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 md:p-10 border border-white/10 shadow-xl min-h-[60vh] flex flex-col items-center">
      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-blue-500/20">
        <Bug size={36} className="text-blue-400" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3 text-center">Relatos dos Usuários</h2>
      <p className="text-gray-400 max-w-lg mb-8 text-center text-lg">
        Gerencie os bugs, erros e sugestões enviados pelos usuários.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-700/50 w-full max-w-2xl">
          Nenhum relato encontrado no momento.
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 text-left flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`flex items-center text-[10px] uppercase font-bold px-2 py-1 rounded ${getTipoColor(report.tipo)}`}>
                    {getTipoIcon(report.tipo)}
                    {report.tipo}
                  </div>
                  <span className="text-gray-500 text-[10px] font-medium text-right whitespace-nowrap ml-2">
                    {report.dataCriacao?.toDate ? report.dataCriacao.toDate().toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                
                <h4 className="text-white font-bold mb-2 text-base leading-tight">{report.titulo}</h4>
                <p className="text-gray-300 text-sm mb-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 line-clamp-4">
                  {report.mensagem}
                </p>
                
                {report.imagemUrl && (
                  <div className="mb-4">
                    <a href={report.imagemUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 transition-colors">
                      <ImageIcon size={14} />
                      Ver Print 
                      <ExternalLink size={12} className="ml-0.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-3 border-t border-gray-700/50">
                <p className="text-gray-400 text-xs mb-1 font-medium flex justify-between items-center gap-2">
                  <span className="truncate">{report.nome}</span>
                  <span className="text-gray-300 shrink-0">@{report.username}</span>
                </p>
                <p className="text-gray-500 text-[10px] truncate">
                  {report.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
