<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$body = getJsonBody();
$name = requireField($body, 'name', 'Service name');
$description = requireField($body, 'description', 'Description');
$isActive = array_key_exists('isActive', $body) ? ($body['isActive'] ? 1 : 0) : 1;

$db = getDb();
$id = generateUuid();
$db->prepare('INSERT INTO services (id, name, description, is_active) VALUES (?, ?, ?, ?)')
   ->execute([$id, $name, $description, $isActive]);

$fetch = $db->prepare('SELECT * FROM services WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['service' => $fetch->fetch()], 201);
