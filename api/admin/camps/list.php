<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/case.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$stmt = $db->query('SELECT * FROM camps ORDER BY start_at DESC');
jsonResponse(['camps' => rowsToCamelCase($stmt->fetchAll())]);
