<?php
// api/cron/config.php

// Caminho das credenciais (fora do public_html por segurança)
define('FIREBASE_CREDS_PATH', '/home/u428622816/domains/trainlog.site/firebase/firebase-credentials.json');

// Project ID
define('PROJECT_ID', 'trainlog-ae8e6');

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