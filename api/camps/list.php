<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/case.php';

applyCommonHeaders();
requireMethod('GET');

$db = getDb();
$stmt = $db->prepare('SELECT * FROM camps WHERE is_published = 1 AND start_at >= NOW() ORDER BY start_at ASC');
$stmt->execute();

jsonResponse(['camps' => rowsToCamelCase($stmt->fetchAll())]);
