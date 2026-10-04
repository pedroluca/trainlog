import { useEffect, useState } from 'react'

const SUPPORT_EMAIL = 'suporte@trainlog.site'

export function DeleteData() {
  useEffect(() => {
    document.title = 'Excluir Dados – Tractus'
  }, [])

  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=Solicita%C3%A7%C3%A3o%20de%20Exclus%C3%A3o%20de%20Dados%20%E2%80%93%20Tractus&body=Ol%C3%A1%2C%0A%0AGostaria%20de%20solicitar%20a%20exclus%C3%A3o%20dos%20seguintes%20dados%20da%20minha%20conta%20no%20Tractus%2C%20sem%20excluir%20a%20conta%3A%0A%0A%5BDescreva%20os%20dados%20que%20deseja%20excluir%5D%0A%0ANome%3A%20%5BSeu%20nome%5D%0AE-mail%20cadastrado%3A%20%5BSeu%20e-mail%5D%0A%0AAtenciosamente.`

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
            <span className="privacy-logo-text">Tractus</span>
          </div>

          <div className="delete-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
            </svg>
          </div>

          <h1 className="delete-title">Excluir Dados</h1>
          <p className="delete-subtitle">
            Você pode excluir parte dos seus dados sem excluir sua conta. Solicitações por e-mail são processadas em até <strong>30 dias</strong>.
          </p>
        </header>

        {/* Info card */}
        <div className="delete-info-card">
          <div className="delete-info-icon">🗂️</div>
          <div>
            <p className="delete-info-title">Dados que você pode excluir:</p>
            <ul className="delete-info-list">
              <li>Treinos e exercícios cadastrados</li>
              <li>Métricas corporais registradas</li>
              <li>Conexões com treinadores</li>
              <li>Foto de perfil e informações opcionais do perfil</li>
              <li>Histórico de treinos, sequência (streak) e progresso</li>
            </ul>
            <p className="delete-info-warning">Dados excluídos são removidos <strong>permanentemente</strong> e não podem ser recuperados.</p>
          </div>
        </div>

        {/* Steps */}
        <div className="delete-steps">
          <h2 className="delete-steps-title">Como excluir seus dados</h2>

          <div className="delete-step">
            <div className="delete-step-number">1</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Direto no aplicativo</p>
              <p className="delete-step-desc">
                Treinos, exercícios, métricas corporais e conexões com treinadores podem ser excluídos a qualquer momento
                pelas respectivas telas do app. A exclusão é imediata.
              </p>
            </div>
          </div>

          <div className="delete-step">
            <div className="delete-step-number">2</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Ou solicite por e-mail</p>
              <p className="delete-step-desc">
                Para qualquer outro dado, envie um e-mail ao suporte informando o e-mail cadastrado e quais dados deseja excluir.
                Responderemos em até <strong>3 dias úteis</strong> e os dados serão removidos em até <strong>30 dias</strong>.
              </p>
            </div>
          </div>

          <div className="delete-step">
            <div className="delete-step-number">3</div>
            <div className="delete-step-content">
              <p className="delete-step-label">Quer excluir tudo?</p>
              <p className="delete-step-desc">
                Para remover sua conta e todos os dados associados, acesse a página de{' '}
                <a href="/delete-account" style={{ color: '#27AE60' }}>exclusão de conta</a>.
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
          <p>© {new Date().getFullYear()} Tractus. Todos os direitos reservados.</p>
          <p style={{ marginTop: '0.4rem' }}>
            <a href="/privacy" style={{ color: '#27AE60', textDecoration: 'none' }}>Política de Privacidade</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
