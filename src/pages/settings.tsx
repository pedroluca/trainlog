import { Box, Crown, ExternalLink, Headset, Lock, Mail, Palette, Shield, ShieldUser, Trash2, UserRound, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { ListRow, ListSection, SwitchRow } from '../components/ui/list'
import { LoadingState } from '../components/ui/misc'
import { Page, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { useToast } from '../contexts/toast-context'
import { updateUserFields } from '../data/profile'
import { getVersion } from '../version'

const externalIcon = <ExternalLink size={16} className="shrink-0 text-subtle" aria-hidden />
const openExternal = (url: string) => () => window.open(url, '_blank', 'noopener,noreferrer')

export function Settings() {
  const profile = useCurrentUser()
  const toast = useToast()
  const [premiumOpen, setPremiumOpen] = useState(false)

  if (!localStorage.getItem('usuarioId')) return <Navigate to="/login" replace />

  // O snapshot do perfil atualiza a tela assim que a escrita local acontece
  const toggle = (field: 'audioEnabled' | 'emailNotifications', value: boolean) => {
    if (!profile) return
    updateUserFields(profile.id, { [field]: value }).catch(() => toast.error('Não foi possível salvar a preferência.'))
  }

  return (
    <>
      <StackHeader title="Configurações" backTo="/profile" />
      {!profile ? (
        <LoadingState />
      ) : (
        <Page className="gap-6 pt-2">
          {!profile.isPremium && (
            <ListSection>
              <ListRow title="Seja Premium" description="Pagamento único, acesso vitalício" icon={Crown} iconColor="var(--color-premium)" onClick={() => setPremiumOpen(true)} />
            </ListSection>
          )}

          <ListSection title="Preferências">
            <ListRow title="Aparência" description="Tema claro, escuro e cor principal" icon={Palette} to="/profile/settings/appearance" />
            <SwitchRow
              title="Som no fim do descanso"
              description="Toca um bipe quando o timer termina"
              icon={Volume2}
              checked={profile.audioEnabled === true}
              onCheckedChange={value => toggle('audioEnabled', value)}
            />
            <SwitchRow
              title="Resumo semanal por email"
              description="Seus treinos da semana, todo domingo"
              icon={Mail}
              checked={profile.emailNotifications !== false}
              onCheckedChange={value => toggle('emailNotifications', value)}
            />
          </ListSection>

          <ListSection title="Conta">
            <ListRow title="Privacidade do perfil" description="O que seus amigos podem ver" icon={Shield} to="/profile/settings/privacy" />
            <ListRow title="Alterar senha" icon={Lock} to="/profile/settings/password" />
            <ListRow title="Ajuda e suporte" description="Reportar um problema ou dar uma sugestão" icon={Headset} to="/profile/settings/support" />
          </ListSection>

          <ListSection title="Sobre">
            <ListRow title="Versão do app" icon={Box} value={getVersion()} />
            <ListRow title="Política de privacidade" icon={ShieldUser} accessory={externalIcon} onClick={openExternal('/privacy')} />
            <ListRow title="Desenvolvedor" description="Pedro Luca Prates" icon={UserRound} accessory={externalIcon} onClick={openExternal('https://pedroluca.dev.br')} />
            <ListRow title="Excluir minha conta" icon={Trash2} destructive accessory={externalIcon} onClick={openExternal('/delete-account')} />
          </ListSection>
        </Page>
      )}
      <PremiumUpgrade open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  )
}
