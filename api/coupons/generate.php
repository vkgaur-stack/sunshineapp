<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/couponCode.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'FINANCE']);

$body = getJsonBody();
$serviceId = validateUuid(requireField($body, 'serviceId', 'Service ID'));
$quantity = requireField($body, 'quantity', 'Quantity');
$donationId = optionalField($body, 'donationId');
if ($donationId === '') { $donationId = null; }

if (!is_int($quantity) && !ctype_digit((string) $quantity)) {
    jsonError('Quantity must be a whole number.', 400);
}
$quantity = (int) $quantity;
if ($quantity < 1 || $quantity > 500) {
    jsonError('Quantity must be between 1 and 500.', 400);
}

$db = getDb();

$serviceCheck = $db->prepare('SELECT id FROM services WHERE id = ?');
$serviceCheck->execute([$serviceId]);
if (!$serviceCheck->fetch()) {
    jsonError('Service not found.', 404);
}

if ($donationId) {
    $donationCheck = $db->prepare('SELECT id FROM donations WHERE id = ?');
    $donationCheck->execute([$donationId]);
    if (!$donationCheck->fetch()) {
        jsonError('Donation not found.', 404);
    }
}

$subsidyPercent = optionalField($body, 'subsidyPercent', 75);
$valueInPaise = optionalField($body, 'valueInPaise');
$expiresAt = optionalField($body, 'expiresAt');
if (!$expiresAt) {
    $expiresAt = date('Y-m-d H:i:s', strtotime('+6 months'));
}

$insert = $db->prepare('
    INSERT INTO coupons (id, code, donation_id, service_id, subsidy_percent, value_in_paise, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
');

$createdIds = [];
for ($i = 0; $i < $quantity; $i++) {
    $id = generateUuid();
    $code = generateCouponCode();
    $insert->execute([$id, $code, $donationId, $serviceId, $subsidyPercent, $valueInPaise, $expiresAt, 'ISSUED']);
    $createdIds[] = $id;
}

$placeholders = implode(',', array_fill(0, count($createdIds), '?'));
$fetch = $db->prepare("
    SELECT c.*, s.name AS service_name
    FROM coupons c JOIN services s ON s.id = c.service_id
    WHERE c.id IN ($placeholders)
");
$fetch->execute($createdIds);
$coupons = $fetch->fetchAll();

jsonResponse(['coupons' => $coupons, 'count' => count($coupons)], 201);
