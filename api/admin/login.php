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
$stmt = $db->prepare('SELECT * FROM admin_users WHERE email = ? AND is_active = 1');
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    jsonError('Invalid credentials', 401);
}

$token = signToken([
    'type' => 'admin',
    'sub' => $admin['id'],
    'role' => $admin['role'],
    'email' => $admin['email'],
]);

jsonResponse([
    'token' => $token,
    'admin' => [
        'id' => $admin['id'],
        'fullName' => $admin['full_name'],
        'role' => $admin['role'],
    ],
]);
