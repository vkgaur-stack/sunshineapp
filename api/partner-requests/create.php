<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$category = validateEnum(
    requireField($body, 'category', 'Category'),
    ['CSR_PARTNER', 'MEDICAL_PARTNER', 'VOLUNTEER', 'DONOR', 'COMMUNITY_PARTNER'],
    'Category'
);
$orgOrName = requireField($body, 'orgOrName', 'Organisation/Name');
$contactName = requireField($body, 'contactName', 'Contact name');
$mobileNumber = validateMobileNumber(requireField($body, 'mobileNumber', 'Mobile number'));
$email = validateEmail(optionalField($body, 'email'));

$db = getDb();
$id = generateUuid();
$db->prepare('
    INSERT INTO partner_requests (id, category, org_or_name, contact_name, mobile_number, email, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
')->execute([$id, $category, $orgOrName, $contactName, $mobileNumber, $email, optionalField($body, 'message')]);

$fetch = $db->prepare('SELECT * FROM partner_requests WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['request' => $fetch->fetch()], 201);
