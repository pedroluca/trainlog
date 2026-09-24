import { useState } from 'react'
import { FileJson, FileSpreadsheet, X } from 'lucide-react'
import { Spinner } from './spinner'
import { exportUserWorkouts, type TransferFormat } from '../data/workout-transfer'

type ExportFeedback = {
  message: string
  type: 'success' | 'info' | 'error'
}

type ExportWorkoutsModalProps = {
  usuarioID: string
  onClose: () => void
  onFinished: (feedback: ExportFeedback) => void
}

const FORMAT_OPTIONS: Array<{ format: TransferFormat; title: string; description: string; icon: typeof FileJson }> = [
  {
    format: 'json',
    title: 'JSON',
    description: 'Backup completo, pode ser importado de volta no Tractus',
    icon: FileJson,
  },
  {
    format: 'csv',
    title: 'Planilha (CSV)',
    description: 'Abre no Excel ou Google Sheets, e também pode ser importada',
    icon: FileSpreadsheet,
  },
]

export function ExportWorkoutsModal({ usuarioID, onClose, onFinished }: ExportWorkoutsModalProps) {
  const [exportingFormat, setExportingFormat] = useState<TransferFormat | null>(null)

  const handleExport = async (format: TransferFormat) => {
    setExportingFormat(format)
    try {
      const count = await exportUserWorkouts(usuarioID, format)
      onFinished(count === 0
        ? { message: 'Você ainda não tem treinos para exportar.', type: 'info' }
        : { message: `${count} ${count === 1 ? 'treino exportado' : 'treinos exportados'}!`, type: 'success' })
    } catch (err) {
      console.error('Erro ao exportar treinos:', err)
      onFinished({ message: 'Erro ao exportar treinos. Tente novamente.', type: 'error' })
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] dark:bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-60 px-4">
      <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#404040]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Exportar Treinos</h2>
          <button
            onClick={onClose}
            disabled={exportingFormat !== null}
            className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#404040] text-gray-400 dark:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Escolha o formato do arquivo:</p>

          {FORMAT_OPTIONS.map(({ format, title, description, icon: Icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              disabled={exportingFormat !== null}
              className="cursor-pointer w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#252525] hover:border-primary p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="shrink-0 w-10 flex justify-center text-gray-500 dark:text-gray-400">
                {exportingFormat === format ? <Spinner size={22} thickness={2} /> : <Icon size={26} />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
