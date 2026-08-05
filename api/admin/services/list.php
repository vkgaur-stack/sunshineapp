<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

// Admin sees ALL services, including inactive ones — the public
// services/list.php only shows active services.
$db = getDb();
$stmt = $db->query('SELECT * FROM services ORDER BY created_at DESC');

jsonResponse(['services' => $stmt->fetchAll()]);
