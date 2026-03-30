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
$target_user_id = trim((string) ($_GET['user_id'] ?? ''));
$override_player_id = trim((string) ($_GET['player_id'] ?? ''));

function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $entry = "[$timestamp] $message\n";
    file_put_contents(LOG_FILE, $entry, FILE_APPEND);
    echo $entry;
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
            'player_id' => $doc['fields']['player_id']['stringValue'] ?? null,
            'oneSignalSubscriptionId' => $doc['fields']['oneSignalSubscriptionId']['stringValue'] ?? null,
            'pushProvider' => $doc['fields']['pushProvider']['stringValue'] ?? null
        ];
    }

    return $users;
}

function send_onesignal_notification($user_id, $player_id, $title, $body, $url, $data = []) {
    $payload = [
        'app_id' => ONESIGNAL_APP_ID,
        'target_channel' => 'push',
        'headings' => ['en' => $title, 'pt' => $title],
        'contents' => ['en' => $body, 'pt' => $body],
        'web_url' => $url,
        'data' => $data
    ];

    // Prefer direct device target when Android sends player_id.
    if ($player_id) {
        $payload['include_subscription_ids'] = [$player_id];
    } else {
        $payload['include_aliases'] = [
            'external_id' => [$user_id]
        ];
    }

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

        if ($target_user_id !== '' && $user_id !== $target_user_id) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user['nome'] ?? 'Usuário',
                    'status' => 'skipped',
                    'reason' => 'filtered_by_user_id'
                ];
            }
            continue;
        }

        $user_name = $user['nome'] ?? 'Usuário';
        $last_workout_date = $user['lastWorkoutDate'] ?? null;
        $player_id = $override_player_id !== '' ? $override_player_id : ($user['player_id'] ?? null);
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

        if ($provider !== 'onesignal' && !$player_id && !$subscription_id) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => 'skipped',
                    'reason' => 'push_not_configured'
                ];
            }
            continue;
        }

        try {
            $result = send_onesignal_notification(
                $user_id,
                $player_id,
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
