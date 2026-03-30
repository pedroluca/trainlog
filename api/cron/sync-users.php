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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("Falha ao obter access token (HTTP $httpCode): $response");
    }

    $decoded = json_decode((string) $response, true);
    return $decoded['access_token'] ?? null;
}

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