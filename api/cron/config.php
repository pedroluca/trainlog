<?php
// api/cron/config.php

// Caminho das credenciais (fora do public_html por segurança)
define('FIREBASE_CREDS_PATH', '/home/u428622816/domains/trainlog.site/firebase/firebase-credentials.json');

// Project ID
define('PROJECT_ID', 'trainlog-ae8e6');

// URL base do app PWA (destino ao clicar nas notificações)
define('APP_BASE_URL', 'https://app.trainlog.site');

// OneSignal (use variáveis de ambiente no servidor para produção)
define('ONESIGNAL_APP_ID', getenv('ONESIGNAL_APP_ID') ?: '8ed67be0-8667-4b08-95d5-72886f675e27');
define('ONESIGNAL_REST_API_KEY', getenv('ONESIGNAL_REST_API_KEY') ?: 'os_v2_app_r3lhxyegm5fqrfovokeg6z26e7lgonlbbyaeq3fsz5hmfjyvuu2ripoujf74ar36f37af4nf3rluydl75osxbay2kwc643e6evutj7i');

// CRON_SECRET para segurança (pode copiar qualquer string aleatória)
define('CRON_SECRET', 'tlg_2ab6ApP7sc1SE_BKyuem_zag7Z7');

// Firestore Database URL
define('FIRESTORE_DB_URL', 'https://firestore.googleapis.com/v1/projects/trainlog-ae8e6');

function get_request_secret() {
	$secret = $_GET['secret'] ?? ($_SERVER['HTTP_X_CRON_SECRET'] ?? '');
	return trim(rawurldecode((string) $secret));
}

function assert_cron_secret() {
	$expected = trim((string) CRON_SECRET);
	$provided = get_request_secret();

	if (!hash_equals($expected, $provided)) {
		http_response_code(403);
		header('Content-Type: application/json');
		exit(json_encode(['error' => 'Invalid secret']));
	}
}
?>