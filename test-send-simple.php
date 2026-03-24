<?php
// test-send-simple.php
// Disparo manual de notificação para testes.
// Aceita:
// - ?secret=...&userID=... (usa users-cache.json)
// - ?secret=...&fcmToken=... (ignora cache)

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/api/cron/config.php';
require_once __DIR__ . '/api/cron/firebase-helper.php';

assert_cron_secret();

$userID = isset($_GET['userID']) ? trim((string) $_GET['userID']) : '';
$fcmToken = isset($_GET['fcmToken']) ? trim((string) $_GET['fcmToken']) : '';

if ($fcmToken === '' && $userID === '') {
    http_response_code(400);
    exit("❌ Informe userID ou fcmToken\n");
}

if ($fcmToken === '') {
    $cacheFile = __DIR__ . '/api/cron/users-cache.json';

    if (!file_exists($cacheFile)) {
        http_response_code(404);
        exit("❌ Cache não existe. Execute sync primeiro em /api/cron/sync-users.php?secret=SEU_SECRET\n");
    }

    $users = json_decode((string) file_get_contents($cacheFile), true);
    if (!is_array($users)) {
        http_response_code(500);
        exit("❌ users-cache.json inválido\n");
    }

    foreach ($users as $user) {
        if (($user['id'] ?? '') === $userID && !empty($user['fcmToken'])) {
            $fcmToken = (string) $user['fcmToken'];
            break;
        }
    }

    if ($fcmToken === '') {
        http_response_code(404);
        exit("❌ Usuário não encontrado no cache ou sem fcmToken\n");
    }
}

try {
    $helper = new FirebaseHelper(FIREBASE_CREDS_PATH);
    $accessToken = $helper->get_access_token();

    $result = $helper->send_notification(
        $fcmToken,
        '🧪 Teste de Notificação',
        'Se você recebeu isso, o push está funcionando!',
        ['action' => 'manual_test'],
        $accessToken
    );

    echo "✅ Notificação enviada com sucesso\n";
    echo "Message ID: " . ($result['name'] ?? 'N/A') . "\n";
    if ($userID !== '') {
        echo "UserID: $userID\n";
    }
} catch (Exception $e) {
    http_response_code(500);
    echo "❌ Erro ao enviar notificação\n";
    echo $e->getMessage() . "\n";
}
