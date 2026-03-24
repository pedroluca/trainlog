<?php
/**
 * TrainLog - Script de Teste de FCM e Notificações
 * 
 * Uso: 
 * curl https://seu-dominio.com/api/cron/test-fcm.php?secret=seu-secret&test=full
 * 
 * Testes disponíveis:
 * ?test=jwt         - Testa geração de JWT
 * ?test=token       - Testa obtenção de access token
 * ?test=credentials - Testa arquivo de credenciais
 * ?test=fcm         - Testa envio de notificação (requer fcmToken na query)
 * ?test=full        - Executa todos os testes
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/firebase-helper.php';

define('FIREBASE_CREDENTIALS_PATH', FIREBASE_CREDS_PATH);

$test_type = $_GET['test'] ?? 'full';

// Proteção
assert_cron_secret();

$results = [];
$success_count = 0;
$error_count = 0;

// ================================================================
// Teste 1: Verificar Arquivo de Credenciais
// ================================================================
if ($test_type === 'full' || $test_type === 'credentials') {
    try {
        if (!file_exists(FIREBASE_CREDENTIALS_PATH)) {
            throw new Exception("Arquivo não encontrado: " . FIREBASE_CREDENTIALS_PATH);
        }
        
        $creds = json_decode(file_get_contents(FIREBASE_CREDENTIALS_PATH), true);
        if (!$creds) {
            throw new Exception("JSON inválido");
        }
        
        if (empty($creds['project_id']) || empty($creds['private_key']) || empty($creds['client_email'])) {
            throw new Exception("Credenciais incompletas");
        }
        
        $results['credentials'] = [
            'status' => 'success',
            'file_exists' => true,
            'project_id' => $creds['project_id'],
            'service_account' => $creds['client_email'],
            'valid' => true
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['credentials'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
    }
}

// ================================================================
// Teste 2: Inicializar Firebase Helper
// ================================================================
if ($test_type === 'full' || $test_type === 'jwt' || $test_type === 'token' || $test_type === 'fcm') {
    try {
        $firebase = new FirebaseHelper(FIREBASE_CREDENTIALS_PATH);
        $results['firebase_helper'] = [
            'status' => 'success',
            'initialized' => true,
            'project_id' => $firebase->get_project_id()
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['firebase_helper'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
        
        // Se falhar aqui, não posso testar os próximos
        if ($test_type !== 'full') {
            http_response_code(200);
            echo json_encode([
                'test' => $test_type,
                'results' => $results,
                'summary' => ['success' => $success_count, 'errors' => $error_count]
            ]);
            exit;
        }
    }
}

// ================================================================
// Teste 3: Obter Access Token
// ================================================================
if (($test_type === 'full' || $test_type === 'token' || $test_type === 'fcm') && isset($firebase)) {
    try {
        $access_token = $firebase->get_access_token();
        if (!$access_token) {
            throw new Exception("Token vazio");
        }
        
        // Validar formato (deve ser longo)
        if (strlen($access_token) < 100) {
            throw new Exception("Token com formato inválido (muito curto)");
        }
        
        $results['access_token'] = [
            'status' => 'success',
            'obtained' => true,
            'token_length' => strlen($access_token),
            'token_preview' => substr($access_token, 0, 20) . '...' . substr($access_token, -10),
            'expires_in' => 3600
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['access_token'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
    }
}

// ================================================================
// Teste 4: Enviar Notificação de Teste
// ================================================================
if (($test_type === 'full' || $test_type === 'fcm') && isset($firebase)) {
    try {
        $fcm_token = $_GET['fcm_token'] ?? null;
        
        if (!$fcm_token) {
            throw new Exception("Parâmetro 'fcm_token' é obrigatório para este teste");
        }
        
        $access_token = $firebase->get_access_token();
        
        // Enviar notificação de teste
        $result = $firebase->send_notification(
            $fcm_token,
            "🧪 Teste TrainLog",
            "Se você recebeu esta notificação, o FCM está funcionando!",
            ['action' => 'test'],
            $access_token
        );
        
        $results['send_notification'] = [
            'status' => 'success',
            'sent' => true,
            'fcm_response' => $result,
            'message' => 'Notificação enviada com sucesso! Verifique seu dispositivo'
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['send_notification'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
            'hint' => 'Verificar se o FCM token é válido e não expirou'
        ];
        $error_count++;
    }
}

// ================================================================
// Teste 5: Cache de Usuários
// ================================================================
if ($test_type === 'full' || $test_type === 'cache') {
    try {
        $cache_file = __DIR__ . '/users-cache.json';
        
        if (!file_exists($cache_file)) {
            $results['users_cache'] = [
                'status' => 'warning',
                'file_exists' => false,
                'message' => 'Arquivo de cache ainda não foi criado',
                'hint' => 'Execute sync-users.js para criar'
            ];
        } else {
            $cache_data = json_decode(file_get_contents($cache_file), true);
            
            if (!is_array($cache_data)) {
                throw new Exception("Cache JSON inválido");
            }
            
            $users_with_fcm = count(array_filter($cache_data, fn($u) => !empty($u['fcmToken'])));
            
            $results['users_cache'] = [
                'status' => 'success',
                'file_exists' => true,
                'total_users' => count($cache_data),
                'users_with_fcm' => $users_with_fcm,
                'size_bytes' => filesize($cache_file),
                'last_modified' => date('Y-m-d H:i:s', filemtime($cache_file))
            ];
            $success_count++;
        }
    } catch (Exception $e) {
        $results['users_cache'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
    }
}

// ================================================================
// Teste 6: Permissões de Arquivo
// ================================================================
if ($test_type === 'full' || $test_type === 'permissions') {
    try {
        $cron_dir = __DIR__;
        $files_to_check = [
            'firebase-credentials.json' => '/home/seu-usuario/firebase-credentials.json',
            'cron-reminders.php' => __DIR__ . '/cron-reminders.php',
            'firebase-helper.php' => __DIR__ . '/firebase-helper.php',
            'users-cache.json' => __DIR__ . '/users-cache.json'
        ];
        
        $permissions = [];
        foreach ($files_to_check as $name => $path) {
            if (file_exists($path)) {
                $perms = substr(sprintf('%o', fileperms($path)), -4);
                $is_readable = is_readable($path);
                $is_writable = is_writable($path);
                
                $permissions[$name] = [
                    'exists' => true,
                    'permissions' => $perms,
                    'readable' => $is_readable,
                    'writable' => $is_writable,
                    'ok' => $is_readable
                ];
            } else {
                $permissions[$name] = [
                    'exists' => false,
                    'readable' => false,
                    'writable' => false,
                    'ok' => false
                ];
            }
        }
        
        $results['permissions'] = [
            'status' => 'success',
            'files' => $permissions
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['permissions'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
    }
}

// ================================================================
// Teste 7: Logs
// ================================================================
if ($test_type === 'full' || $test_type === 'logs') {
    try {
        $log_files = [
            'cron-reminders.log',
            'cron-weekly-report.log',
            'sync-users.log'
        ];
        
        $logs = [];
        foreach ($log_files as $filename) {
            $path = __DIR__ . '/' . $filename;
            if (file_exists($path)) {
                $lines = count(file($path));
                $last_lines = array_slice(file($path), -5);
                
                $logs[$filename] = [
                    'exists' => true,
                    'lines' => $lines,
                    'size_bytes' => filesize($path),
                    'last_modified' => date('Y-m-d H:i:s', filemtime($path)),
                    'last_5_lines' => array_map('trim', $last_lines)
                ];
            } else {
                $logs[$filename] = [
                    'exists' => false,
                    'message' => 'Arquivo ainda não foi criado'
                ];
            }
        }
        
        $results['logs'] = [
            'status' => 'success',
            'files' => $logs
        ];
        $success_count++;
    } catch (Exception $e) {
        $results['logs'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        $error_count++;
    }
}

// ================================================================
// Resposta Final
// ================================================================

http_response_code(200);
echo json_encode([
    'test_type' => $test_type,
    'timestamp' => date('Y-m-d H:i:s'),
    'results' => $results,
    'summary' => [
        'success' => $success_count,
        'errors' => $error_count,
        'total' => $success_count + $error_count,
        'status' => $error_count === 0 ? '✅ Todos os testes passaram' : "⚠️ $error_count teste(s) falharam"
    ]
], JSON_PRETTY_PRINT);
?>