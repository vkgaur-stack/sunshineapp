<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// All-time totals across every month an admin has entered — powers the
// home page's impact snapshot cards and the "All-time" reference figures
// next to each trend chart on the public Impact page.
//
// Note: this is a straight SUM of whatever an admin typed in for each
// month (see /admin > Impact), same as every other figure in this table —
// it doesn't attempt to deduplicate e.g. the same city appearing across
// multiple months for "citiesServed". That's consistent with how the
// monthly numbers are entered (flat figures, not deduplicated against
// other months) rather than a new limitation introduced here.
$db = getDb();
$row = $db->query('
    SELECT
        COALESCE(SUM(beneficiaries_served), 0)        AS beneficiaries_served,
        COALESCE(SUM(sessions_completed), 0)           AS sessions_completed,
        COALESCE(SUM(camps_held), 0)                   AS camps_held,
        COALESCE(SUM(subsidy_delivered_in_rupees), 0)  AS subsidy_delivered_in_rupees,
        COALESCE(SUM(cities_served), 0)                AS cities_served,
        COALESCE(SUM(coupons_redeemed), 0)             AS coupons_redeemed,
        COUNT(*)                                       AS months_recorded
    FROM impact_metrics
')->fetch();

jsonResponse([
    'totals' => [
        'beneficiariesServed' => (int) $row['beneficiaries_served'],
        'sessionsCompleted' => (int) $row['sessions_completed'],
        'campsHeld' => (int) $row['camps_held'],
        'subsidyDeliveredInRupees' => (int) $row['subsidy_delivered_in_rupees'],
        'citiesServed' => (int) $row['cities_served'],
        'couponsRedeemed' => (int) $row['coupons_redeemed'],
        'monthsRecorded' => (int) $row['months_recorded'],
    ],
]);
