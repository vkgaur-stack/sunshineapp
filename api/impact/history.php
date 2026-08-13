<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Full monthly history, oldest first — powers the all-time trend charts
// on the public Impact page (one mini chart per metric, all months
// plotted left to right, selected month highlighted).
$db = getDb();
$stmt = $db->query('SELECT * FROM impact_metrics ORDER BY metric_year ASC, metric_month ASC');

$rows = array_map(function ($row) {
    return [
        'month' => (int) $row['metric_month'],
        'year' => (int) $row['metric_year'],
        'beneficiariesServed' => (int) $row['beneficiaries_served'],
        'sessionsCompleted' => (int) $row['sessions_completed'],
        'campsHeld' => (int) $row['camps_held'],
        'subsidyDeliveredInRupees' => (int) $row['subsidy_delivered_in_rupees'],
        'citiesServed' => (int) $row['cities_served'],
        'couponsRedeemed' => (int) $row['coupons_redeemed'],
    ];
}, $stmt->fetchAll());

jsonResponse(['history' => $rows]);
