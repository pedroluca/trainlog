import { useState, useEffect } from 'react'
import { Bug, AlertTriangle, Lightbulb, MessageSquare, ExternalLink, Image as ImageIcon, CheckCircle, X } from 'lucide-react'
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore'
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
  const [statusFilter, setStatusFilter] = useState<'pendente' | 'resolvido' | 'todos'>('pendente')
  const [dateOrder, setDateOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const fetchReports = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'bug_reports'),
        orderBy('dataCriacao', dateOrder)
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

  useEffect(() => {
    fetchReports()
  }, [dateOrder])

  const handleMarkResolved = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'resolvido' ? 'pendente' : 'resolvido'
      await updateDoc(doc(db, 'bug_reports', id), { status: newStatus })
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case 'Bug': return 'bg-red-500/20 text-red-400 border border-red-500/20'
      case 'Erro': return 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
      case 'Sugestão': return 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20'
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

  const filteredReports = reports.filter(r => {
    if (statusFilter === 'todos') return true;
    const rStatus = r.status || 'pendente';
    return rStatus === statusFilter;
  })

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-500">
            <Bug size={24} />
          </div>
          Relatos dos Usuários
          <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full ml-2">
            {filteredReports.length} encontrados
          </span>
        </h2>
      </div>

      {/* Filters and Sorting Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Filtrar por Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
          >
            <option value="pendente">Pendentes</option>
            <option value="resolvido">Resolvidos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Ordenar por Data:</label>
          <select 
            value={dateOrder} 
            onChange={(e) => setDateOrder(e.target.value as 'asc' | 'desc')}
            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
          >
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
          <Bug size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-300 text-xl font-bold mb-2">Nenhum relato encontrado</p>
          <p className="text-gray-500 text-sm">Tente ajustar os filtros acima para ver mais resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const isResolved = report.status === 'resolvido';
            return (
              <div key={report.id} className={`bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border flex flex-col justify-between shadow-lg transition-all ${isResolved ? 'border-green-500/20 opacity-70' : 'border-gray-700 hover:border-blue-500/50 hover:shadow-blue-500/10'}`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${getTipoColor(report.tipo)}`}>
                      {getTipoIcon(report.tipo)}
                      {report.tipo}
                    </div>
                    <span className="text-gray-400 text-[10px] font-medium text-right whitespace-nowrap ml-2 bg-gray-900/50 px-2 py-1 rounded-md">
                      {report.dataCriacao?.toDate ? report.dataCriacao.toDate().toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                  
                  <h4 className={`font-bold mb-3 text-base leading-tight ${isResolved ? 'text-gray-500 line-through decoration-gray-600' : 'text-white'}`}>
                    {report.titulo}
                  </h4>
                  
                  <div className={`text-sm mb-4 bg-gray-900/60 p-3.5 rounded-lg border border-gray-700/50 max-h-[150px] overflow-y-auto leading-relaxed ${isResolved ? 'text-gray-500' : 'text-gray-300'}`}>
                    {report.mensagem.split('\n').map((line, i) => (
                      <p key={i} className={i !== 0 ? "mt-1.5" : ""}>{line}</p>
                    ))}
                  </div>
                  
                  {report.imagemUrl && (
                    <div className="mb-5">
                      <button 
                        onClick={() => setSelectedImage(report.imagemUrl)}
                        className={`w-full cursor-pointer inline-flex justify-center items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition-all group ${
                          isResolved ? 'text-gray-500 bg-gray-700/30 border-gray-700/50 hover:text-gray-300 hover:bg-gray-700/50' : 'text-blue-400 hover:text-white hover:bg-blue-600 bg-blue-500/10 border-blue-500/20'
                        }`}
                      >
                        <ImageIcon size={16} className="group-hover:scale-110 transition-transform" />
                        Ver Print Anexado
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-700/50">
                  <div className="flex flex-col gap-1.5 mb-4">
                    <p className={`text-xs font-medium flex justify-between items-center ${isResolved ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="truncate mr-2">{report.nome}</span>
                      <span className={`${isResolved ? 'text-gray-500 bg-gray-800' : 'text-blue-400 bg-blue-400/10'} px-1.5 py-0.5 rounded shrink-0`}>@{report.username}</span>
                    </p>
                    <p className={`text-[10px] truncate ${isResolved ? 'text-gray-600' : 'text-gray-500'}`}>
                      {report.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleMarkResolved(report.id, report.status || 'pendente')}
                    className={`cursor-pointer w-full py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${
                      isResolved 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-[#27AE60]/10 text-[#27AE60] hover:bg-[#27AE60] hover:text-white border border-[#27AE60]/30'
                    }`}
                  >
                    <CheckCircle size={14} />
                    {isResolved ? 'Reabrir Relato' : 'Marcar como Resolvido'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Modal Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 flex gap-3">
            <a 
              href={selectedImage} 
              target="_blank" 
              rel="noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-lg"
              title="Abrir imagem em nova aba"
            >
              <ExternalLink size={20} />
            </a>
            <button 
              onClick={() => setSelectedImage(null)}
              className="cursor-pointer bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-lg"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Print Anexado" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  )
}
