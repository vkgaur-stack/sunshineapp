<?php
require_once __DIR__ . '/../config/config.php';

// Talks to Razorpay's plain REST API directly via cURL rather than pulling
// in the razorpay/razorpay Composer package — Razorpay's API is simple
// enough (Basic Auth + JSON) that a full SDK isn't needed, and this keeps
// the whole backend dependency-free.

class RazorpayException extends Exception {}

function razorpayCreateOrder(int $amountInPaise, string $receipt, array $notes = []): array
{
    $keyId = env('RAZORPAY_KEY_ID');
    $keySecret = env('RAZORPAY_KEY_SECRET');

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => "$keyId:$keySecret",
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'receipt' => $receipt,
            'notes' => $notes,
        ]),
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new RazorpayException("Could not reach Razorpay: $curlError");
    }

    $decoded = json_decode($response, true);
    if ($httpCode >= 300) {
        $message = $decoded['error']['description'] ?? 'Unknown Razorpay error';
        throw new RazorpayException("Razorpay order creation failed: $message");
    }

    return $decoded;
}

// Verifies the payment signature Razorpay Checkout returns after a
// successful payment. This is a pure local HMAC computation — no network
// call — so it's the one piece of the Razorpay flow that's fully testable
// without live API credentials, and it's also the most security-critical
// part (this is what stops a forged "payment succeeded" request from the
// client being trusted blindly).
function razorpayVerifySignature(string $orderId, string $paymentId, string $signature): bool
{
    $keySecret = env('RAZORPAY_KEY_SECRET');
    $expected = hash_hmac('sha256', "$orderId|$paymentId", $keySecret);
    return hash_equals($expected, $signature);
}
