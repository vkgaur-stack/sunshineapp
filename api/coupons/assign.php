<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'CAMP_COORDINATOR']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Coupon id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$body = getJsonBody();
$beneficiaryId = validateUuid(requireField($body, 'beneficiaryId', 'Beneficiary ID'));

$db = getDb();

$coupon = $db->prepare('
    SELECT c.*, s.name AS service_name
    FROM coupons c JOIN services s ON s.id = c.service_id
    WHERE c.id = ?
');
$coupon->execute([$id]);
$couponRow = $coupon->fetch();
if (!$couponRow) {
    jsonError('Coupon not found.', 404);
}
if ($couponRow['status'] !== 'ISSUED') {
    jsonError('Coupon is ' . strtolower($couponRow['status']) . ', cannot be assigned.', 400);
}

$beneficiary = $db->prepare('SELECT * FROM beneficiaries WHERE id = ?');
$beneficiary->execute([$beneficiaryId]);
$beneficiaryRow = $beneficiary->fetch();
if (!$beneficiaryRow) {
    jsonError('Beneficiary not found.', 404);
}

$update = $db->prepare("UPDATE coupons SET beneficiary_id = ?, status = 'ASSIGNED' WHERE id = ?");
$update->execute([$beneficiaryId, $id]);

try {
    notifyPreferred(
        $beneficiaryRow['preferred_contact'],
        $beneficiaryRow['mobile_number'],
        $beneficiaryRow['email'],
        'COUPON_ISSUED',
        [
            'fullName' => $beneficiaryRow['full_name'],
            'serviceName' => $couponRow['service_name'],
            'code' => $couponRow['code'],
            'expiresOn' => date('j M Y', strtotime($couponRow['expires_at'])),
        ],
        'Coupon',
        $id
    );
} catch (Exception $e) {
    error_log('Coupon notification failed: ' . $e->getMessage());
}

$fetch = $db->prepare('SELECT * FROM coupons WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['coupon' => $fetch->fetch()]);
