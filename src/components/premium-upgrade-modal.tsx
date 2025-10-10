import { useState, useEffect } from 'react'
import { Button } from './button'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { X, Sparkles, Calendar, TrendingUp, Crown } from 'lucide-react'
import { trackPremiumUpgradeModalOpened, trackPremiumUpgradeRequested } from '../utils/analytics'
import QRCode from '../assets/qr-code-pix-value.jpg'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  userName: string
  userId: string
  userPhone: string
}

export function PremiumUpgradeModal({ isOpen, onClose, userEmail, userName, userId, userPhone }: PremiumUpgradeModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [pixKeyCopied, setPixKeyCopied] = useState(false)

  // PIX Configuration (UPDATE WITH YOUR PIX KEY!)
  const PIX_KEY = 'suporte@trainlog.site' // TROCAR PELA SUA CHAVE PIX
  const PIX_VALUE = '14.90'
  const ADMIN_WHATSAPP = '5577936181281' // TROCAR PELO SEU WHATSAPP (com DDD, sem espaços)

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setPixKeyCopied(true)
    setTimeout(() => setPixKeyCopied(false), 2000)
  }

  // Track when modal is opened
  useEffect(() => {
    if (isOpen) {
      trackPremiumUpgradeModalOpened()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleUpgradeRequest = async () => {
    if (!message.trim()) {
      alert('Por favor, conte-nos por que você quer o Premium!')
      return
    }

    setLoading(true)

    try {
      // Create upgrade request in Firestore
      await addDoc(collection(db, 'upgrade_requests'), {
        userId,
        userName,
        userEmail,
        userPhone,
        message: message.trim(),
        status: 'pending', // pending, approved, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Track successful request
      trackPremiumUpgradeRequested()

      setRequestSent(true)
    } catch (error) {
      console.error('Error creating upgrade request:', error)
      alert('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (requestSent) {
    return (
      <div className='fixed inset-0 z-60 bg-black/50 dark:bg-black/70 flex items-center justify-center px-4 backdrop-blur-sm'>
        <div className='bg-white z-65 dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-xl p-6 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto'>
          {/* Close Button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
          >
            <X size={24} />
          </button>

          {/* Success Content */}
          <div className='text-center py-4'>
            <div className='w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Sparkles className='text-green-600 dark:text-green-400' size={32} />
            </div>
            <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3'>
              Solicitação Enviada! ✨
            </h2>
            <p className='text-gray-600 dark:text-gray-400 mb-4 text-sm'>
              Agora é só fazer o pagamento e enviar o comprovante!
            </p>

            {/* PIX Payment Section */}
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 mb-4'>
              <h3 className='font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center justify-center gap-2'>
                💚 Pague via PIX
              </h3>
              
              {/* PIX Key */}
              <div className='bg-white dark:bg-[#1a1a1a] rounded-lg p-3 mb-3'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>Chave PIX:</p>
                <div className='flex items-center justify-between gap-2'>
                  <code className='text-sm font-mono text-gray-800 dark:text-gray-100 break-all'>
                    {PIX_KEY}
                  </code>
                  <button
                    onClick={copyPixKey}
                    className='flex-shrink-0 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors'
                  >
                    {pixKeyCopied ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Value */}
              <div className='bg-white dark:bg-[#1a1a1a] rounded-lg p-3 mb-3'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>Valor:</p>
                <p className='text-2xl font-bold text-green-600 dark:text-green-400'>R$ {PIX_VALUE}</p>
              </div>

              {/* QR Code Placeholder */}
              <div className='bg-white dark:bg-[#1a1a1a] rounded-lg p-4 mb-3'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>QR Code PIX:</p>
                <div className='w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600'>
                  {/* <p className='text-gray-500 dark:text-gray-400 text-xs text-center px-4'>
                    📱 Use o PIX Copia e Cola<br/>com a chave acima
                  </p> */}
                  <img src={QRCode} alt="QR Code PIX" />
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
                  Abra seu app bancário → PIX → Pix Copia e Cola → Cole a chave
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4'>
              <p className='text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2'>
                📋 Após o pagamento:
              </p>
              <ol className='text-left text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4'>
                <li>1. Tire print/foto do comprovante</li>
                <li>2. Envie via WhatsApp ou Email</li>
                <li>3. Aguarde aprovação (geralmente em minutos!)</li>
                <li>4. Seu Premium será ativado! 🎉</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className='space-y-2'>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}?text=Olá! Acabei de fazer o pagamento do TrainLog Premium (R$ ${PIX_VALUE}). Segue o comprovante:`}
                target='_blank'
                rel='noopener noreferrer'
                className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
              >
                <span className='text-xl'>📱</span>
                Enviar Comprovante via WhatsApp
              </a>

              <a
                href={`mailto:suporte@trainlog.site?subject=Comprovante TrainLog Premium - ${userName}&body=Olá!%0A%0AAcabei de fazer o pagamento do TrainLog Premium (R$ ${PIX_VALUE}).%0A%0AMeus dados:%0ANome: ${userName}%0AEmail: ${userEmail}%0A%0AComprovante em anexo.`}
                className='w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
              >
                <span className='text-xl'>📧</span>
                Enviar Comprovante via Email
              </a>

              <Button
                onClick={onClose}
                className='w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100'
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center px-4 backdrop-blur-sm'>
      <div className='bg-white dark:bg-[#2d2d2d] dark:border dark:border-[#404040] rounded-xl p-6 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className='text-center mb-6'>
          <div className='w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <Crown className='text-white' size={32} />
          </div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2'>
            Upgrade para Premium
          </h2>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Desbloqueie recursos exclusivos e turbine seus treinos!
          </p>
        </div>

        {/* Premium Features */}
        <div className='space-y-3 mb-6'>
          <div className='flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
            <div className='flex-shrink-0 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center'>
              <Calendar className='text-white' size={18} />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100 text-sm'>
                Calendário de Streaks
              </h3>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Visualize seu histórico completo de treinos em um calendário interativo
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
            <div className='flex-shrink-0 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center'>
              <TrendingUp className='text-white' size={18} />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100 text-sm'>
                Métricas Corporais
              </h3>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Acompanhe peso, IMC e evolução física ao longo do tempo
              </p>
            </div>
          </div>

          <div className='flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
            <div className='flex-shrink-0 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center'>
              <Sparkles className='text-white' size={18} />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 dark:text-gray-100 text-sm'>
                Novos Recursos em Breve
              </h3>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Acesso antecipado a todos os recursos futuros do TrainLog
              </p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className='space-y-4 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Por que você quer o Premium? 💪
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Conte-nos como o Premium vai ajudar nos seus treinos...'
              className='w-full border dark:border-[#404040] rounded-lg px-4 py-3 dark:bg-[#1a1a1a] dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
              rows={4}
              disabled={loading}
            />
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
              Exemplo: "Treino 5x por semana e quero acompanhar minha evolução"
            </p>
          </div>

          {/* User Info Display */}
          <div className='bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#404040] rounded-lg p-3'>
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
              Solicitação será enviada como:
            </p>
            <p className='text-sm font-medium text-gray-800 dark:text-gray-100'>
              {userName}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              {userEmail}
            </p>
          </div>
        </div>

        {/* Pricing Info */}
        <div className='bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Investimento Premium:
            </span>
            <div className='text-right'>
              <span className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                R$ 14,90
              </span>
              <span className='text-xs text-gray-600 dark:text-gray-400 ml-1'>
                / único
              </span>
            </div>
          </div>
          <p className='text-xs text-gray-600 dark:text-gray-400 text-center'>
            💳 Pagamento via PIX • Acesso vitalício
          </p>
        </div>

        {/* Actions */}
        <div className='flex gap-3'>
          <Button
            onClick={onClose}
            className='flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100'
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpgradeRequest}
            className='flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg'
            disabled={loading}
          >
            {loading ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                Enviando...
              </div>
            ) : (
              <>
                <Sparkles size={18} className='mr-2' />
                Solicitar Premium
              </>
            )}
          </Button>
        </div>

        {/* Footer Note */}
        <p className='text-xs text-center text-gray-500 dark:text-gray-400 mt-4'>
          Após aprovação, você receberá instruções de pagamento por email
        </p>
      </div>
    </div>
  )
}
