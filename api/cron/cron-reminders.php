<?php
/**
 * Tractus - Cron Job para lembretes via OneSignal
 *
 * Envia push para usuários que têm treino agendado hoje e ainda não treinaram.
 * O envio é pelo UID do Firebase (external_id), que alcança todos os aparelhos do usuário;
 * os ids de aparelho salvos no Firestore só entram como plano B (ver onesignal.php).
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

define('LOG_FILE', __DIR__ . '/cron-reminders.log');

assert_cron_secret();
$debug_mode = (($_GET['debug'] ?? '0') === '1');
$target_user_id = trim((string) ($_GET['user_id'] ?? ''));

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

        // scheduledDays é um array de inteiros (0=Dom, 1=Seg ... 6=Sáb)
        $scheduledDaysRaw = $doc['fields']['scheduledDays']['arrayValue']['values'] ?? [];
        $scheduledDays = array_map(fn($v) => (int)($v['integerValue'] ?? -1), $scheduledDaysRaw);

        $users[] = [
            'id'                     => $id,
            'uid'                    => $id,
            'nome'                   => $doc['fields']['nome']['stringValue'] ?? 'Usuário',
            'lastWorkoutDate'        => $doc['fields']['lastWorkoutDate']['stringValue'] ?? null,
            'scheduledDays'          => $scheduledDays,
            'player_id'              => $doc['fields']['player_id']['stringValue'] ?? null,
            'oneSignalSubscriptionId'=> $doc['fields']['oneSignalSubscriptionId']['stringValue'] ?? null,
            'pushProvider'           => $doc['fields']['pushProvider']['stringValue'] ?? null
        ];
    }

    return $users;
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
    $not_delivered_count = 0;
    $debug_entries = [];

    // Usa fuso horário do Brasil para que a comparação de datas
    // não quebre quando o servidor de cron está em UTC.
    $tz_brazil = new DateTimeZone('America/Sao_Paulo');
    $now_brazil = new DateTime('now', $tz_brazil);
    $today      = $now_brazil->format('Y-m-d');       // ex: "2026-04-24"
    $today_dow  = (int) $now_brazil->format('w');     // 0=Dom, 1=Seg ... 6=Sáb

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

        $user_name         = $user['nome'] ?? 'Usuário';
        $last_workout_date = $user['lastWorkoutDate'] ?? null;
        $scheduled_days    = $user['scheduledDays'] ?? [];
        $player_id         = $user['player_id'] ?? null;
        $provider          = $user['pushProvider'] ?? null;
        $subscription_id   = $user['oneSignalSubscriptionId'] ?? null;

        // ── 1. Verifica se o usuário tem treino agendado para HOJE ──────────
        // Se scheduledDays estiver vazio (campo não existe) deixa passar para
        // não bloquear usuários que ainda não sincronizaram o campo.
        if (!empty($scheduled_days) && !in_array($today_dow, $scheduled_days, true)) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id'       => $user_id,
                    'user_name'     => $user_name,
                    'status'        => 'skipped',
                    'reason'        => 'no_workout_scheduled_today',
                    'today_dow'     => $today_dow,
                    'scheduled_days'=> $scheduled_days
                ];
            }
            continue;
        }

        // ── 2. Verifica se o usuário JÁ treinou hoje ────────────────────────
        if ($last_workout_date === $today) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id'   => $user_id,
                    'user_name' => $user_name,
                    'status'    => 'skipped',
                    'reason'    => 'already_trained_today'
                ];
            }
            continue;
        }

        // ── 3. Verifica se push está configurado ────────────────────────────
        if ($provider !== 'onesignal' && !$player_id && !$subscription_id) {
            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id'   => $user_id,
                    'user_name' => $user_name,
                    'status'    => 'skipped',
                    'reason'    => 'push_not_configured'
                ];
            }
            continue;
        }

        try {
            $result = send_push_to_user(
                $user_id,
                [$subscription_id, $player_id],
                'Hora do Treino! 💪',
                'Ei ' . $user_name . ', não registramos seu treino hoje. Vamos começar?',
                $train_url,
                ['data' => ['action' => 'open_training']]
            );

            if ($result['delivered']) {
                $sent_count++;
                write_log('Push enviado para ' . $user_name . ' (' . $user_id . ')');
            } else {
                // Sem aparelho inscrito (desinstalou, negou a permissão...): não é erro do cron
                $not_delivered_count++;
                write_log('Nenhum aparelho recebeu para ' . $user_name . ' (' . $user_id . '): ' . $result['reason']);
            }

            if ($debug_mode) {
                $debug_entries[] = [
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'status' => $result['delivered'] ? 'sent' : 'not_delivered',
                    'reason' => $result['delivered'] ? 'eligible' : $result['reason'],
                    'onesignal_notification_id' => $result['id']
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
    write_log('Sem aparelho inscrito: ' . $not_delivered_count);
    write_log('Erros: ' . $error_count);
    write_log('=========== FIM ===========\n');

    ping_healthcheck('cron-reminders');

    $response = [
        'status' => 'success',
        'provider' => 'onesignal',
        'sent' => $sent_count,
        'not_delivered' => $not_delivered_count,
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
    ping_healthcheck('cron-reminders', 'fail', $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
