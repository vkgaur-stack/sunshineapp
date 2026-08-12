<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Powers the month/year selector on the public Impact page — only months
// an admin has actually entered data for are selectable, newest first.
$db = getDb();
$stmt = $db->query(
    'SELECT metric_month AS month, metric_year AS year FROM impact_metrics ORDER BY metric_year DESC, metric_month DESC'
);

jsonResponse(['months' => $stmt->fetchAll()]);
