<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/case.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$status = $_GET['status'] ?? null;
$beneficiaryId = $_GET['beneficiaryId'] ?? null;

$sql = '
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_full_name,
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
$rows = $stmt->fetchAll();

// The frontend (CouponsPanel) expects nested objects — c.service.name,
// c.beneficiary.fullName, c.redeemedAtClinic.name — not the flat joined
// columns SQL naturally produces. Reshape each row accordingly, on top of
// the usual snake_case -> camelCase conversion.
$coupons = array_map(function ($row) {
    $coupon = rowToCamelCase($row);
    $coupon['service'] = ['name' => $row['service_name']];
    $coupon['beneficiary'] = $row['beneficiary_id']
        ? ['fullName' => $row['beneficiary_full_name']]
        : null;
    $coupon['redeemedAtClinic'] = $row['redeemed_clinic_id']
        ? ['name' => $row['redeemed_clinic_name']]
        : null;
    unset($coupon['serviceName'], $coupon['beneficiaryFullName'], $coupon['redeemedClinicName']);
    return $coupon;
}, $rows);

jsonResponse(['coupons' => $coupons, 'count' => count($coupons)]);
