<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/xlsx.php';

applyCommonHeaders();
requireMethod('GET');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'FINANCE']);

$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;
$fromClause = $from ? "$from 00:00:00" : '1970-01-01 00:00:00';
$toClause = $to ? "$to 23:59:59" : '2999-12-31 23:59:59';

$db = getDb();

$donationsStmt = $db->prepare("
    SELECT d.*, dn.full_name
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    WHERE d.status = 'SUCCESS' AND d.created_at BETWEEN ? AND ?
    ORDER BY d.created_at ASC
");
$donationsStmt->execute([$fromClause, $toClause]);
$donations = $donationsStmt->fetchAll();

$couponsStmt = $db->prepare("
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_name, cl.name AS clinic_name
    FROM coupons c
    JOIN services s ON s.id = c.service_id
    LEFT JOIN beneficiaries b ON b.id = c.beneficiary_id
    LEFT JOIN clinics cl ON cl.id = c.redeemed_clinic_id
    WHERE c.status = 'REDEEMED' AND c.redeemed_at BETWEEN ? AND ?
    ORDER BY c.redeemed_at ASC
");
$couponsStmt->execute([$fromClause, $toClause]);
$coupons = $couponsStmt->fetchAll();

$appointmentsStmt = $db->prepare("SELECT COUNT(*) AS cnt FROM appointments WHERE status = 'COMPLETED' AND updated_at BETWEEN ? AND ?");
$appointmentsStmt->execute([$fromClause, $toClause]);
$sessionsCompleted = (int) $appointmentsStmt->fetch()['cnt'];

$campsStmt = $db->prepare("SELECT COUNT(*) AS cnt FROM camps WHERE end_at BETWEEN ? AND ?");
$campsStmt->execute([$fromClause, $toClause]);
$campsHeld = (int) $campsStmt->fetch()['cnt'];

$totalDonated = array_sum(array_map(fn($d) => $d['amount_in_paise'], $donations)) / 100;
$totalSubsidy = array_sum(array_map(fn($c) => $c['value_in_paise'] ?? 0, $coupons)) / 100;

$writer = new SimpleXlsxWriter();

$writer->addSheet('Summary', [
    ['Sunshine Social Foundation — Impact Summary'],
    ['Period: ' . ($from ?: 'inception') . ' to ' . ($to ?: 'present')],
    [],
    ['Metric', 'Value'],
    ['Total Donations Received (INR)', number_format($totalDonated, 2, '.', '')],
    ['Number of Donations', count($donations)],
    ['Subsidy Delivered via Coupons (INR)', number_format($totalSubsidy, 2, '.', '')],
    ['Coupons Redeemed', count($coupons)],
    ['Sessions Completed', $sessionsCompleted],
    ['Camps Held', $campsHeld],
], false);

$donationRows = [['Date', 'Donor', 'Amount (INR)', 'Purpose', 'Receipt No.']];
foreach ($donations as $d) {
    $donationRows[] = [
        substr($d['created_at'], 0, 10), $d['full_name'],
        round($d['amount_in_paise'] / 100, 2), $d['purpose'], $d['receipt_number'] ?? '',
    ];
}
$writer->addSheet('Donations', $donationRows, true);

$couponRows = [['Code', 'Service', 'Beneficiary', 'Clinic', 'Subsidy Value (INR)', 'Redeemed On']];
foreach ($coupons as $c) {
    $couponRows[] = [
        $c['code'], $c['service_name'], $c['beneficiary_name'] ?? '—', $c['clinic_name'] ?? '—',
        $c['value_in_paise'] ? round($c['value_in_paise'] / 100, 2) : '',
        $c['redeemed_at'] ? substr($c['redeemed_at'], 0, 10) : '',
    ];
}
$writer->addSheet('Subsidy Redemptions', $couponRows, true);

$filename = 'csr-summary-' . ($from ?: 'all') . '-to-' . ($to ?: 'now') . '.xlsx';
$writer->output($filename);
