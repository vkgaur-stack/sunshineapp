<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$clinicId = $_GET['clinicId'] ?? null;
if (!$clinicId) {
    jsonError('clinicId query parameter is required.', 400);
}
validateUuid($clinicId);

$body = getJsonBody();
$fullName = requireField($body, 'fullName', 'Full name');
$email = requireField($body, 'email', 'Email');
$password = requireField($body, 'password', 'Password');

$db = getDb();

$clinicCheck = $db->prepare('SELECT id FROM clinics WHERE id = ?');
$clinicCheck->execute([$clinicId]);
if (!$clinicCheck->fetch()) {
    jsonError('Clinic not found.', 404);
}

$id = generateUuid();
$stmt = $db->prepare('
    INSERT INTO clinic_users (id, clinic_id, full_name, email, password_hash)
    VALUES (?, ?, ?, ?, ?)
');
$stmt->execute([$id, $clinicId, $fullName, $email, password_hash($password, PASSWORD_DEFAULT)]);

jsonResponse(['clinicUser' => ['id' => $id, 'fullName' => $fullName, 'email' => $email]], 201);
