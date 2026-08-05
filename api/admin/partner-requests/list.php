<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$stmt = $db->query('SELECT * FROM partner_requests ORDER BY created_at DESC');
jsonResponse(['requests' => $stmt->fetchAll()]);
