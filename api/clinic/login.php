<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/jwt.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$email = requireField($body, 'email');
$password = requireField($body, 'password');

$db = getDb();
$stmt = $db->prepare('
    SELECT cu.*, c.name AS clinic_name, c.city AS clinic_city
    FROM clinic_users cu
    JOIN clinics c ON c.id = cu.clinic_id
    WHERE cu.email = ? AND cu.is_active = 1
');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonError('Invalid credentials', 401);
}

$token = signToken([
    'type' => 'clinic',
    'sub' => $user['id'],
    'clinicId' => $user['clinic_id'],
    'email' => $user['email'],
]);

jsonResponse([
    'token' => $token,
    'clinicUser' => ['id' => $user['id'], 'fullName' => $user['full_name']],
    'clinic' => ['id' => $user['clinic_id'], 'name' => $user['clinic_name'], 'city' => $user['clinic_city']],
]);
