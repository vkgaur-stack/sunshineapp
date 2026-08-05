<?php
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../config/database.php';

// Reads the Bearer token from the Authorization header, or null if absent.
function getBearerToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($header, 'Bearer ')) {
        return substr($header, 7);
    }
    return null;
}

// Verifies an admin token and returns its decoded payload, or sends a 401
// JSON response and exits if missing/invalid — call this at the top of
// any admin-only endpoint file.
function requireAdminAuth(): array
{
    $token = getBearerToken();
    if (!$token) {
        jsonError('Missing authentication token', 401);
    }
    $decoded = verifyToken($token);
    if (!$decoded || ($decoded['type'] ?? 'admin') !== 'admin') {
        jsonError('Invalid or expired token', 401);
    }
    return $decoded;
}

// Call after requireAdminAuth() with the decoded payload and the roles
// allowed for this endpoint, e.g. requireRole($admin, ['SUPER_ADMIN', 'FINANCE']).
function requireRole(array $admin, array $allowedRoles): void
{
    if (!in_array($admin['role'] ?? '', $allowedRoles, true)) {
        jsonError('Insufficient permissions', 403);
    }
}

// Same pattern as requireAdminAuth, but for clinic-portal tokens — a
// separate trust boundary, so a clinic login can never be used on an
// /admin endpoint (checked via the 'type' claim) and vice versa.
function requireClinicAuth(): array
{
    $token = getBearerToken();
    if (!$token) {
        jsonError('Missing authentication token', 401);
    }
    $decoded = verifyToken($token);
    if (!$decoded || ($decoded['type'] ?? '') !== 'clinic') {
        jsonError('This endpoint requires a clinic login.', 403);
    }
    return $decoded;
}

// Verifies an external integration's API key (X-API-Key header) and its
// scope. Looked up by SHA-256 hash — see lib/apikey.php for why a
// deterministic hash (not bcrypt) is the right choice for high-entropy
// random API keys.
function requireApiKey(string $requiredScope): array
{
    $providedKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!$providedKey) {
        jsonError('Missing X-API-Key header', 401);
    }

    $hash = hash('sha256', $providedKey);
    $db = getDb();
    $stmt = $db->prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1');
    $stmt->execute([$hash]);
    $apiKey = $stmt->fetch();

    if (!$apiKey) {
        jsonError('Invalid or revoked API key', 401);
    }

    $scopes = array_map('trim', explode(',', $apiKey['scopes']));
    if (!in_array($requiredScope, $scopes, true)) {
        jsonError("This key lacks the \"$requiredScope\" scope.", 403);
    }

    $update = $db->prepare('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?');
    $update->execute([$apiKey['id']]);

    return $apiKey;
}
