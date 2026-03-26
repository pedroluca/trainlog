<?php
/**
 * TrainLog - OneSignal manual test trigger
 *
 * Trigger via browser/curl with CRON secret:
 * - Target by external_id (Firebase UID), or
 * - Target by include_subscription_ids
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

assert_cron_secret();

function json_response(int $status_code, array $payload): void {
    http_response_code($status_code);
    echo json_encode($payload);
    exit;
}

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    json_response(500, [
        'status' => 'error',
        'message' => 'OneSignal nao configurado. Defina ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY.'
    ]);
}

$external_id = trim((string) ($_GET['external_id'] ?? ''));
$subscription_id = trim((string) ($_GET['subscription_id'] ?? ''));
$title = trim((string) ($_GET['title'] ?? 'Novo treino 💪'));
$body = trim((string) ($_GET['body'] ?? 'Seu treino de hoje ja esta disponivel'));
$url = trim((string) ($_GET['url'] ?? rtrim(APP_BASE_URL, '/') . '/train'));

if ($external_id === '' && $subscription_id === '') {
    json_response(400, [
        'status' => 'error',
        'message' => 'Informe external_id ou subscription_id.'
    ]);
}

$onesignal_payload = [
    'app_id' => ONESIGNAL_APP_ID,
    'target_channel' => 'push',
    'headings' => ['en' => $title, 'pt' => $title],
    'contents' => ['en' => $body, 'pt' => $body],
    'web_url' => $url,
    'data' => [
        'source' => 'test-simple-send',
        'sentAt' => date('c')
    ]
];

if ($external_id !== '') {
    $onesignal_payload['include_aliases'] = [
        'external_id' => [$external_id]
    ];
}

if ($subscription_id !== '') {
    $onesignal_payload['include_subscription_ids'] = [$subscription_id];
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.onesignal.com/notifications',
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => json_encode($onesignal_payload),
    CURLOPT_HTTPHEADER => [
        'Authorization: Key ' . ONESIGNAL_REST_API_KEY,
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    json_response(500, [
        'status' => 'error',
        'message' => 'Falha cURL ao enviar para OneSignal.',
        'details' => $curl_error
    ]);
}

$decoded_response = json_decode((string) $response, true);

if ($http_code < 200 || $http_code >= 300) {
    json_response($http_code > 0 ? $http_code : 500, [
        'status' => 'error',
        'message' => 'OneSignal retornou erro.',
        'onesignal_response' => $decoded_response ?: $response,
        'request_target' => [
            'external_id' => $external_id ?: null,
            'subscription_id' => $subscription_id ?: null
        ]
    ]);
}

json_response(200, [
    'status' => 'success',
    'message' => 'Notificacao enviada com sucesso.',
    'request_target' => [
        'external_id' => $external_id ?: null,
        'subscription_id' => $subscription_id ?: null
    ],
    'onesignal_response' => $decoded_response ?: $response
]);
