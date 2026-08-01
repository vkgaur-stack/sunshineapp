<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Live-computed impact stats — every figure calculated directly from real
// records so it can never drift out of sync with what actually happened.
// Mirrors impact.controller.js from the Node build.
$db = getDb();

$totalBeneficiaries = (int) $db->query('SELECT COUNT(*) AS cnt FROM beneficiaries')->fetch()['cnt'];

$beneficiariesServed = (int) $db->query("
    SELECT COUNT(DISTINCT beneficiary_id) AS cnt FROM appointments WHERE status = 'COMPLETED'
")->fetch()['cnt'];

$sessionsCompleted = (int) $db->query("
    SELECT COUNT(*) AS cnt FROM appointments WHERE status = 'COMPLETED'
")->fetch()['cnt'];

$campsHeld = (int) $db->query('SELECT COUNT(*) AS cnt FROM camps WHERE end_at < NOW()')->fetch()['cnt'];

$citiesServed = (int) $db->query('SELECT COUNT(DISTINCT city) AS cnt FROM beneficiaries')->fetch()['cnt'];

$couponsRedeemedRow = $db->query("
    SELECT COUNT(*) AS cnt, COALESCE(SUM(value_in_paise), 0) AS total_paise
    FROM coupons WHERE status = 'REDEEMED'
")->fetch();
$couponsRedeemed = (int) $couponsRedeemedRow['cnt'];
$subsidyDeliveredInRupees = (int) round($couponsRedeemedRow['total_paise'] / 100);

jsonResponse([
    'totalBeneficiaries' => $totalBeneficiaries,
    'beneficiariesServed' => $beneficiariesServed,
    'sessionsCompleted' => $sessionsCompleted,
    'campsHeld' => $campsHeld,
    'citiesServed' => $citiesServed,
    'couponsRedeemed' => $couponsRedeemed,
    'subsidyDeliveredInRupees' => $subsidyDeliveredInRupees,
    'lastUpdated' => gmdate('Y-m-d\TH:i:s.000\Z'),
]);
