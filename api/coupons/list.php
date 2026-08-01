<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$status = $_GET['status'] ?? null;
$beneficiaryId = $_GET['beneficiaryId'] ?? null;

$sql = '
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_name,
           cl.name AS redeemed_clinic_name
    FROM coupons c
    JOIN services s ON s.id = c.service_id
    LEFT JOIN beneficiaries b ON b.id = c.beneficiary_id
    LEFT JOIN clinics cl ON cl.id = c.redeemed_clinic_id
    WHERE 1=1
';
$params = [];
if ($status) {
    $sql .= ' AND c.status = ?';
    $params[] = $status;
}
if ($beneficiaryId) {
    $sql .= ' AND c.beneficiary_id = ?';
    $params[] = $beneficiaryId;
}
$sql .= ' ORDER BY c.created_at DESC LIMIT 300';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$coupons = $stmt->fetchAll();

jsonResponse(['coupons' => $coupons, 'count' => count($coupons)]);
