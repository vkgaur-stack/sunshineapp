<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$fullName = requireField($body, 'fullName', 'Full name');
$mobileNumber = validateMobileNumber(requireField($body, 'mobileNumber', 'Mobile number'));
$email = validateEmail(optionalField($body, 'email'));
$message = requireField($body, 'message', 'Message');

$db = getDb();
$id = generateUuid();
$db->prepare('
    INSERT INTO contact_messages (id, full_name, mobile_number, email, subject, message)
    VALUES (?, ?, ?, ?, ?, ?)
')->execute([$id, $fullName, $mobileNumber, $email, optionalField($body, 'subject'), $message]);

$fetch = $db->prepare('SELECT * FROM contact_messages WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['message' => $fetch->fetch()], 201);
