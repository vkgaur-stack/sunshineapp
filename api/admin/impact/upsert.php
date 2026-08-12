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
$month = (int) requireField($body, 'month', 'Month');
$year = (int) requireField($body, 'year', 'Year');

if ($month < 1 || $month > 12) {
    jsonError('Month must be between 1 and 12.', 400);
}
if ($year < 2000 || $year > 2100) {
    jsonError('Year looks invalid.', 400);
}

$beneficiariesServed = (int) optionalField($body, 'beneficiariesServed', 0);
$sessionsCompleted = (int) optionalField($body, 'sessionsCompleted', 0);
$campsHeld = (int) optionalField($body, 'campsHeld', 0);
$subsidyDeliveredInRupees = (int) optionalField($body, 'subsidyDeliveredInRupees', 0);
$citiesServed = (int) optionalField($body, 'citiesServed', 0);
$couponsRedeemed = (int) optionalField($body, 'couponsRedeemed', 0);
$updatedBy = optionalField($body, 'updatedBy', $admin['email'] ?? null);

$db = getDb();

// Upsert on (metric_month, metric_year) — saving the same month again
// edits it in place instead of creating a duplicate row.
$existing = $db->prepare('SELECT id FROM impact_metrics WHERE metric_month = ? AND metric_year = ?');
$existing->execute([$month, $year]);
$row = $existing->fetch();

if ($row) {
    $db->prepare('
        UPDATE impact_metrics SET
            beneficiaries_served = ?, sessions_completed = ?, camps_held = ?,
            subsidy_delivered_in_rupees = ?, cities_served = ?, coupons_redeemed = ?,
            updated_by = ?
        WHERE id = ?
    ')->execute([
        $beneficiariesServed, $sessionsCompleted, $campsHeld,
        $subsidyDeliveredInRupees, $citiesServed, $couponsRedeemed,
        $updatedBy, $row['id'],
    ]);
    $id = $row['id'];
} else {
    $id = generateUuid();
    $db->prepare('
        INSERT INTO impact_metrics
            (id, metric_month, metric_year, beneficiaries_served, sessions_completed,
             camps_held, subsidy_delivered_in_rupees, cities_served, coupons_redeemed, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ')->execute([
        $id, $month, $year, $beneficiariesServed, $sessionsCompleted,
        $campsHeld, $subsidyDeliveredInRupees, $citiesServed, $couponsRedeemed, $updatedBy,
    ]);
}

$fetch = $db->prepare('SELECT * FROM impact_metrics WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['metrics' => $fetch->fetch()], 200);
