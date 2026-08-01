<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireApiKey('donations:read');

$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

$db = getDb();
$sql = "
    SELECT d.*, dn.full_name, dn.email, dn.pan_number
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    WHERE d.status = 'SUCCESS'
";
$params = [];
if ($from) { $sql .= ' AND d.created_at >= ?'; $params[] = "$from 00:00:00"; }
if ($to)   { $sql .= ' AND d.created_at <= ?'; $params[] = "$to 23:59:59"; }
$sql .= ' ORDER BY d.created_at DESC LIMIT 1000';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$donations = array_map(fn($d) => [
    'id' => $d['id'],
    'amountInRupees' => $d['amount_in_paise'] / 100,
    'purpose' => $d['purpose'],
    'receiptNumber' => $d['receipt_number'],
    'donorName' => $d['full_name'],
    'donorEmail' => $d['email'],
    'donorPan' => $d['pan_number'],
    'date' => $d['created_at'],
], $rows);

jsonResponse(['donations' => $donations, 'count' => count($donations)]);
