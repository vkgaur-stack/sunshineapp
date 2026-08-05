<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/case.php';

applyCommonHeaders();
requireMethod('POST');
requireClinicAuth();

$body = getJsonBody();
$code = requireField($body, 'code', 'Coupon code');

$db = getDb();
$stmt = $db->prepare('
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_full_name
    FROM coupons c
    JOIN services s ON s.id = c.service_id
    LEFT JOIN beneficiaries b ON b.id = c.beneficiary_id
    WHERE c.code = ?
');
$stmt->execute([$code]);
$row = $stmt->fetch();

if (!$row) {
    jsonError('No coupon found with this code.', 404);
}

$coupon = rowToCamelCase($row);
$coupon['service'] = ['name' => $row['service_name']];
$coupon['beneficiary'] = $row['beneficiary_id'] ? ['fullName' => $row['beneficiary_full_name']] : null;
unset($coupon['serviceName'], $coupon['beneficiaryFullName']);

if ($row['status'] === 'REDEEMED') {
    jsonError('This coupon has already been redeemed.', 400, ['coupon' => $coupon]);
}
if ($row['status'] === 'CANCELLED') {
    jsonError('This coupon has been cancelled.', 400, ['coupon' => $coupon]);
}
if (strtotime($row['expires_at']) < time()) {
    jsonError('This coupon has expired.', 400, ['coupon' => $coupon]);
}

jsonResponse(['valid' => true, 'coupon' => $coupon]);
