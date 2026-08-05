<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/case.php';

applyCommonHeaders();
requireMethod('GET');

$beneficiaryId = $_GET['beneficiaryId'] ?? null;
if (!$beneficiaryId) {
    jsonError('beneficiaryId is required', 400);
}
validateUuid($beneficiaryId);

$db = getDb();
$stmt = $db->prepare('
    SELECT a.*, s.name AS service_name, c.title AS camp_title
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    LEFT JOIN camps c ON c.id = a.camp_id
    WHERE a.beneficiary_id = ?
    ORDER BY a.preferred_date DESC
');
$stmt->execute([$beneficiaryId]);
$rows = $stmt->fetchAll();

$appointments = array_map(function ($row) {
    $appointment = rowToCamelCase($row);
    $appointment['service'] = ['name' => $row['service_name']];
    $appointment['camp'] = $row['camp_id'] ? ['title' => $row['camp_title']] : null;
    unset($appointment['serviceName'], $appointment['campTitle']);
    return $appointment;
}, $rows);

jsonResponse(['appointments' => $appointments]);
