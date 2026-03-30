<?php
// api/cron/sync-users.php
// Sincroniza usuários do Firestore para cache local (sem FCM)

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

assert_cron_secret();

define('LOG_FILE', __DIR__ . '/sync-users.log');

function write_log($message) {
    $timestamp = date('Y-m-d H:i:s');
    $entry = "[$timestamp] $message\n";
    file_put_contents(LOG_FILE, $entry, FILE_APPEND);
}

write_log('Iniciando sincronizacao de usuarios...');

try {
    $accessToken = get_firestore_access_token(FIREBASE_CREDS_PATH);
    
    // Query: buscar todos os usuários
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
        $nome = $doc['fields']['nome']['stringValue'] ?? 'Usuário';
        $email = $doc['fields']['email']['stringValue'] ?? null;
        $lastWorkoutDate = $doc['fields']['lastWorkoutDate']['stringValue'] ?? null;

        $users[] = [
            'id' => $id,
            'uid' => $id,
            'nome' => $nome,
            'email' => $email,
            'oneSignalPlayerId' => $doc['fields']['oneSignalPlayerId']['stringValue'] ?? null,
            'oneSignalSubscriptionId' => $doc['fields']['oneSignalSubscriptionId']['stringValue'] ?? null,
            'lastWorkoutDate' => $lastWorkoutDate,
            'emailNotifications' => isset($doc['fields']['emailNotifications']['booleanValue']) ? $doc['fields']['emailNotifications']['booleanValue'] : true,
            'synced_at' => date('Y-m-d H:i:s')
        ];
    }
    
    // Salvar em cache
    file_put_contents(__DIR__ . '/users-cache.json', json_encode($users, JSON_PRETTY_PRINT));
    
    write_log('Sincronizacao concluida: ' . count($users) . ' usuarios');
    echo json_encode(['success' => true, 'count' => count($users)]);
    
} catch (Exception $e) {
    write_log('Erro na sincronizacao: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>