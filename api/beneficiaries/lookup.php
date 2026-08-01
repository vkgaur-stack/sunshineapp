<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$mobileNumber = validateMobileNumber(requireField($body, 'mobileNumber', 'Mobile number'));
$dateOfBirth = requireField($body, 'dateOfBirth', 'Date of birth');

$db = getDb();
$stmt = $db->prepare('SELECT * FROM beneficiaries WHERE mobile_number = ? AND date_of_birth = ?');
$stmt->execute([$mobileNumber, $dateOfBirth]);
$beneficiary = $stmt->fetch();

if (!$beneficiary) {
    jsonError('No matching registration found. Please register first.', 404);
}

jsonResponse(['beneficiary' => $beneficiary]);
