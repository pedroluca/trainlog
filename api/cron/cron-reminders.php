<?php
/**
 * TrainLog - Cron Job para Lembretes de Treino
 * 
 * Função: Enviar notificações push para usuários que ainda não adicionaram treino hoje
 * Frequência: A cada 6 horas (0:00, 6:00, 12:00, 18:00)
 * 
 * Setup no hPanel/cPanel:
 * URL: https://seu-dominio.com/api/cron/cron-reminders.php
 * Comando: wget -q -O-  https://seu-dominio.com/api/cron/cron-reminders.php
 * 
 * Requisitos:
 * 1. firebase-credentials.json deve estar em /home/seu-usuario/firebase-credentials.json (fora de public_html)
 * 2. Google Cloud Messaging API habilitada no Firebase
 * 3. Permissões de arquivo (chmod 600) para firebase-credentials.json
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// ================================================================
// CONFIGURAÇÃO
// ================================================================

// Caminhos
define('FIREBASE_CREDENTIALS_PATH', FIREBASE_CREDS_PATH);
define('LOG_FILE', __DIR__ . '/cron-reminders.log');

// Proteção de acesso
assert_cron_secret();

// ================================================================
// FUNÇÕES AUXILIARES
// ================================================================

function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message\n";
    file_put_contents(LOG_FILE, $log_entry, FILE_APPEND);
    echo $log_entry;
}

function get_firebase_access_token($credentials_path) {
    if (!file_exists($credentials_path)) {
        throw new Exception("Arquivo de credenciais não encontrado: $credentials_path");
    }
    
    $credentials = json_decode(file_get_contents($credentials_path), true);
    if (!$credentials) {
        throw new Exception("Erro ao decodificar credenciais JSON");
    }
    
    $project_id = $credentials['project_id'] ?? null;
    $private_key = $credentials['private_key'] ?? null;
    $client_email = $credentials['client_email'] ?? null;
    
    if (!$project_id || !$private_key || !$client_email) {
        throw new Exception("Credenciais incompletas no JSON");
    }
    
    // JWT Header
    $header = json_encode([
        'alg' => 'RS256',
        'typ' => 'JWT'
    ]);
    
    // JWT Payload
    $now = time();
    $payload = json_encode([
        'iss' => $client_email,
        'sub' => $client_email,
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/cloud-platform'
    ]);
    
    // Encode base64url
    $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    
    // Sign
    $signature_input = "$header_encoded.$payload_encoded";
    openssl_sign($signature_input, $signature, $private_key, 'SHA256');
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    $jwt = "$signature_input.$signature_encoded";
    
    // Request token
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://oauth2.googleapis.com/token',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200) {
        throw new Exception("Erro ao obter token: HTTP $http_code - $response");
    }
    
    $token_data = json_decode($response, true);
    return $token_data['access_token'] ?? null;
}

function send_fcm_notification($fcm_token, $title, $body, $project_id, $access_token, $data = []) {
    $message = [
        'token' => $fcm_token,
        'notification' => [
            'title' => $title,
            'body' => $body
        ],
        'webpush' => [
            'fcm_options' => [
                'link' => '/'
            ],
            'notification' => [
                'title' => $title,
                'body' => $body,
                'clickAction' => '/',
                'badge' => '/favicon-96x96.png'
            ]
        ],
        'android' => [
            'notification' => [
                'title' => $title,
                'body' => $body,
                'clickAction' => '/'
            ]
        ],
        'apns' => [
            'payload' => [
                'aps' => [
                    'alert' => [
                        'title' => $title,
                        'body' => $body
                    ],
                    'badge' => 1,
                    'sound' => 'default'
                ]
            ]
        ]
    ];
    
    if (!empty($data)) {
        $message['data'] = $data;
    }
    
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
    
    if ($http_code !== 200) {
        throw new Exception("FCM Error (HTTP $http_code): $response");
    }
    
    return json_decode($response, true);
}

// ================================================================
// MAIN LOGIC
// ================================================================

try {
    write_log("========== CRON: Lembretes de Treino ==========");
    
    // 1. Obter token de acesso do Firebase
    write_log("🔐 Obtendo token de acesso Firebase...");
    $credentials_path = FIREBASE_CREDENTIALS_PATH;
    $access_token = get_firebase_access_token($credentials_path);
    if (!$access_token) {
        throw new Exception("Falha ao obter access token");
    }
    write_log("✅ Access token obtido com sucesso");
    
    // 2. Verificar se há um arquivo de credenciais com o project_id
    $credentials = json_decode(file_get_contents($credentials_path), true);
    $project_id = $credentials['project_id'];
    write_log("📦 Project ID: $project_id");
    
    // 3. Buscar usuários com fcmToken (via REST API do Firestore)
    write_log("📥 Buscando usuários com FCM Token...");
    
    // Para isso, você precisará de uma Cloud Function ou fazer manualmente
    // POR AGORA: Você terá um arquivo de configuração com os usuários/tokens em JSON
    // Ou fazer uma chamada HTTP para seu backend que retorna essa lista
    
    // Solução simples: Carregar de um arquivo de configuração
    $users_file = __DIR__ . '/users-cache.json';
    
    if (!file_exists($users_file)) {
        write_log("⚠️ Arquivo de cache de usuários não encontrado. Criando operação de sincronização...");
        
        // Alternativa: Você pode fazer uma chamada via admin SDK se disponível
        // Por enquanto, vamos documentar que isso precisa ser feito
        $users = [];
    } else {
        $users = json_decode(file_get_contents($users_file), true) ?: [];
    }
    
    write_log("📊 Total de usuários com FCM: " . count($users));
    
    // 4. Iterar sobre usuários e enviar notificações para quem NÃO treinou hoje
    $sent_count = 0;
    $error_count = 0;
    
    foreach ($users as $user_data) {
        $user_id = $user_data['uid'] ?? null;
        $fcm_token = $user_data['fcmToken'] ?? null;
        $user_name = $user_data['nome'] ?? 'Usuário';
        
        if (!$user_id || !$fcm_token) {
            continue;
        }
        
        try {
            // Verificar se o usuário tem treino registrado hoje
            // Para isso, você precisaria chamar a Firestore REST API
            // ou ter um arquivo de cache com os treinos de hoje
            
            $today = date('Y-m-d');
            $treino_file = __DIR__ . "/treinos-$today.json";
            
            // Se não existe arquivo dos treinos de hoje, suponha que ninguém treinou
            // (situação inicial do dia)
            $treinos_hoje = file_exists($treino_file) ? 
                json_decode(file_get_contents($treino_file), true) ?? [] : [];
            
            // Se este usuário não está na lista de treinos de hoje, enviar notificação
            if (!in_array($user_id, array_column($treinos_hoje, 'uid') ?? [])) {
                $title = "Hora do Treino! 💪";
                $body = "Ei $user_name, não registramos seu treino hoje. Vamos começar?";
                
                $result = send_fcm_notification(
                    $fcm_token,
                    $title,
                    $body,
                    $project_id,
                    $access_token,
                    ['action' => 'open_training']
                );
                
                write_log("✅ Notificação enviada para $user_name ($user_id)");
                $sent_count++;
            } else {
                write_log("⏭️ $user_name já treinou hoje");
            }
        } catch (Exception $e) {
            write_log("❌ Erro ao enviar notificação para $user_id: " . $e->getMessage());
            $error_count++;
        }
    }
    
    // 5. Log de resumo
    write_log("========== RESUMO ==========");
    write_log("✅ Notificações enviadas: $sent_count");
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