<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/razorpay.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$fullName = requireField($body, 'fullName', 'Name');
$mobileNumber = validateMobileNumber(requireField($body, 'mobileNumber', 'Mobile number'));
$amountInRupees = requireField($body, 'amountInRupees', 'Amount');
$email = validateEmail(optionalField($body, 'email'));
$purpose = optionalField($body, 'purpose', 'General Fund');

if (!is_numeric($amountInRupees) || $amountInRupees <= 0) {
    jsonError('Enter a valid donation amount.', 400);
}

$db = getDb();
$donorId = generateUuid();
$db->prepare('INSERT INTO donors (id, full_name, mobile_number, email, pan_number) VALUES (?, ?, ?, ?, ?)')
   ->execute([$donorId, $fullName, $mobileNumber, $email, optionalField($body, 'panNumber')]);

$amountInPaise = (int) round($amountInRupees * 100);

try {
    $order = razorpayCreateOrder($amountInPaise, "donation_$donorId", ['donorId' => $donorId, 'purpose' => $purpose]);
} catch (RazorpayException $e) {
    jsonError($e->getMessage(), 502);
}

$donationId = generateUuid();
$db->prepare('
    INSERT INTO donations (id, donor_id, amount_in_paise, purpose, razorpay_order_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
')->execute([$donationId, $donorId, $amountInPaise, $purpose, $order['id'], 'PENDING']);

jsonResponse([
    'donationId' => $donationId,
    'orderId' => $order['id'],
    'amount' => $amountInPaise,
    'currency' => 'INR',
    'keyId' => env('RAZORPAY_KEY_ID'),
], 201);
