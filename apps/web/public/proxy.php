<?php
/**
 * Reverse Proxy for Royal Billiards Management API
 * Solves Mixed Content (HTTPS -> HTTP) and CORS for hosting at /huynhchivi/doan/
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$backendBase = 'https://duanbida-1.onrender.com/api/v1';
$path = isset($_GET['path']) ? $_GET['path'] : '';

// Remove 'path' from query params
$queryParams = $_GET;
unset($queryParams['path']);

$normalizedPath = $path ? (strpos($path, '/') === 0 ? $path : '/' . $path) : '';
$targetUrl = $backendBase . $normalizedPath;

if (!empty($queryParams)) {
    $queryString = http_build_query($queryParams);
    $targetUrl .= (strpos($targetUrl, '?') !== false ? '&' : '?') . $queryString;
}

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Forward headers
$headers = [];
if (function_exists('getallheaders')) {
    $reqHeaders = getallheaders();
} else {
    $reqHeaders = [];
    foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 5) === 'HTTP_') {
            $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
            $reqHeaders[$header] = $value;
        }
    }
}

foreach ($reqHeaders as $name => $value) {
    $lower = strtolower($name);
    if ($lower !== 'host' && $lower !== 'content-length') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward request body for non-GET
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
    if ($body !== false && strlen($body) > 0) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

if ($contentType) {
    header("Content-Type: $contentType");
}
http_response_code($httpCode ?: 500);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'statusCode' => 502,
        'message' => 'Lỗi kết nối tới Backend API server: ' . curl_error($ch),
        'targetUrl' => $targetUrl,
    ]);
} else {
    echo $response;
}
curl_close($ch);

