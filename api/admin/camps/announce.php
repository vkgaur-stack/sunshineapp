<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'CAMP_COORDINATOR']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Camp id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$db = getDb();
$campStmt = $db->prepare('SELECT * FROM camps WHERE id = ?');
$campStmt->execute([$id]);
$camp = $campStmt->fetch();
if (!$camp) {
    jsonError('Camp not found.', 404);
}

// Sends to every registered beneficiary whose city matches the camp's
// city — city-matched, not geo-radius-matched, a reasonable MVP given
// beneficiaries only have a city field today (same approach as the Node
// build's equivalent).
$beneficiaryStmt = $db->prepare('SELECT * FROM beneficiaries WHERE city = ?');
$beneficiaryStmt->execute([$camp['city']]);
$beneficiaries = $beneficiaryStmt->fetchAll();

$sentCount = 0;
foreach ($beneficiaries as $b) {
    try {
        $result = notifyPreferred(
            $b['preferred_contact'],
            $b['mobile_number'],
            $b['email'],
            'CAMP_ANNOUNCEMENT',
            [
                'fullName' => $b['full_name'],
                'campTitle' => $camp['title'],
                'city' => $camp['city'],
                'startDate' => date('j M Y', strtotime($camp['start_at'])),
            ],
            'Camp',
            $id
        );
        if (($result['delivered'] ?? false) !== false) {
            $sentCount++;
        }
    } catch (Exception $e) {
        error_log('Camp announcement notification failed for beneficiary ' . $b['id'] . ': ' . $e->getMessage());
    }
}

jsonResponse([
    'camp' => $camp,
    'targetedBeneficiaries' => count($beneficiaries),
    'notificationsAttempted' => count($beneficiaries),
    'notificationsSent' => $sentCount,
]);
