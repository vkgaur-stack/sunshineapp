<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Impact metrics are entered manually by an admin each month (see
// /admin > Impact) rather than live-computed, so the public page always
// shows a deliberate, reviewed snapshot instead of raw in-progress
// database counts. Pass ?month=&year= to fetch a specific month; with no
// params, the most recently entered month is returned.
$db = getDb();

$month = isset($_GET['month']) ? (int) $_GET['month'] : null;
$year = isset($_GET['year']) ? (int) $_GET['year'] : null;

if ($month && $year) {
    $stmt = $db->prepare('SELECT * FROM impact_metrics WHERE metric_month = ? AND metric_year = ?');
    $stmt->execute([$month, $year]);
} else {
    $stmt = $db->query('SELECT * FROM impact_metrics ORDER BY metric_year DESC, metric_month DESC LIMIT 1');
}

$row = $stmt->fetch();

if (!$row) {
    jsonResponse(['found' => false, 'metrics' => null]);
}

jsonResponse([
    'found' => true,
    'metrics' => [
        'month' => (int) $row['metric_month'],
        'year' => (int) $row['metric_year'],
        'beneficiariesServed' => (int) $row['beneficiaries_served'],
        'sessionsCompleted' => (int) $row['sessions_completed'],
        'campsHeld' => (int) $row['camps_held'],
        'subsidyDeliveredInRupees' => (int) $row['subsidy_delivered_in_rupees'],
        'citiesServed' => (int) $row['cities_served'],
        'couponsRedeemed' => (int) $row['coupons_redeemed'],
        'updatedAt' => $row['updated_at'],
    ],
]);
