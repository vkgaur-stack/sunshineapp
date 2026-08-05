<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/case.php';

applyCommonHeaders();
requireMethod('GET');
$clinic = requireClinicAuth();

$db = getDb();
$stmt = $db->prepare('
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_full_name
    FROM coupons c
    JOIN services s ON s.id = c.service_id
    LEFT JOIN beneficiaries b ON b.id = c.beneficiary_id
    WHERE c.redeemed_clinic_id = ?
    ORDER BY c.redeemed_at DESC
    LIMIT 200
');
$stmt->execute([$clinic['clinicId']]);
$rows = $stmt->fetchAll();

$coupons = array_map(function ($row) {
    $coupon = rowToCamelCase($row);
    $coupon['service'] = ['name' => $row['service_name']];
    $coupon['beneficiary'] = $row['beneficiary_id'] ? ['fullName' => $row['beneficiary_full_name']] : null;
    unset($coupon['serviceName'], $coupon['beneficiaryFullName']);
    return $coupon;
}, $rows);

jsonResponse(['coupons' => $coupons]);
