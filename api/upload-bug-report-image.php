<?php
/**
 * Script de upload de imagem de reporte de bug para o TrainLog
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadDir = '../uploads/bug-reports/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$baseUrl = $protocol . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['REQUEST_URI'])) . '/';

$response = [
    'success' => false,
    'message' => 'Erro interno',
    'imageUrl' => null
];

try {
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception("Falha ao criar diretório de uploads no servidor.");
        }
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['image']) ? $_FILES['image']['error'] : 'N/A';
        throw new Exception("Nenhum arquivo recebido ou erro no envio HTTP. Código: " . $errorCode);
    }

    $file = $_FILES['image'];
    $userId = isset($_POST['userId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['userId']) : 'usuario';

    if ($file['size'] > $maxSize) {
        throw new Exception("A imagem excede o tamanho limite de 5MB.");
    }

    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Formato inválido. Use apenas imagens JPG, PNG, GIF ou WEBP.");
    }

    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (empty($extension)) {
        if ($file['type'] == 'image/jpeg') $extension = 'jpg';
        else if ($file['type'] == 'image/png') $extension = 'png';
        else if ($file['type'] == 'image/webp') $extension = 'webp';
    }

    $newFileName = $userId . '_' . time() . '.' . $extension;
    $destination = $uploadDir . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        $response['success'] = true;
        $response['imageUrl'] = $baseUrl . 'uploads/bug-reports/' . $newFileName;
        $response['message'] = "Upload efetuado com sucesso!";
    } else {
        throw new Exception("Falha ao salvar o arquivo no destino.");
    }

} catch (Exception $e) {
    http_response_code(400); 
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>
