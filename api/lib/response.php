<?php
require_once __DIR__ . '/../config/config.php';

// Applies CORS + JSON headers and handles preflight OPTIONS requests.
// Every API file calls this first, mirroring the Express app.js middleware
// stack but per-file since there's no shared middleware chain in plain PHP.
function applyCommonHeaders(): void
{
    $allowedOrigins = array_map('trim', explode(',', env('FRONTEND_ORIGINS', 'http://localhost:3000')));
    $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($requestOrigin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $requestOrigin");
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function jsonError(string $message, int $status = 400, array $extra = []): void
{
    jsonResponse(array_merge(['error' => $message], $extra), $status);
}

// Reads and JSON-decodes the request body. Returns [] for empty bodies
// (e.g. some GET-style admin actions) rather than null, so callers can
// use array access without a null-check every time.
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Invalid JSON in request body.', 400);
    }
    return $decoded ?? [];
}

function requireMethod(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        jsonError("This endpoint only accepts $method requests.", 405);
    }
}
