import { CalendarDays, Copy, Crown, Eye, Mail, MessageCircle, Palette, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import qrCode from '../../assets/qr-code-upgrade.jpg'
import { buttonClasses, Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Callout } from '../../components/ui/misc'
import { Sheet } from '../../components/ui/sheet'
import { useToast } from '../../contexts/toast-context'
import { PREMIUM, requestPremiumUpgrade } from '../../data/premium'
import type { UserProfile } from '../../data/user-profile'
import { trackPremiumUpgradeModalOpened, trackPremiumUpgradeRequested } from '../../utils/analytics'

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: CalendarDays, title: 'Calendário de streak', description: 'Seu histórico de treinos mês a mês, com as semanas da sequência em destaque.' },
  { icon: Palette, title: 'Cor do app', description: 'Escolha a cor principal do Tractus.' },
  { icon: TrendingUp, title: 'Métricas corporais', description: 'Histórico de peso e IMC com gráfico de evolução.' },
  { icon: Eye, title: 'Histórico dos amigos', description: 'Veja as atividades dos amigos além dos últimos 7 dias.' },
  { icon: Sparkles, title: 'Selo Premium', description: 'Selo e anel dourado no seu perfil, e acesso antecipado a novidades.' },
]

/** Tela do Premium (mesmo conteúdo do app nativo): benefícios, pedido e pagamento via PIX */
export function PremiumSheet({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const toast = useToast()
  const [requested, setRequested] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackPremiumUpgradeModalOpened()
  }, [])

  const request = async () => {
    setLoading(true)
    try {
      await requestPremiumUpgrade(profile)
      trackPremiumUpgradeRequested()
      setRequested(true)
    } catch {
      toast.error('Não foi possível enviar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PREMIUM.pixKey)
      toast.success('Chave PIX copiada')
    } catch {
      toast.error('Não foi possível copiar. Selecione a chave e copie manualmente.')
    }
  }

  if (profile.isPremium) {
    return (
      <Sheet open onClose={onClose} size="sm">
        <div className="flex flex-col items-center gap-3 pb-2 pt-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-premium/12 text-premium">
            <Crown size={30} aria-hidden />
          </div>
          <h2 className="type-title">Você já é Premium</h2>
          <p className="text-sm text-muted">Obrigado por apoiar o Tractus!</p>
          <Button label="Fechar" fullWidth className="mt-4" onClick={onClose} />
        </div>
      </Sheet>
    )
  }

  if (requested) {
    const whatsappText = encodeURIComponent(`Olá! Acabei de fazer o pagamento do Tractus Premium (${PREMIUM.price}). Segue o comprovante.`)
    const mailSubject = encodeURIComponent(`Comprovante Tractus Premium - ${profile.nome}`)
    const mailBody = encodeURIComponent(`Olá!\n\nAcabei de fazer o pagamento do Tractus Premium (${PREMIUM.price}).\n\nNome: ${profile.nome}\nEmail: ${profile.email}\n\nComprovante em anexo.`)

    return (
      <Sheet open onClose={onClose} title="Tractus Premium">
        <div className="flex flex-col gap-5 pb-2">
          <Callout tone="success" icon={Sparkles} title="Solicitação enviada">
            Agora é só fazer o PIX e mandar o comprovante. A liberação costuma sair em poucos minutos.
          </Callout>

          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted">Valor</span>
                <span className="text-3xl font-bold">{PREMIUM.price}</span>
              </div>
              <span className="text-xs text-subtle">pagamento único</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">Chave PIX (email)</span>
              <div className="flex items-center gap-2">
                <span className="flex-1 select-all break-all text-base font-semibold">{PREMIUM.pixKey}</span>
                <Button label="Copiar" icon={Copy} variant="secondary" size="sm" onClick={copyPix} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src={qrCode} alt="QR Code PIX" className="size-44 rounded-xl bg-white object-contain p-2" />
              <span className="text-center text-xs text-subtle">No app do banco: PIX → Ler QR Code, ou use a chave acima.</span>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">Envie o comprovante</h3>
            <a
              href={`https://wa.me/${PREMIUM.whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: 'lg', fullWidth: true, className: 'gap-2.5' })}
            >
              <MessageCircle size={20} aria-hidden />
              Enviar pelo WhatsApp
            </a>
            <a
              href={`mailto:${PREMIUM.supportEmail}?subject=${mailSubject}&body=${mailBody}`}
              className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true, className: 'gap-2.5' })}
            >
              <Mail size={20} aria-hidden />
              Enviar por email
            </a>
          </div>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet
      open
      onClose={onClose}
      footer={(
        <div className="flex flex-col gap-2">
          <Button label="Quero ser Premium" icon={Crown} size="lg" loading={loading} onClick={request} />
          <Button label="Agora não" variant="ghost" onClick={onClose} />
        </div>
      )}
    >
      <div className="flex flex-col gap-5 pb-2 pt-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-premium/12 text-premium">
            <Crown size={30} aria-hidden />
          </div>
          <h2 className="type-title">Tractus Premium</h2>
          <p className="px-4 text-sm leading-5 text-muted">Recursos extras para quem leva a consistência a sério, e uma forma de apoiar o app.</p>
        </div>

        <Card className="flex flex-col gap-4 p-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-premium/10 text-premium">
                <Icon size={20} aria-hidden />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold">{title}</span>
                <span className="text-sm leading-5 text-muted">{description}</span>
              </span>
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-0.5 p-4">
          <span className="text-2xl font-bold">{PREMIUM.price}</span>
          <span className="text-xs text-muted">Pagamento único via PIX · acesso vitalício</span>
        </Card>
      </div>
    </Sheet>
  )
}
