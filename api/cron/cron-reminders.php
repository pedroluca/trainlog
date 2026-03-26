<?php
/**
 * TrainLog - Cron Job para lembretes via OneSignal
 *
 * Envia push para usuários que não treinaram hoje.
 * Usa include_aliases.external_id = UID do Firebase.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

define('LOG_FILE', __DIR__ . '/cron-reminders.log');

assert_cron_secret();
$debug_mode = (($_GET['debug'] ?? '0') === '1');

function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $entry = "[$timestamp] $message\n";
    file_put_contents(LOG_FILE, $entry, FILE_APPEND);
    echo $entry;
}

function get_firestore_access_token($credentials_path) {
    if (!file_exists($credentials_path)) {
        throw new Exception("Arquivo de credenciais não encontrado: $credentials_path");
    }

    $credentials = json_decode((string) file_get_contents($credentials_path), true);
    if (!$credentials) {
        throw new Exception('Erro ao ler credenciais JSON');
    }

    $private_key = $credentials['private_key'] ?? null;
    $client_email = $credentials['client_email'] ?? null;

    if (!$private_key || !$client_email) {
        throw new Exception('Credenciais incompletas');
    }

    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $now = time();
    $payload = json_encode([
        'iss' => $client_email,
        'sub' => $client_email,
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/cloud-platform'
    ]);

    $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    $signature_input = "$header_encoded.$payload_encoded";

    openssl_sign($signature_input, $signature, $private_key, 'SHA256');
    $jwt = $signature_input . '.' . rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

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
        throw new Exception("Falha ao obter access token Firestore (HTTP $http_code): $response");
    }

    $decoded = json_decode((string) $response, true);
    return $decoded['access_token'] ?? null;
}

function fetch_users_from_firestore($access_token) {
    $url = FIRESTORE_DB_URL . '/databases/(default)/documents/usuarios?pageSize=1000';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
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
        throw new Exception("Falha ao buscar usuários no Firestore (HTTP $http_code): $response");
    }

    $data = json_decode((string) $response, true);
    $users = [];

    foreach ($data['documents'] ?? [] as $doc) {
        $id = basename($doc['name']);
        $users[] = [
            'id' => $id,
            'uid' => $id,
            'nome' => $doc['fields']['nome']['stringValue'] ?? 'Usuário',
            'lastWorkoutDate' => $doc['fields']['lastWorkoutDate']['stringValue'] ?? null,
            'oneSignalSubscriptionId' => $doc['fields']['oneSignalSubscriptionId']['stringValue'] ?? null,
            'pushProvider' => $doc['fields']['pushProvider']['stringValue'] ?? null
        ];
    }

    return $users;
}

function send_onesignal_notification_by_external_id($external_id, $title, $body, $url, $data = []) {
    $payload = [
        'app_id' => ONESIGNAL_APP_ID,
        'target_channel' => 'push',
        'include_aliases' => [
            'external_id' => [$external_id]
        ],
        'headings' => ['en' => $title, 'pt' => $title],
        'contents' => ['en' => $body, 'pt' => $body],
        'url' => $url,
        'web_url' => $url,
        'data' => $data
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.onesignal.com/notifications',
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Key ' . ONESIGNAL_REST_API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode((string) $response, true) ?: [];

    if ($http_code < 200 || $http_code >= 300) {
        throw new Exception('OneSignal error (HTTP ' . $http_code . '): ' . $response);
    }

    return $decoded;
}

try {
    write_log('========== CRON: Lembretes via OneSignal ==========' );

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        throw new Exception('OneSignal não configurado. Defina ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY.');
    }

    $access_token = get_firestore_access_token(FIREBASE_CREDS_PATH);
    if (!$access_token) {
        throw new Exception('Não foi possível obter token de acesso do Firestore.');
    }

    $users = fetch_users_from_firestore($access_token);
    write_log('Usuários lidos do Firestore: ' . count($users));

    $sent_count = 0;
    $error_count = 0;
    $debug_entries = [];
    $today = date('Y-m-d');
    $train_url = rtrim(APP_BASE_URL, '/') . '/train';

    foreach ($users as $user) {
        $user_id = $user['uid'] ?? $user['id'];
        $user_name = $user['nome'] ?? 'Usuário';
        $last_workout_date = $user['lastWorkoutDate'] ?? null;
        $provider = $user['pushProvider'] ?? null;
        $subscription_id = $user['oneSignalSubscriptionId'] ?? null;

        if ($last_workout_date === $today) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'skipped',
                    'reason' => 'already_trained_today'
                ];
            }
            continue;
        }

        if ($provider !== 'onesignal') {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'skipped',
                    'reason' => 'push_provider_not_onesignal'
                ];
            }
            continue;
        }

        if (!$subscription_id) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'skipped',
                    'reason' => 'missing_onesignal_subscription_id'
                ];
            }
            continue;
        }

        try {
            $result = send_onesignal_notification_by_external_id(
                $user_id,
                'Hora do Treino! 💪',
                'Ei ' . $user_name . ', não registramos seu treino hoje. Vamos começar?',
                $train_url,
                ['action' => 'open_training']
            );

            $sent_count++;
            write_log('Push enviado para ' . $user_name . ' (' . $user_id . ')');

            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'sent',
                    'reason' => 'eligible',
                    'onesignal_notification_id' => $result['id'] ?? null
                ];
            }
        } catch (Exception $error) {
            $error_count++;
            write_log('Erro ao enviar para ' . $user_id . ': ' . $error->getMessage());

            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'error',
                    'reason' => $error->getMessage()
                ];
            }
        }
    }

    write_log('========== RESUMO ==========' );
    write_log('Enviadas: ' . $sent_count);
    write_log('Erros: ' . $error_count);
    write_log('=========== FIM ===========\n');

    $response = [
        'status' => 'success',
        'provider' => 'onesignal',
        'sent' => $sent_count,
        'errors' => $error_count,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($debug_mode) {
        $response['debug'] = [
            'entries' => $debug_entries,
            'evaluated_users' => count($debug_entries)
        ];
    }

    echo json_encode($response);
} catch (Exception $e) {
    write_log('ERRO CRÍTICO: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
