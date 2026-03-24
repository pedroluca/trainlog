<?php
/**
 * TrainLog - Firebase Helper para Cron Jobs
 * 
 * Funções compartilhadas entre os scripts cron
 */

class FirebaseHelper {
    private $credentials;
    private $project_id;
    private $private_key;
    private $client_email;
    
    public function __construct($credentials_path = null) {
        if ($credentials_path === null || $credentials_path === '') {
            if (defined('FIREBASE_CREDS_PATH')) {
                $credentials_path = FIREBASE_CREDS_PATH;
            } else {
                throw new Exception('Caminho de credenciais não informado e FIREBASE_CREDS_PATH não definido');
            }
        }

        if (!file_exists($credentials_path)) {
            throw new Exception("Arquivo de credenciais não encontrado: $credentials_path");
        }
        
        $this->credentials = json_decode(file_get_contents($credentials_path), true);
        if (!$this->credentials) {
            throw new Exception("Erro ao decodificar credenciais JSON");
        }
        
        $this->project_id = $this->credentials['project_id'] ?? null;
        $this->private_key = $this->credentials['private_key'] ?? null;
        $this->client_email = $this->credentials['client_email'] ?? null;
        
        if (!$this->project_id || !$this->private_key || !$this->client_email) {
            throw new Exception("Credenciais incompletas no JSON");
        }
    }
    
    /**
     * Gera um JWT para autenticação com Google Firebase
     */
    private function create_jwt() {
        $header = json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT'
        ]);
        
        $now = time();
        $payload = json_encode([
            'iss' => $this->client_email,
            'sub' => $this->client_email,
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => 'https://www.googleapis.com/auth/cloud-platform'
        ]);
        
        $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        
        $signature_input = "$header_encoded.$payload_encoded";
        openssl_sign($signature_input, $signature, $this->private_key, 'SHA256');
        $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        
        return "$signature_input.$signature_encoded";
    }
    
    /**
     * Obtém token de acesso OAuth2 válido por 1 hora
     */
    public function get_access_token() {
        $jwt = $this->create_jwt();
        
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
            throw new Exception("Erro ao obter token: HTTP $http_code - $response");
        }
        
        $token_data = json_decode($response, true);
        return $token_data['access_token'] ?? null;
    }
    
    /**
     * Envia notificação push via FCM v1 API
     */
    public function send_notification($fcm_token, $title, $body, $data = [], $access_token) {
        $app_link = 'https://trainlog.site/';

        $message = [
            'token' => $fcm_token,
            'notification' => [
                'title' => $title,
                'body' => $body
            ],
            'webpush' => [
                'headers' => [
                    'TTL' => '300',
                    'Urgency' => 'high'
                ],
                'fcm_options' => [
                    'link' => $app_link
                ],
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'icon' => '/web-app-manifest-192x192.png'
                ]
            ],
            'android' => [
                'priority' => 'HIGH',
                'notification' => [
                    'title' => $title,
                    'body' => $body
                ]
            ],
            'apns' => [
                'payload' => [
                    'aps' => [
                        'alert' => [
                            'title' => $title,
                            'body' => $body
                        ],
                        'sound' => 'default'
                    ]
                ]
            ]
        ];
        
        if (!empty($data)) {
            $message['data'] = $data;
        }
        
        $url = "https://fcm.googleapis.com/v1/projects/{$this->project_id}/messages:send";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['message' => $message]),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $access_token,
                'Content-Type: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 200) {
            throw new Exception("FCM Error (HTTP $http_code): $response");
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Query simples no Firestore REST API (para v1alpha é mais simples)
     * Nota: Você precisará do Admin SDK ou usar uma Cloud Function para queries complexas
     */
    public function query_firestore($collection, $field, $operator, $value, $access_token) {
        // Nota: A REST API do Firestore é limitada. Recomenda-se usar Cloud Functions para queries complexas
        // Esta é uma implementação básica para exemplificar
        
        $query = [
            'structuredQuery' => [
                'from' => [['collectionId' => $collection]],
                'where' => [
                    'fieldFilter' => [
                        'field' => ['fieldPath' => $field],
                        'op' => $operator, // EQUAL, GREATER_THAN, LESS_THAN, etc
                        'value' => ['stringValue' => $value]
                    ]
                ]
            ]
        ];
        
        $url = "https://firestore.googleapis.com/v1/projects/{$this->project_id}/databases/(default)/documents:runQuery";
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($query),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $access_token,
                'Content-Type: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 200) {
            throw new Exception("Firestore Query Error: HTTP $http_code");
        }
        
        return json_decode($response, true);
    }
    
    public function get_project_id() {
        return $this->project_id;
    }
}

/**
 * Classe para gerenciar cache de usuários
 */
class UsersCache {
    private $cache_file;
    
    public function __construct($cache_file) {
        $this->cache_file = $cache_file;
    }
    
    public function load() {
        if (!file_exists($this->cache_file)) {
            return [];
        }
        return json_decode(file_get_contents($this->cache_file), true) ?? [];
    }
    
    public function save($users) {
        file_put_contents($this->cache_file, json_encode($users, JSON_PRETTY_PRINT));
    }
    
    public function get_users_with_fcm() {
        $users = $this->load();
        return array_filter($users, fn($u) => !empty($u['fcmToken']));
    }
    
    public function get_users_with_email() {
        $users = $this->load();
        return array_filter($users, fn($u) => !empty($u['email']));
    }
}

/**
 * Simples logger para os cron jobs
 */
class CronLogger {
    private $log_file;
    
    public function __construct($log_file) {
        $this->log_file = $log_file;
    }
    
    public function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] $message\n";
        file_put_contents($this->log_file, $log_entry, FILE_APPEND);
        echo $log_entry;
    }
    
    public function section_start($title) {
        $this->log("========== $title ==========");
    }
    
    public function section_end() {
        $this->log("=========== FIM ===========\n");
    }
    
    public function success($message) {
        $this->log("✅ $message");
    }
    
    public function warning($message) {
        $this->log("⚠️ $message");
    }
    
    public function error($message) {
        $this->log("❌ $message");
    }
    
    public function info($message) {
        $this->log("ℹ️ $message");
    }
}
?>