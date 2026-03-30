<?php
/**
 * TrainLog - Cron Job para Relatório Semanal
 * 
 * Função: Enviar relatório por e-mail com resumo da semana de treinos
 * Frequência: 1x por semana (domingo às 20:00)
 * 
 * Setup no hPanel/cPanel:
 * URL: https://seu-dominio.com/api/cron/cron-weekly-report.php
 * Comando: wget -q -O- https://seu-dominio.com/api/cron/cron-weekly-report.php
 * 
 * Requisitos:
 * 1. Configuração SMTP ou mail() habilitado no servidor
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// ================================================================
// CONFIGURAÇÃO
// ================================================================

define('LOG_FILE', __DIR__ . '/cron-weekly-report.log');

assert_cron_secret();

// ================================================================
// FUNÇÕES
// ================================================================

function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message\n";
    file_put_contents(LOG_FILE, $log_entry, FILE_APPEND);
    echo $log_entry;
}

function generate_html_report($user_name, $weekly_data) {
    $total_treinos = $weekly_data['total_workouts'] ?? 0;
    $total_exercicios = $weekly_data['total_exercises'] ?? 0;
    $duracao_total = $weekly_data['total_duration'] ?? 0;
    $muscle_groups = $weekly_data['muscle_groups'] ?? [];
    
    $muscle_groups_html = '';
    foreach ($muscle_groups as $group) {
        $muscle_groups_html .= "<li>$group</li>";
    }
    
    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TrainLog - Seu Resumo da Semana</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            padding: 40px 20px;
            color: #1f2937;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
        }
        .header {
            background-color: #ffffff;
            color: #1f2937;
            padding: 30px 20px 20px;
            text-align: center;
            border-bottom: 1px solid #f3f4f6;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 5px;
            color: #111827;
        }
        .header p {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        .header-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background-color: #ecfdf5;
            border-radius: 12px;
            color: #27AE60;
            font-size: 24px;
            margin-bottom: 12px;
        }
        .content {
            padding: 30px 40px;
        }
        .greeting {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 25px;
            color: #374151;
        }
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 30px 0;
        }
        .stat-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            transition: all 0.2s;
        }
        .stat-box .number {
            font-size: 24px;
            font-weight: 800;
            color: #27AE60;
        }
        .stat-box .label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin: 25px 0;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
        }
        .section h2 {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section ul {
            list-style: none;
            padding-left: 0;
        }
        .section li {
            padding: 8px 0;
            color: #4b5563;
            font-size: 15px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #f3f4f6;
        }
        .section li:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .cta {
            text-align: center;
            margin: 35px 0 10px;
        }
        .cta-button {
            background-color: #27AE60;
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(39, 174, 96, 0.2);
        }
        .cta-button:hover {
            background-color: #219150;
        }
        .footer {
            background: #f9fafb;
            padding: 25px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 6px 0;
        }
        .footer a {
            color: #27AE60;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-logo">🏋️</div>
            <h1>TrainLog</h1>
            <p>Relatório Semanal</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                <p>Oi <strong>$user_name</strong>! 🎉</p>
                <p>Aqui está um resumo da sua semana de treinos:</p>
            </div>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="number">$total_treinos</div>
                    <div class="label">Treinos</div>
                </div>
                <div class="stat-box">
                    <div class="number">$total_exercicios</div>
                    <div class="label">Exercícios</div>
                </div>
                <div class="stat-box">
                    <div class="number">{$duracao_total}min</div>
                    <div class="label">Duração Total</div>
                </div>
            </div>
            
            <div class="section">
                <h2>💪 Grupos Musculares Trabalhados</h2>
                <ul>
                    $muscle_groups_html
                </ul>
            </div>
            
            <div class="cta">
                <p style="margin-bottom: 15px; color: #666;">Confira todos os detalhes no TrainLog:</p>
                <a href="https://trainlog.site/progress" class="cta-button">Ver Meus Progressos</a>
            </div>
            
            <div style="background: #e8f8f5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <p style="font-size: 13px; color: #27AE60;">
                    <strong>💡 Dica:</strong> Continue com a consistência! Cada treino conta. Volte semana que vem para bater novos recordes! 🚀
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>TrainLog</strong> - Seu Diário de Treinos</p>
            <p>Recebeu este e-mail porque optou por receber o relatório semanal.</p>
            <p><a href="https://trainlog.site/settings" style="color: #27AE60; text-decoration: none;">Gerenciar Preferências</a></p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}

function send_email($to_email, $user_name, $html_content) {
    $subject = "TrainLog - Seu Resumo da Semana 📊";
    
    $headers = [
        "MIME-Version: 1.0",
        "Content-type: text/html; charset=UTF-8",
        "From: TrainLog <suporte@trainlog.site>",
        "X-Mailer: TrainLog Cron Service"
    ];
    
    return mail($to_email, $subject, $html_content, implode("\r\n", $headers));
}

// ================================================================
// MAIN LOGIC
// ================================================================

try {
    write_log("========== CRON: Relatório Semanal ==========");
    
    // 1. Carregar usuários do arquivo de cache
    $users_file = __DIR__ . '/users-cache.json';
    $users = file_exists($users_file) ? 
        json_decode(file_get_contents($users_file), true) ?? [] : [];
    
    write_log("📊 Total de usuários: " . count($users));
    
    if (empty($users)) {
        write_log("⚠️ Nenhum usuário encontrado");
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Nenhum usuário para enviar relatório',
            'count' => 0
        ]);
        exit;
    }
    
    // 2. Para cada usuário, buscar dados da semana e enviar
    $sent_count = 0;
    $error_count = 0;
    
    foreach ($users as $user_data) {
        try {
            $user_id = $user_data['uid'] ?? null;
            $user_email = $user_data['email'] ?? null;
            $user_name = $user_data['nome'] ?? 'Usuário';
            $email_notifications = $user_data['emailNotifications'] ?? true;
            
            if (!$email_notifications) {
                write_log("⏭️ Usuário optou por não receber relatórios: $user_id ($user_email)");
                continue;
            }

            if (!$user_email) {
                write_log("⏭️ Usuário sem e-mail: $user_id");
                continue;
            }
            
            // Aqui você precisará fazer uma Firestore query para ter os dados da semana
            // Por agora, usaremos dados mock
            $weekly_data = [
                'total_workouts' => 4,
                'total_exercises' => 24,
                'total_duration' => 240,
                'muscle_groups' => ['Peito 💪', 'Costas 🔙', 'Pernas 🦵']
            ];
            
            // Gerar HTML do e-mail
            $html_content = generate_html_report($user_name, $weekly_data);
            
            // Enviar e-mail
            if (send_email($user_email, $user_name, $html_content)) {
                write_log("✅ E-mail enviado para $user_name ($user_email)");
                
                $sent_count++;
            } else {
                write_log("❌ Falha ao enviar e-mail para $user_email");
                $error_count++;
            }
            
        } catch (Exception $e) {
            write_log("❌ Erro ao processar usuário: " . $e->getMessage());
            $error_count++;
        }
    }
    
    // 4. Log de resumo
    write_log("========== RESUMO ==========");
    write_log("✅ E-mails enviados: $sent_count");
    write_log("❌ Erros: $error_count");
    write_log("=========== FIM ===========\n");
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'sent' => $sent_count,
        'errors' => $error_count,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    write_log("💥 ERRO CRÍTICO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>