<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$stmt = $db->query('SELECT * FROM impact_metrics ORDER BY metric_year DESC, metric_month DESC');

jsonResponse(['metrics' => $stmt->fetchAll()]);
