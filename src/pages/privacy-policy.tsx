import { useEffect } from 'react'

export function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Política de Privacidade – TrainLog'
  }, [])

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        {/* Header */}
        <header className="privacy-header">
          <div className="privacy-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#27AE60" />
              <path d="M10 18h4l3-7 4 14 3-10 2 3h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="privacy-logo-text">TrainLog</span>
          </div>
          <h1 className="privacy-title">Política de Privacidade</h1>
          <p className="privacy-subtitle">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </header>

        {/* Content */}
        <main className="privacy-content">

          <section className="privacy-section">
            <h2>1. Introdução</h2>
            <p>
              Bem-vindo ao <strong>TrainLog</strong>. Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos suas informações pessoais ao utilizar nosso aplicativo de acompanhamento de treinos.
            </p>
            <p>
              Ao criar uma conta e utilizar o TrainLog, você concorda com as práticas descritas nesta política.
              Caso não concorde com algum ponto, recomendamos que não utilize o aplicativo.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Informações que Coletamos</h2>
            <p>Coletamos as seguintes categorias de informações:</p>

            <h3>2.1 Informações fornecidas por você</h3>
            <ul>
              <li><strong>Dados de conta:</strong> nome, endereço de e-mail e senha (armazenada de forma criptografada).</li>
              <li><strong>Dados de perfil:</strong> foto de perfil, nome de exibição e informações opcionais de perfil.</li>
              <li><strong>Dados de treino:</strong> exercícios realizados, séries, repetições, cargas, datas e notas de treino.</li>
              <li><strong>Métricas corporais:</strong> peso, altura e outras métricas de saúde que você optar por registrar.</li>
            </ul>

            <h3>2.2 Informações coletadas automaticamente</h3>
            <ul>
              <li><strong>Dados de uso:</strong> frequência de uso, funcionalidades acessadas e interações dentro do aplicativo.</li>
              <li><strong>Identificadores de dispositivo:</strong> ID do dispositivo para envio de notificações push.</li>
              <li><strong>Dados técnicos:</strong> versão do aplicativo, sistema operacional e informações de diagnóstico de erros.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. Como Usamos suas Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul>
              <li>Criar e gerenciar sua conta no aplicativo.</li>
              <li>Registrar, exibir e analisar seu histórico de treinos e evolução.</li>
              <li>Enviar notificações push relacionadas ao aplicativo (lembretes de treino, atualizações, etc.).</li>
              <li>Permitir funcionalidades sociais, como adicionar amigos e visualizar o progresso de outros usuários (conforme suas configurações de privacidade).</li>
              <li>Melhorar o desempenho, segurança e estabilidade do aplicativo.</li>
              <li>Entrar em contato com você em caso de suporte ou atualizações importantes.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Compartilhamento de Informações</h2>
            <p>
              Não vendemos nem alugamos seus dados pessoais a terceiros. Podemos compartilhar informações apenas nas seguintes situações:
            </p>
            <ul>
              <li>
                <strong>Provedores de serviço:</strong> utilizamos serviços de terceiros como Firebase (Google) para autenticação e banco de dados,
                e OneSignal para notificações push. Esses parceiros têm acesso limitado aos dados necessários para prestar o serviço.
              </li>
              <li>
                <strong>Obrigações legais:</strong> quando exigido por lei, ordem judicial ou autoridade competente.
              </li>
              <li>
                <strong>Proteção de direitos:</strong> para proteger os direitos, propriedade ou segurança do TrainLog e de seus usuários.
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>5. Serviços de Terceiros</h2>
            <p>O TrainLog utiliza os seguintes serviços de terceiros, cada um com sua própria política de privacidade:</p>
            <ul>
              <li>
                <strong>Firebase (Google LLC)</strong> – Autenticação, banco de dados em nuvem e armazenamento.
                {' '}<a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
              </li>
              <li>
                <strong>OneSignal</strong> – Serviço de notificações push.
                {' '}<a href="https://onesignal.com/privacy_policy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
              </li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>6. Armazenamento e Segurança dos Dados</h2>
            <p>
              Seus dados são armazenados em servidores seguros fornecidos pelo Google Firebase, com criptografia em trânsito (TLS) e em repouso.
              Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou divulgação indevida.
            </p>
            <p>
              Apesar de nossos esforços, nenhum sistema é 100% seguro. Recomendamos que você utilize uma senha forte e não a compartilhe com ninguém.
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Caso você solicite a exclusão da conta, seus dados pessoais serão removidos
              de nossos sistemas em até <strong>30 dias</strong>, exceto quando a retenção for exigida por obrigação legal.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul>
              <li><strong>Acesso:</strong> solicitar uma cópia dos seus dados pessoais.</li>
              <li><strong>Correção:</strong> corrigir informações incorretas ou desatualizadas.</li>
              <li><strong>Exclusão:</strong> solicitar a exclusão da sua conta e dos seus dados.</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado.</li>
              <li><strong>Revogar consentimento:</strong> desativar notificações push a qualquer momento nas configurações do dispositivo.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail abaixo.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Privacidade de Menores</h2>
            <p>
              O TrainLog não é destinado a menores de <strong>13 anos</strong>. Não coletamos intencionalmente informações pessoais de crianças.
              Se você acredita que uma criança nos forneceu dados, entre em contato para que possamos removê-los.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. Notificações Push</h2>
            <p>
              O aplicativo pode enviar notificações push para informar sobre lembretes de treino, atividade social e atualizações do sistema.
              Você pode desativar as notificações a qualquer momento nas configurações do seu dispositivo Android, sem prejuízo ao uso do aplicativo.
            </p>
          </section>

          <section className="privacy-section">
            <h2>11. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos você
              por meio do aplicativo ou por e-mail. O uso continuado do TrainLog após as alterações implica aceitação da nova política.
            </p>
          </section>

          <section className="privacy-section">
            <h2>12. Contato</h2>
            <p>
              Se tiver dúvidas, solicitações ou preocupações sobre esta Política de Privacidade, entre em contato conosco:
            </p>
            <div className="privacy-contact">
              <p><strong>TrainLog</strong></p>
              <p>📧 <a href="mailto:suporte@trainlog.site">suporte@trainlog.site</a></p>
            </div>
          </section>

        </main>

        <footer className="privacy-footer">
          <p>© {new Date().getFullYear()} TrainLog. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
