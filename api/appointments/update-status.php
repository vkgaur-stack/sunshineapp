<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('PATCH');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'CAMP_COORDINATOR']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Appointment id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$body = getJsonBody();
$status = validateEnum(
    requireField($body, 'status'),
    ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    'Status'
);

$db = getDb();
$update = $db->prepare('UPDATE appointments SET status = ? WHERE id = ?');
$update->execute([$status, $id]);

$fetch = $db->prepare('
    SELECT a.*, s.name AS service_name, b.full_name, b.mobile_number, b.email, b.preferred_contact
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    JOIN beneficiaries b ON b.id = a.beneficiary_id
    WHERE a.id = ?
');
$fetch->execute([$id]);
$appointment = $fetch->fetch();

if (!$appointment) {
    jsonError('Appointment not found.', 404);
}

if ($status === 'CONFIRMED') {
    try {
        notifyPreferred(
            $appointment['preferred_contact'],
            $appointment['mobile_number'],
            $appointment['email'],
            'APPOINTMENT_CONFIRMED',
            [
                'fullName' => $appointment['full_name'],
                'serviceName' => $appointment['service_name'],
                'preferredDate' => date('j M Y', strtotime($appointment['preferred_date'])),
                'timeSlot' => $appointment['time_slot'],
            ],
            'Appointment',
            $id
        );
    } catch (Exception $e) {
        error_log('Confirmation notification failed: ' . $e->getMessage());
    }
}

jsonResponse(['appointment' => $appointment]);
