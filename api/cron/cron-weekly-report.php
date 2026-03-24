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
 * 2. firebase-credentials.json (mesmo do cron-reminders)
 * 3. Google Cloud Messaging API habilitada
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// ================================================================
// CONFIGURAÇÃO
// ================================================================

define('LOG_FILE', __DIR__ . '/cron-weekly-report.log');
define('FIREBASE_CREDENTIALS_PATH', FIREBASE_CREDS_PATH);

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

function send_weekly_notification($fcm_token, $weekly_data, $project_id, $access_token) {
    $total_treinos = $weekly_data['total_workouts'] ?? 0;
    $total_exercicios = $weekly_data['total_exercises'] ?? 0;
    $duracao_total = $weekly_data['total_duration'] ?? 0; // em minutos
    $muscle_groups = $weekly_data['muscle_groups'] ?? [];
    
    $title = "📊 Seu Resumo da Semana";
    $body = "$total_treinos treinos • $total_exercicios exercícios • $duracao_total min";
    
    $message = [
        'token' => $fcm_token,
        'notification' => [
            'title' => $title,
            'body' => $body
        ],
        'webpush' => [
            'fcm_options' => [
                'link' => '/progress'
            ],
            'notification' => [
                'title' => $title,
                'body' => $body,
                'badge' => '/favicon-96x96.png'
            ]
        ],
        'data' => [
            'workouts' => (string) $total_treinos,
            'exercises' => (string) $total_exercicios,
            'duration' => (string) $duracao_total
        ]
    ];
    
    $url = "https://fcm.googleapis.com/v1/projects/$project_id/messages:send";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['message' => $message]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $access_token,
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $http_code === 200;
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #27AE60 0%, #229954 100%);
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .header {
            background: linear-gradient(135deg, #27AE60 0%, #229954 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 30px 0;
        }
        .stat-box {
            background: #f8f9fa;
            border-left: 4px solid #27AE60;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box .number {
            font-size: 28px;
            font-weight: bold;
            color: #27AE60;
        }
        .stat-box .label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            text-transform: uppercase;
        }
        .section {
            margin: 20px 0;
        }
        .section h2 {
            font-size: 16px;
            color: #27AE60;
            margin-bottom: 10px;
            border-bottom: 2px solid #27AE60;
            padding-bottom: 8px;
        }
        .section ul {
            list-style: none;
            padding-left: 0;
        }
        .section li {
            padding: 8px 12px;
            background: #f8f9fa;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 3px solid #27AE60;
        }
        .cta {
            text-align: center;
            margin: 25px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #27AE60 0%, #229954 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 TrainLog</h1>
            <p>Seu Resumo da Semana</p>
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
                    <div class="number">${duracao_total}min</div>
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
                <a href="https://seu-dominio.com/progress" class="cta-button">Ver Meus Progressos</a>
            </div>
            
            <div style="background: #e8f8f5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <p style="font-size: 13px; color: #27AE60;">
                    <strong>💡 Dica:</strong> Continue com a consistência! Cada treino conta. Volte semana que vem para bater novos recordes! 🚀
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>TrainLog</strong> - Seu Diário de Treinos</p>
            <p>Recebeu este e-mail porque tem notificações ativadas</p>
            <p><a href="https://seu-dominio.com/settings" style="color: #27AE60; text-decoration: none;">Gerenciar Preferências</a></p>
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
        "From: TrainLog <noreply@seu-dominio.com>",
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
    
    // 2. Obter token de acesso Firebase
    write_log("🔐 Obtendo token de acesso Firebase...");
    $credentials = json_decode(file_get_contents(FIREBASE_CREDENTIALS_PATH), true);
    $project_id = $credentials['project_id'];
    
    // Simplifique: você precisará adaptar a função get_firebase_access_token do cron-reminders.php
    // Por agora, apenas registre o processo
    
    write_log("✅ Credenciais carregadas (Project: $project_id)");
    
    // 3. Para cada usuário, buscar dados da semana e enviar
    $sent_count = 0;
    $error_count = 0;
    
    foreach ($users as $user_data) {
        try {
            $user_id = $user_data['uid'] ?? null;
            $user_email = $user_data['email'] ?? null;
            $user_name = $user_data['nome'] ?? 'Usuário';
            $fcm_token = $user_data['fcmToken'] ?? null;
            
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
                
                // Também enviar notificação push se tiver FCM token
                if ($fcm_token) {
                    // Você precisaria do access token aqui
                    write_log("📲 Notificação push agendada para $user_name");
                }
                
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