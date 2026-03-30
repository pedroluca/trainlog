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

function fetch_weekly_logs($access_token, $user_id) {
    if (!$access_token || !$user_id) return [];

    $query = [
        "structuredQuery" => [
            "from" => [ ["collectionId" => "logs"] ],
            "where" => [
                "fieldFilter" => [
                    "field" => ["fieldPath" => "usuarioID"],
                    "op" => "EQUAL",
                    "value" => ["stringValue" => $user_id]
                ]
            ],
            // Limite seguro que abrange 7 dias na grande maioria dos casos
            "limit" => 1000
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => FIRESTORE_DB_URL . '/databases/(default)/documents:runQuery',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($query),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $access_token,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        write_log("Falha ao buscar logs (HTTP $http_code)");
        return [];
    }

    $results = json_decode((string) $response, true);
    if (!is_array($results)) return [];

    $seven_days_ago = strtotime('-7 days');
    
    $filtered_logs = [];
    foreach ($results as $item) {
        if (!isset($item['document']['fields'])) continue;
        
        $doc = $item['document']['fields'];
        $data_str = $doc['data']['stringValue'] ?? '';
        $log_timestamp = strtotime($data_str);
        
        if ($log_timestamp && $log_timestamp >= $seven_days_ago) {
            $titulo = $doc['titulo']['stringValue'] ?? 'Exercício';
            $series = $doc['series']['integerValue'] ?? $doc['series']['stringValue'] ?? $doc['series']['doubleValue'] ?? 0;
            $repeticoes = $doc['repeticoes']['integerValue'] ?? $doc['repeticoes']['stringValue'] ?? $doc['repeticoes']['doubleValue'] ?? 0;
            
            $filtered_logs[] = [
                'titulo' => $titulo,
                'data' => substr($data_str, 0, 10),
                'series' => (int)$series,
                'repeticoes' => (int)$repeticoes
            ];
        }
    }
    
    return $filtered_logs;
}

function generate_html_report($user_name, $weekly_data) {
    $total_treinos = $weekly_data['total_workouts'] ?? 0;
    $total_exercicios = $weekly_data['total_exercises'] ?? 0;
    $duracao_total = $weekly_data['total_duration'] ?? 0;
    $top_exercises = $weekly_data['top_exercises'] ?? [];
    
    $top_exercises_html = '';
    foreach ($top_exercises as $ex) {
        $top_exercises_html .= "<li>🔥 $ex</li>";
    }
    
    $html = <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrainLog - Seu Resumo da Semana</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px; border-bottom: 1px solid #f3f4f6;">
                            <img src="https://app.trainlog.site/icon-192.png" alt="TrainLog Logo" width="60" height="60" style="display: block; margin: 0 auto 15px; border-radius: 14px;">
                            <h1 style="margin: 0 0 5px; font-size: 24px; font-weight: 800; color: #111827;">TrainLog</h1>
                            <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 500;">Relatório Semanal</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px; font-size: 16px; color: #374151;">Oi <strong>$user_name</strong>! 🎉</p>
                                        <p style="margin: 0 0 25px; font-size: 16px; color: #374151; line-height: 1.5;">Aqui está um resumo da sua semana de treinos:</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Stats Grid -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px;">
                                <tr>
                                    <td width="31%" align="center" style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: 800; color: #27AE60; margin-bottom: 4px;">$total_treinos</div>
                                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Treinos</div>
                                    </td>
                                    <td width="3%">&nbsp;</td>
                                    <td width="32%" align="center" style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: 800; color: #27AE60; margin-bottom: 4px;">$total_exercicios</div>
                                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Exercícios</div>
                                    </td>
                                    <td width="3%">&nbsp;</td>
                                    <td width="31%" align="center" style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: 800; color: #27AE60; margin-bottom: 4px;">{$duracao_total}m</div>
                                        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Duração</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Muscle Groups -->
                            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h2 style="margin: 0 0 15px; font-size: 15px; font-weight: 700; color: #111827;">Exercícios em Destaque</h2>
                                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8; list-style-type: none; margin-left: -20px;">
                                    $top_exercises_html
                                </ul>
                            </div>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">Confira todos os detalhes e gráficos no TrainLog:</p>
                                        <a href="https://app.trainlog.site/progress" style="background-color: #27AE60; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">Ver Meus Progressos</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <!-- Tip -->
                                        <div style="background-color: #ecfdf5; border-left: 4px solid #27AE60; padding: 15px; border-radius: 0 4px 4px 0;">
                                            <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
                                                <strong>💡 Dica:</strong> Continue com a consistência! Cada treino conta. Volte semana que vem para bater novos recordes! 🚀
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f9fafb; padding: 25px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;"><strong>TrainLog</strong> - Seu Diário de Treinos 💪</p>
                            <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">Você recebeu este e-mail porque ativou o relatório semanal.</p>
                            <p style="margin: 0;"><a href="https://app.trainlog.site/profile/settings" style="color: #27AE60; text-decoration: none; font-size: 12px; font-weight: 600;">Gerenciar Preferências</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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
    
    $test_email = filter_input(INPUT_GET, 'test_email', FILTER_VALIDATE_EMAIL);
    if ($test_email) {
        write_log("🧪 Modo de TESTE ativado para: $test_email");
    }

    $access_token = get_firestore_access_token(FIREBASE_CREDS_PATH);
    if (!$access_token) {
        throw new Exception('Não foi possível obter token de acesso do Firestore.');
    }

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
            
            // Modo de teste: pula todos que não sejam o email de teste
            if ($test_email && $user_email !== $test_email) {
                continue;
            }

            if (!$email_notifications) {
                write_log("⏭️ Usuário optou por não receber relatórios: $user_id ($user_email)");
                continue;
            }

            if (!$user_email) {
                write_log("⏭️ Usuário sem e-mail: $user_id");
                continue;
            }
            
            // Resgatar dados reais dos logs do Firestore
            $weekly_logs = fetch_weekly_logs($access_token, $user_id);
            
            if (empty($weekly_logs)) {
                write_log("⏭️ Usuário sem atividades na última semana: $user_id ($user_email)");
                continue;
            }

            // Processar dados dos logs
            $unique_dates = [];
            $exercise_counts = [];
            
            foreach ($weekly_logs as $log) {
                // Contar datas únicas (treinos)
                $unique_dates[$log['data']] = true;
                
                // Contar frequência dos exercícios
                $title = mb_convert_case(trim($log['titulo']), MB_CASE_TITLE, "UTF-8");
                if (!isset($exercise_counts[$title])) $exercise_counts[$title] = 0;
                $exercise_counts[$title]++;
            }
            
            arsort($exercise_counts);
            $top_exercises = array_slice(array_keys($exercise_counts), 0, 3);
            if (empty($top_exercises)) $top_exercises = ["Nenhum exercício"];

            $weekly_data = [
                'total_workouts' => count($unique_dates),
                'total_exercises' => count($weekly_logs),
                // Estimativa simples: cada exercício finalizado = ~8min
                'total_duration' => count($weekly_logs) * 8, 
                'top_exercises' => $top_exercises
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