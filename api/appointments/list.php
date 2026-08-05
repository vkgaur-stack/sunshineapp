<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$status = $_GET['status'] ?? null;

$sql = '
    SELECT a.*, s.name AS service_name, b.full_name AS beneficiary_name, b.mobile_number AS beneficiary_mobile
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    JOIN beneficiaries b ON b.id = a.beneficiary_id
    WHERE 1=1
';
$params = [];
if ($status) {
    $sql .= ' AND a.status = ?';
    $params[] = $status;
}
$sql .= ' ORDER BY a.created_at DESC LIMIT 200';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$appointments = $stmt->fetchAll();

jsonResponse(['appointments' => $appointments, 'count' => count($appointments)]);
