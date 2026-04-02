import { useEffect, useState } from 'react'

const SUPPORT_EMAIL = 'suporte@trainlog.site'

export function DeleteAccount() {
  useEffect(() => {
    document.title = 'Excluir Conta – TrainLog'
  }, [])

  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=Solicita%C3%A7%C3%A3o%20de%20Exclus%C3%A3o%20de%20Conta%20%E2%80%93%20TrainLog&body=Ol%C3%A1%2C%0A%0AGostaria%20de%20solicitar%20a%20exclus%C3%A3o%20da%20minha%20conta%20no%20TrainLog.%0A%0ANome%3A%20%5BSeu%20nome%5D%0AE-mail%20cadastrado%3A%20%5BSeu%20e-mail%5D%0A%0AEntendo%20que%20todos%20os%20meus%20dados%20ser%C3%A3o%20removidos%20permanentemente.%0A%0AAtenciosamente.`

  return (
    <div className="delete-page">
      <div className="delete-container">

        {/* Header */}
        <header className="delete-header">
          <div className="privacy-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#27AE60" />
              <path d="M10 18h4l3-7 4 14 3-10 2 3h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="privacy-logo-text">TrainLog</span>
          </div>

          <div className="delete-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>

          <h1 className="delete-title">Excluir Conta</h1>
          <p className="delete-subtitle">
            Lamentamos ver você partir. Sua solicitação será processada em até <strong>30 dias</strong>.
          </p>
        </header>

        {/* Info card */}
        <div className="delete-info-card">
          <div className="delete-info-icon">⚠️</div>
          <div>
            <p className="delete-info-title">O que será removido permanentemente:</p>
            <ul className="delete-info-list">
              <li>Seus dados de perfil (nome, e-mail, foto)</li>
              <li>Todo o histórico de treinos e exercícios</li>
              <li>Métricas corporais registradas</li>
              <li>Conexões com amigos e treinadores</li>
              <li>Dados de sequência (streak) e progresso</li>
            </ul>
            <p className="delete-info-warning">Esta ação é <strong>irreversível</strong> e não poderá ser desfeita.</p>
          </div>
        </div>

        {/* Steps */}
        <div className="delete-steps">
          <h2 className="delete-steps-title">Como solicitar a exclusão</h2>

          <div className="delete-step">
            <div className="delete-step-number">1</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Envie um e-mail para o nosso suporte</p>
              <p className="delete-step-desc">
                Use o botão abaixo para abrir seu app de e-mail com as informações preenchidas automaticamente.
                Confirme seu nome completo e o e-mail cadastrado na sua conta.
              </p>
            </div>
          </div>

          <div className="delete-step">
            <div className="delete-step-number">2</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Aguarde a confirmação</p>
              <p className="delete-step-desc">
                Responderemos em até <strong>3 dias úteis</strong> confirmando o recebimento da sua solicitação.
              </p>
            </div>
          </div>

          <div className="delete-step">
            <div className="delete-step-number">3</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Exclusão concluída</p>
              <p className="delete-step-desc">
                Seus dados serão permanentemente removidos em até <strong>30 dias</strong> após a confirmação.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="delete-cta">
          <a
            href={mailtoLink}
            className="delete-btn-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Abrir e-mail para solicitação
          </a>

          <div className="delete-email-copy">
            <span className="delete-email-label">Ou copie o endereço de e-mail:</span>
            <div className="delete-email-row">
              <code className="delete-email-code">{SUPPORT_EMAIL}</code>
              <button onClick={handleCopyEmail} className="delete-copy-btn" title="Copiar e-mail">
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        <footer className="privacy-footer">
          <p>© {new Date().getFullYear()} TrainLog. Todos os direitos reservados.</p>
          <p style={{ marginTop: '0.4rem' }}>
            <a href="/privacy" style={{ color: '#27AE60', textDecoration: 'none' }}>Política de Privacidade</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
