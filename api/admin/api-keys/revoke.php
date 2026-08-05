<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('DELETE');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('API key id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$db = getDb();
$db->prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?')->execute([$id]);

jsonResponse(['revoked' => true]);
