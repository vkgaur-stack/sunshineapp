<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

$db = getDb();
$stmt = $db->query('SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC');
jsonResponse(['services' => $stmt->fetchAll()]);
