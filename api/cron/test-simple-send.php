<?php
/**
 * Tractus - Disparo manual de push para teste (navegador/curl ou painel admin do web)
 *
 * Parâmetros (GET):
 * - secret: CRON_SECRET (ou PUSH_SECRET, que é o que o painel admin usa)
 * - external_id: UID do Firebase (alcança todos os aparelhos do usuário), ou
 * - subscription_id: um aparelho específico do OneSignal
 * - title, body, url, icon: opcionais
 *
 * A resposta diz se algum aparelho recebeu ("delivered") e, se não, o motivo que o OneSignal deu.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

assert_cron_secret(true);

function json_response(int $status_code, array $payload): void {
    http_response_code($status_code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$external_id = trim((string) ($_GET['external_id'] ?? ''));
$subscription_id = trim((string) ($_GET['subscription_id'] ?? ''));
$title = trim((string) ($_GET['title'] ?? 'Teste de notificação'));
$body = trim((string) ($_GET['body'] ?? 'Se você está vendo isso, o push está funcionando.'));
$url = trim((string) ($_GET['url'] ?? rtrim(APP_BASE_URL, '/') . '/train'));
$icon = trim((string) ($_GET['icon'] ?? ''));

if ($external_id === '' && $subscription_id === '') {
    json_response(400, [
        'status' => 'error',
        'message' => 'Informe external_id ou subscription_id.'
    ]);
}

$target = $external_id !== '' ? ['external_ids' => [$external_id]] : ['subscription_ids' => [$subscription_id]];
$request_target = [
    'external_id' => $external_id ?: null,
    'subscription_id' => $external_id === '' ? $subscription_id : null
];

try {
    $result = onesignal_send($target, $title, $body, $url, [
        'large_icon' => $icon,
        'data' => ['source' => 'test-simple-send', 'sentAt' => date('c')],
    ]);
} catch (Exception $e) {
    json_response(500, [
        'status' => 'error',
        'message' => $e->getMessage(),
        'request_target' => $request_target
    ]);
}

json_response(200, [
    'status' => $result['delivered'] ? 'success' : 'not_delivered',
    'message' => $result['delivered']
        ? 'Notificação enviada.'
        : 'O OneSignal aceitou o pedido, mas nenhum aparelho recebeu.',
    'notification_id' => $result['id'],
    'reason' => $result['reason'],
    'request_target' => $request_target
]);
