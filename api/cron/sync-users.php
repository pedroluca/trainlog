<?php
// api/cron/sync-users.php
// Sincroniza usuários com FCM tokens do Firestore

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/firebase-helper.php';

assert_cron_secret();

$logger = new CronLogger(__DIR__ . '/sync-users.log');
$logger->log('🔄 Iniciando sincronização de usuários...');

try {
    $helper = new FirebaseHelper(FIREBASE_CREDS_PATH);
    $accessToken = $helper->get_access_token();
    
    // Query: buscar todos os usuarios com fcmToken
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => FIRESTORE_DB_URL . '/databases/(default)/documents/usuarios?pageSize=1000',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Firestore query failed: $response");
    }
    
    $data = json_decode($response, true);
    $users = [];
    
    foreach ($data['documents'] ?? [] as $doc) {
        $id = basename($doc['name']);
        $fcmToken = $doc['fields']['fcmToken']['stringValue'] ?? null;
        
        if ($fcmToken) {
            $users[] = [
                'id' => $id,
                'fcmToken' => $fcmToken,
                'synced_at' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    // Salvar em cache
    file_put_contents(__DIR__ . '/users-cache.json', json_encode($users, JSON_PRETTY_PRINT));
    
    $logger->log("✅ Sincronização concluída: " . count($users) . " usuários com token");
    echo json_encode(['success' => true, 'count' => count($users)]);
    
} catch (Exception $e) {
    $logger->error("Erro na sincronização: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>