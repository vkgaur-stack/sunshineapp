<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$body = getJsonBody();
$name = requireField($body, 'name', 'Clinic name');
$city = requireField($body, 'city', 'City');

$db = getDb();
$id = generateUuid();
$stmt = $db->prepare('
    INSERT INTO clinics (id, name, city, address, contact_person, mobile_number, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');
$stmt->execute([
    $id, $name, $city,
    optionalField($body, 'address'), optionalField($body, 'contactPerson'),
    optionalField($body, 'mobileNumber'), validateEmail(optionalField($body, 'email')),
]);

$fetch = $db->prepare('SELECT * FROM clinics WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['clinic' => $fetch->fetch()], 201);
