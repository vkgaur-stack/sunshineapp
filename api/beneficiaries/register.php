<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();

$fullName = requireField($body, 'fullName', 'Full name');
$dateOfBirth = requireField($body, 'dateOfBirth', 'Date of birth');
$gender = requireField($body, 'gender', 'Gender');
$mobileNumber = validateMobileNumber(requireField($body, 'mobileNumber', 'Mobile number'));
$city = requireField($body, 'city', 'City');
$state = requireField($body, 'state', 'State');
$consentGiven = $body['consentGiven'] ?? false;

if ($consentGiven !== true) {
    jsonError('Consent is required to register', 400, ['field' => 'consentGiven']);
}

$email = validateEmail(optionalField($body, 'email'));
$preferredContact = validateEnum(optionalField($body, 'preferredContact', 'WHATSAPP'), ['PHONE', 'WHATSAPP', 'EMAIL'], 'Preferred contact');

$db = getDb();

$existing = $db->prepare('SELECT id FROM beneficiaries WHERE mobile_number = ?');
$existing->execute([$mobileNumber]);
if ($row = $existing->fetch()) {
    jsonError('A beneficiary with this mobile number is already registered.', 409, ['beneficiaryId' => $row['id']]);
}

$id = generateUuid();
$stmt = $db->prepare('
    INSERT INTO beneficiaries
        (id, full_name, date_of_birth, gender, mobile_number, email, address_line, city, state,
         service_interest, problem_notes, preferred_contact, consent_given, consent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
');
$stmt->execute([
    $id, $fullName, $dateOfBirth, $gender, $mobileNumber, $email,
    optionalField($body, 'addressLine'), $city, $state,
    optionalField($body, 'serviceInterest'), optionalField($body, 'problemNotes'),
    $preferredContact,
]);

$fetch = $db->prepare('SELECT * FROM beneficiaries WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['beneficiary' => $fetch->fetch()], 201);
