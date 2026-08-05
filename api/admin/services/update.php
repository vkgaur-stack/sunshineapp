<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('PATCH');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Service id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$db = getDb();
$existing = $db->prepare('SELECT id FROM services WHERE id = ?');
$existing->execute([$id]);
if (!$existing->fetch()) {
    jsonError('Service not found.', 404);
}

$body = getJsonBody();
$fields = [];
$params = [];

if (array_key_exists('name', $body)) {
    $fields[] = 'name = ?';
    $params[] = $body['name'];
}
if (array_key_exists('description', $body)) {
    $fields[] = 'description = ?';
    $params[] = $body['description'];
}
if (array_key_exists('isActive', $body)) {
    $fields[] = 'is_active = ?';
    $params[] = $body['isActive'] ? 1 : 0;
}

if (empty($fields)) {
    jsonError('No updatable fields provided.', 400);
}

$params[] = $id;
$db->prepare('UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

$fetch = $db->prepare('SELECT * FROM services WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['service' => $fetch->fetch()]);
