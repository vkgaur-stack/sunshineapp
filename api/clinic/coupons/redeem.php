<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('POST');
$clinic = requireClinicAuth();

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Coupon id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$db = getDb();
$stmt = $db->prepare('SELECT * FROM coupons WHERE id = ?');
$stmt->execute([$id]);
$coupon = $stmt->fetch();

if (!$coupon) {
    jsonError('Coupon not found.', 404);
}
if ($coupon['status'] === 'REDEEMED') {
    jsonError('This coupon has already been redeemed.', 400);
}
if (strtotime($coupon['expires_at']) < time()) {
    jsonError('This coupon has expired.', 400);
}

$update = $db->prepare("
    UPDATE coupons
    SET status = 'REDEEMED', redeemed_at = NOW(), redeemed_clinic_id = ?, redeemed_by_user_id = ?
    WHERE id = ?
");
$update->execute([$clinic['clinicId'], $clinic['sub'], $id]);

$fetch = $db->prepare('SELECT * FROM coupons WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['coupon' => $fetch->fetch()]);
