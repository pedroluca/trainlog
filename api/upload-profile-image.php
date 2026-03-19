<?php
/**
 * Script de upload de imagem de perfil para o TrainLog
 * Este arquivo deve ser colocado no seu servidor PHP (Hostinger)
 * Exemplo de estrutura no servidor:
 * /public_html/
 *   /api/
 *     upload-profile-image.php
 *   /uploads/
 *     /profile-images/
 */

// Permitir requisições de outras origens (CORS - importante para rodar separado do front-end)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tratar requisição OPTIONS (preflight CORS do navegador)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações base
$uploadDir = '../uploads/profile-images/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // Limite de 5MB

// Descobrir a URL base onde a imagem ficará acessível (ex: https://meusite.com/uploads/profile-images/...)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
// Supondo que a pasta raiz do servidor seja acessível web e `uploads` fique nela
$baseUrl = $protocol . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['REQUEST_URI'])) . '/';

$response = [
    'success' => false,
    'message' => 'Erro interno',
    'imageUrl' => null
];

try {
    // Verificar e criar diretório se não existir
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception("Falha ao criar diretório de uploads no servidor.");
        }
    }

    // Verificar se o arquivo foi recebido pelo PHP
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['image']) ? $_FILES['image']['error'] : 'N/A';
        throw new Exception("Nenhum arquivo recebido ou erro no envio HTTP. Código: " . $errorCode);
    }

    $file = $_FILES['image'];
    // Validar ID do usuário, para vincular a imagem ao ID do firebase
    $userId = isset($_POST['userId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['userId']) : 'usuario';

    // Validação de Tamanho e Tipo de Arquivo
    if ($file['size'] > $maxSize) {
        throw new Exception("A imagem excede o tamanho limite de 5MB.");
    }

    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Formato inválido. Use apenas imagens JPG, PNG, GIF ou WEBP.");
    }

    // Identificar a extensão do arquivo enviado
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (empty($extension)) {
        if ($file['type'] == 'image/jpeg') $extension = 'jpg';
        else if ($file['type'] == 'image/png') $extension = 'png';
        else if ($file['type'] == 'image/webp') $extension = 'webp';
    }

    // Adicionado timer no nome pra evitar que o navegador guarde cache da foto antiga
    $newFileName = $userId . '_' . time() . '.' . $extension;
    $destination = $uploadDir . $newFileName;

    // Realizar a transferência da imagem temp para pasta do servidor
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        $response['success'] = true;
        $response['imageUrl'] = $baseUrl . 'uploads/profile-images/' . $newFileName;
        $response['message'] = "Upload efetuado com sucesso!";
    } else {
        throw new Exception("Falha ao salvar o arquivo no destino.");
    }

} catch (Exception $e) {
    http_response_code(400); // Bad Request
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

// Retornar no formato JSON para o React
echo json_encode($response);
?>
