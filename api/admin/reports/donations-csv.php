<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/csv.php';

applyCommonHeaders();
requireMethod('GET');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'FINANCE']);

$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

$db = getDb();
$sql = "
    SELECT d.*, dn.full_name, dn.mobile_number, dn.email, dn.pan_number
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    WHERE d.status = 'SUCCESS'
";
$params = [];
if ($from) { $sql .= ' AND d.created_at >= ?'; $params[] = "$from 00:00:00"; }
if ($to)   { $sql .= ' AND d.created_at <= ?'; $params[] = "$to 23:59:59"; }
$sql .= ' ORDER BY d.created_at ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$donations = $stmt->fetchAll();

$csv = toCsv($donations, [
    ['label' => 'Date', 'value' => fn($d) => substr($d['created_at'], 0, 10)],
    ['label' => 'Receipt Number', 'value' => fn($d) => $d['receipt_number'] ?? ''],
    ['label' => 'Donor Name', 'value' => fn($d) => $d['full_name']],
    ['label' => 'Donor Mobile', 'value' => fn($d) => $d['mobile_number']],
    ['label' => 'Donor Email', 'value' => fn($d) => $d['email'] ?? ''],
    ['label' => 'Donor PAN', 'value' => fn($d) => $d['pan_number'] ?? ''],
    ['label' => 'Amount (INR)', 'value' => fn($d) => number_format($d['amount_in_paise'] / 100, 2, '.', '')],
    ['label' => 'Purpose', 'value' => fn($d) => $d['purpose']],
    ['label' => 'Payment Reference', 'value' => fn($d) => $d['razorpay_payment_id'] ?? ''],
]);

$filename = 'donations-' . ($from ?: 'all') . '-to-' . ($to ?: 'now') . '.csv';
header('Content-Type: text/csv');
header("Content-Disposition: attachment; filename=\"$filename\"");
echo $csv;
