<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$beneficiaryId = validateUuid(requireField($body, 'beneficiaryId', 'Beneficiary ID'));
$serviceId = validateUuid(requireField($body, 'serviceId', 'Service ID'));
$preferredDate = requireField($body, 'preferredDate', 'Preferred date');
$timeSlot = requireField($body, 'timeSlot', 'Time slot');
$campId = optionalField($body, 'campId');
if ($campId === '') { $campId = null; }

$db = getDb();

$beneficiaryStmt = $db->prepare('SELECT * FROM beneficiaries WHERE id = ?');
$beneficiaryStmt->execute([$beneficiaryId]);
$beneficiary = $beneficiaryStmt->fetch();
if (!$beneficiary) {
    jsonError('Beneficiary not found. Please register before booking an appointment.', 404);
}

$serviceStmt = $db->prepare('SELECT * FROM services WHERE id = ? AND is_active = 1');
$serviceStmt->execute([$serviceId]);
$service = $serviceStmt->fetch();
if (!$service) {
    jsonError('Selected service is not available.', 400);
}

$id = generateUuid();
$insert = $db->prepare('
    INSERT INTO appointments (id, beneficiary_id, service_id, camp_id, preferred_date, time_slot, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');
$insert->execute([$id, $beneficiaryId, $serviceId, $campId, $preferredDate, $timeSlot, optionalField($body, 'notes')]);

// Best-effort — never blocks the booking itself.
try {
    notifyPreferred(
        $beneficiary['preferred_contact'],
        $beneficiary['mobile_number'],
        $beneficiary['email'],
        'APPOINTMENT_REQUESTED',
        [
            'fullName' => $beneficiary['full_name'],
            'serviceName' => $service['name'],
            'preferredDate' => date('j M Y', strtotime($preferredDate)),
            'timeSlot' => $timeSlot,
        ],
        'Appointment',
        $id
    );
} catch (Exception $e) {
    error_log('Appointment notification failed: ' . $e->getMessage());
}

$fetch = $db->prepare('SELECT * FROM appointments WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['appointment' => $fetch->fetch()], 201);
