<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/case.php';

applyCommonHeaders();
requireMethod('GET');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$db = getDb();
$stmt = $db->query('SELECT id, label, key_prefix, scopes, is_active, created_at, last_used_at FROM api_keys ORDER BY created_at DESC');

jsonResponse(['apiKeys' => rowsToCamelCase($stmt->fetchAll())]);
