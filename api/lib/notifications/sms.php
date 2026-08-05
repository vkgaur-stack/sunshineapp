<?php
require_once __DIR__ . '/../../config/config.php';

// SMS gateway adapter (MSG91, Twilio, etc.) — the fallback channel for
// beneficiaries without WhatsApp/a smartphone. Same dev-fallback pattern.
function sendSms(string $to, string $message): array
{
    $apiUrl = env('SMS_API_URL');

    if (!$apiUrl) {
        error_log("[sms:dev-fallback] To: $to | Message: $message");
        return ['delivered' => false, 'mode' => 'log-fallback'];
    }

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . env('SMS_API_KEY'),
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'sender' => env('SMS_SENDER_ID', 'SNSHIN'),
            'to' => $to,
            'message' => $message,
        ]),
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 300) {
        throw new Exception("SMS send failed (HTTP $httpCode)");
    }

    return ['delivered' => true, 'mode' => 'api', 'response' => $response];
}
